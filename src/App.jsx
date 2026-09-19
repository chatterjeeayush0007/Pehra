import React, { useState, useEffect, useCallback } from "react";
import Dashboard from "./components/Dashboard";
import StealthScreen from "./components/StealthScreen";
import DeterrentOverlay from "./components/DeterrentOverlay";
import { useWakeLock } from "./hooks/useWakeLock";
import { useAudioSentinel } from "./hooks/useAudioSentinel";
import { dispatchDistressAlert } from "./services/alertDispatcher";
import { getStoredSettings, saveStoredSettings } from "./utils/storage";

function App() {
    const [mode, setMode] = useState("IDLE"); // 'IDLE' | 'STEALTH' | 'TRIGGERED'
    const [contacts, setContacts] = useState(() => getStoredSettings().contacts);
    const [threshold, setThreshold] = useState(() => getStoredSettings().threshold);
    const [isDispatching, setIsDispatching] = useState(false);

    const { requestWakeLock, releaseWakeLock } = useWakeLock();

    const handleContactsChange = (newContacts) => {
        setContacts(newContacts);
        saveStoredSettings(newContacts, threshold);
    };

    const handleThresholdChange = (newThreshold) => {
        setThreshold(newThreshold);
        saveStoredSettings(contacts, newThreshold);
    };

    const validateContacts = (contactList) => {
        if (!contactList || contactList.length === 0) {
            return {
                valid: false,
                message: "Please configure at least one emergency contact.",
            };
        }

        const registeredNumbers = new Map();

        for (let i = 0; i < contactList.length; i++) {
            const contact = contactList[i] || {};
            const waNumber = String(contact.whatsapp || contact.phone || "").trim();
            const isSameAsSms = contact.sameAsSms ?? true;
            const smsNumber = String(contact.sms || "").trim();
            const guardianLabel = `Guardian #${i + 1}`;

            if (!/^\d{10}$/.test(waNumber)) {
                return {
                    valid: false,
                    message: `${guardianLabel}: Please enter a valid 10-digit WhatsApp number.`,
                };
            }

            if (!isSameAsSms && !/^\d{10}$/.test(smsNumber)) {
                return {
                    valid: false,
                    message: `${guardianLabel}: 'Same as SMS' is disabled. Please provide a valid 10-digit SMS mobile number.`,
                };
            }

            if (!isSameAsSms && waNumber === smsNumber) {
                return {
                    valid: false,
                    message: `${guardianLabel}: WhatsApp and SMS numbers are identical. Please toggle 'Same as SMS' on or provide a distinct SMS number.`,
                };
            }

            if (registeredNumbers.has(waNumber)) {
                return {
                    valid: false,
                    message: `Duplicate (+91 ${waNumber}): ${guardianLabel} WhatsApp number is already assigned under ${registeredNumbers.get(waNumber)}.`,
                };
            }
            registeredNumbers.set(waNumber, `${guardianLabel} (WhatsApp)`);

            if (!isSameAsSms && smsNumber) {
                if (registeredNumbers.has(smsNumber)) {
                    return {
                        valid: false,
                        message: `Duplicate (+91 ${smsNumber}): ${guardianLabel} SMS number is already assigned under ${registeredNumbers.get(smsNumber)}.`,
                    };
                }
                registeredNumbers.set(smsNumber, `${guardianLabel} (SMS)`);
            }
        }

        return { valid: true };
    };

    const triggerDistressPipeline = useCallback(
        async (peakDb = 0) => {
            const validation = validateContacts(contacts);
            if (!validation.valid) {
                alert(`Sentinel blocked: ${validation.message}`);
                return;
            }

            console.warn(`[DISTRESS INITIATED] Peak acoustic level: ${peakDb} dB`);
            setMode("TRIGGERED");
            setIsDispatching(true);

            try {
                await dispatchDistressAlert(contacts);
            } catch (err) {
                console.error("Alert dispatch pipeline failure:", err);
            } finally {
                setIsDispatching(false);
            }
        },
        [contacts]
    );

    const { isListening, currentDecibels, startListening, stopListening } =
        useAudioSentinel(threshold, triggerDistressPipeline);

    const handleArm = async () => {
        const validation = validateContacts(contacts);
        if (!validation.valid) {
            alert(`Cannot Arm Sentinel: ${validation.message}`);
            return;
        }

        try {
            const audioPrimer = new Audio("/audio/ringtone.mp3");
            audioPrimer.volume = 0;
            await audioPrimer.play();
            audioPrimer.pause();
            audioPrimer.currentTime = 0;
        } catch {
            // Browser autoplay permissions catch
        }

        setMode("STEALTH");
        await requestWakeLock();
        await startListening();
    };

    const handleSimulateDistress = () => {
        const validation = validateContacts(contacts);
        if (!validation.valid) {
            alert(`Simulation Blocked: ${validation.message}`);
            return;
        }
        triggerDistressPipeline(92);
    };

    const handleDisarm = async () => {
        stopListening();
        await releaseWakeLock();
        setMode("IDLE");
    };

    useEffect(() => {
        if (mode !== "STEALTH" && isListening) {
            stopListening();
        }
    }, [mode, isListening, stopListening]);

    const activeContact = contacts[0] || {};
    const primaryNumber = String(activeContact.whatsapp || activeContact.phone || "").trim();

    return (
        <main className="w-full min-h-screen bg-neutral-950 text-white">
            {mode === "IDLE" && (
                <Dashboard
                    contacts={contacts}
                    setContacts={handleContactsChange}
                    threshold={threshold}
                    setThreshold={handleThresholdChange}
                    currentDecibels={currentDecibels}
                    isListening={isListening}
                    onArm={handleArm}
                    onSimulateDistress={handleSimulateDistress}
                />
            )}

            {mode === "STEALTH" && (
                <StealthScreen
                    threshold={threshold}
                    onDisarm={handleDisarm}
                    onTriggerDistress={() => triggerDistressPipeline(95)}
                />
            )}

            {mode === "TRIGGERED" && (
                <DeterrentOverlay
                    recipientNumber={primaryNumber}
                    isDispatching={isDispatching}
                    onDecline={handleDisarm}
                    onAccept={() => console.info("Emergency line connected.")}
                />
            )}
        </main>
    );
}

export default App;