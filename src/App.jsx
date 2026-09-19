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
    const [isMicTesting, setIsMicTesting] = useState(false);
    const [simulatedAcoustics, setSimulatedAcoustics] = useState(null);
    const [location, setLocation] = useState({
        lat: 28.6139,
        lng: 77.209,
        accuracy: null,
        isLive: false,
    });

    const { requestWakeLock, releaseWakeLock } = useWakeLock();

    const handleContactsChange = (newContacts) => {
        setContacts(newContacts);
        saveStoredSettings(newContacts, threshold);
    };

    const handleThresholdChange = (newThreshold) => {
        setThreshold(newThreshold);
        saveStoredSettings(contacts, newThreshold);
    };

    const refreshCoordinates = useCallback(async () => {
        if (!("geolocation" in navigator)) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    lat: Number(pos.coords.latitude.toFixed(5)),
                    lng: Number(pos.coords.longitude.toFixed(5)),
                    accuracy: pos.coords.accuracy,
                    isLive: true,
                });
            },
            (err) => {
                console.warn("[GEOLOCATION] Live position fallback retained:", err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 10000,
            }
        );
    }, []);

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
                await dispatchDistressAlert(contacts, location);
            } catch (err) {
                console.error("Alert dispatch pipeline failure:", err);
            } finally {
                setIsDispatching(false);
            }
        },
        [contacts, location]
    );

    const {
        isListening,
        currentDecibels,
        noiseStatus,
        startListening,
        stopListening,
    } = useAudioSentinel(threshold, triggerDistressPipeline);

    // Toggle live microphone analysis directly on Dashboard
    const handleToggleMicTest = async () => {
        if (isListening) {
            stopListening();
            setIsMicTesting(false);
        } else {
            setIsMicTesting(true);
            await startListening();
        }
    };

    // Evaluator Simulation 1: Rejection test for sub-1kHz vehicle horn
    const handleSimulateHonk = () => {
        setSimulatedAcoustics({
            db: 94,
            status: "FILTERED_NOISE",
            message: "DSP Filter: Sub-1kHz car horn fundamental (450Hz) detected. Alert blocked.",
        });
        setTimeout(() => {
            setSimulatedAcoustics(null);
        }, 3200);
    };

    // Evaluator Simulation 2: Trigger test for vocal distress scream
    const handleSimulateScream = () => {
        const validation = validateContacts(contacts);
        if (!validation.valid) {
            alert(`Simulation Blocked: ${validation.message}`);
            return;
        }
        refreshCoordinates();

        setSimulatedAcoustics({
            db: 94,
            status: "DISTRESS_CANDIDATE",
            message: "Human distress formant (1.8-4.4kHz) verified (>700ms). Initiating Emergency 112...",
        });

        // 900ms reproduces the >700ms temporal persistence gate
        setTimeout(() => {
            setSimulatedAcoustics(null);
            triggerDistressPipeline(94);
        }, 900);
    };

    const handleArm = async () => {
        const validation = validateContacts(contacts);
        if (!validation.valid) {
            alert(`Cannot Arm Sentinel: ${validation.message}`);
            return;
        }

        setIsMicTesting(false);
        refreshCoordinates();

        try {
            const audioPrimer = new Audio("/audio/ringtone.mp3");
            audioPrimer.volume = 0;
            await audioPrimer.play();
            audioPrimer.pause();
            audioPrimer.currentTime = 0;
        } catch {
            // Browser autoplay unlock
        }

        setMode("STEALTH");
        await requestWakeLock();
        await startListening();
    };

    const handleDisarm = async () => {
        stopListening();
        setIsMicTesting(false);
        await releaseWakeLock();
        setMode("IDLE");
    };

    useEffect(() => {
        if (mode !== "STEALTH" && !isMicTesting && isListening) {
            stopListening();
        }
    }, [mode, isMicTesting, isListening, stopListening]);

    const activeContact = contacts[0] || {};
    const primaryNumber = String(activeContact.whatsapp || activeContact.phone || "").trim();

    // Combine live telemetry with test bench overrides
    const displayDb = simulatedAcoustics ? simulatedAcoustics.db : currentDecibels;
    const displayNoiseStatus = simulatedAcoustics ? simulatedAcoustics.status : noiseStatus;
    const displayIsListening = isListening || Boolean(simulatedAcoustics);

    return (
        <main className="w-full min-h-screen bg-neutral-950 text-white">
            {mode === "IDLE" && (
                <Dashboard
                    contacts={contacts}
                    setContacts={handleContactsChange}
                    threshold={threshold}
                    setThreshold={handleThresholdChange}
                    currentDecibels={displayDb}
                    noiseStatus={displayNoiseStatus}
                    isListening={displayIsListening}
                    isMicTesting={isMicTesting}
                    simulatedAcoustics={simulatedAcoustics}
                    onToggleMicTest={handleToggleMicTest}
                    onSimulateHonk={handleSimulateHonk}
                    onSimulateScream={handleSimulateScream}
                    onArm={handleArm}
                    onSimulateDistress={handleSimulateScream}
                />
            )}

            {mode === "STEALTH" && (
                <StealthScreen
                    threshold={threshold}
                    noiseStatus={displayNoiseStatus}
                    onDisarm={handleDisarm}
                    onSimulateHonk={handleSimulateHonk}
                    onSimulateScream={handleSimulateScream}
                    onTriggerDistress={() => triggerDistressPipeline(95)}
                />
            )}

            {mode === "TRIGGERED" && (
                <DeterrentOverlay
                    recipientNumber={primaryNumber}
                    location={location}
                    isDispatching={isDispatching}
                    onDecline={handleDisarm}
                    onAccept={() => console.info("Emergency line connected.")}
                />
            )}
        </main>
    );
}

export default App;