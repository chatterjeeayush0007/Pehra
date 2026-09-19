import React, { useState } from "react";
import {
    Smartphone,
    Volume2,
    Info,
    ChevronRight,
    Sparkles,
    Plus,
    Trash2,
    Radio,
    MessageSquare,
    AlertCircle,
} from "lucide-react";

function RippleButton({ children, onClick, className = "", ...props }) {
    const [ripples, setRipples] = useState([]);

    const handlePointerDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const newRipple = {
            id: `${Date.now()}-${Math.random()}`,
            x,
            y,
            size,
        };

        setRipples((prev) => [...prev, newRipple]);
    };

    const removeRipple = (id) => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
    };

    return (
        <button
            {...props}
            onPointerDown={handlePointerDown}
            onClick={onClick}
            className={`relative overflow-hidden select-none cursor-pointer ${className}`}
        >
            {ripples.map((ripple) => (
                <span
                    key={ripple.id}
                    onAnimationEnd={() => removeRipple(ripple.id)}
                    className="absolute rounded-full bg-white/30 pointer-events-none anim-ripple"
                    style={{
                        top: ripple.y,
                        left: ripple.x,
                        width: ripple.size,
                        height: ripple.size,
                    }}
                />
            ))}
            <span className="relative z-10 flex items-center justify-center gap-2 w-full pointer-events-none">
                {children}
            </span>
        </button>
    );
}

export default function Dashboard({
    contacts = [],
    setContacts,
    threshold = 80,
    setThreshold,
    currentDecibels = 0,
    isListening = false,
    onArm,
    onSimulateDistress,
}) {
    const [validationError, setValidationError] = useState("");

    const contactList =
        Array.isArray(contacts) && contacts.length > 0
            ? contacts
            : [
                {
                    id: "contact-default",
                    whatsapp: "",
                    sms: "",
                    sameAsSms: true,
                    phone: "",
                },
            ];

    const meterWidth = Math.min(Math.max((currentDecibels / 100) * 100, 0), 100);

    const handleAddContact = () => {
        const newContact = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            whatsapp: "",
            sms: "",
            sameAsSms: true,
            phone: "",
        };
        setContacts([...contactList, newContact]);
        setValidationError("");
    };

    const handleRemoveContact = (id) => {
        if (contactList.length <= 1) return;
        setContacts(contactList.filter((c) => c.id !== id));
        setValidationError("");
    };

    const updateContactField = (id, field, value) => {
        if (validationError) setValidationError("");
        setContacts(
            contactList.map((c) => {
                if (c.id !== id) return c;
                const updated = { ...c, [field]: value };
                if (field === "whatsapp") {
                    updated.phone = value;
                }
                return updated;
            })
        );
    };

    const getDuplicateOwner = (currentId, num) => {
        if (!num || !/^\d{10}$/.test(num.trim())) return null;
        const cleanNum = num.trim();

        for (let i = 0; i < contactList.length; i++) {
            const c = contactList[i];
            if (c.id === currentId) continue;

            const otherWa = String(c.whatsapp || c.phone || "").trim();
            const otherSame = c.sameAsSms ?? true;
            const otherSms = String(c.sms || "").trim();

            if (otherWa === cleanNum) {
                return `Guardian #${i + 1} (WhatsApp)`;
            }

            if (!otherSame && otherSms === cleanNum) {
                return `Guardian #${i + 1} (SMS)`;
            }
        }
        return null;
    };

    const validateAll = () => {
        const registered = new Map();

        for (let i = 0; i < contactList.length; i++) {
            const c = contactList[i];
            const wa = String(c.whatsapp || c.phone || "").trim();
            const isSame = c.sameAsSms ?? true;
            const sms = String(c.sms || "").trim();
            const guardianLabel = `Guardian #${i + 1}`;

            if (!/^\d{10}$/.test(wa)) {
                return `${guardianLabel}: Please enter a valid 10-digit WhatsApp number.`;
            }

            if (!isSame && !/^\d{10}$/.test(sms)) {
                return `${guardianLabel}: Dedicated SMS is active. Please enter a valid 10-digit SMS mobile number.`;
            }

            if (!isSame && wa === sms) {
                return `${guardianLabel}: WhatsApp and SMS numbers are identical. Please toggle 'Same as SMS' on or provide a distinct SMS number.`;
            }

            if (registered.has(wa)) {
                return `Duplicate number (+91 ${wa}): ${guardianLabel} WhatsApp number is already registered under ${registered.get(wa)}.`;
            }
            registered.set(wa, `${guardianLabel} (WhatsApp)`);

            if (!isSame && sms) {
                if (registered.has(sms)) {
                    return `Duplicate number (+91 ${sms}): ${guardianLabel} SMS number is already registered under ${registered.get(sms)}.`;
                }
                registered.set(sms, `${guardianLabel} (SMS)`);
            }
        }
        return null;
    };

    const handleArmClick = () => {
        const error = validateAll();
        if (error) {
            setValidationError(error);
            return;
        }
        setValidationError("");
        if (onArm) onArm();
    };

    const handleSimulateClick = () => {
        const error = validateAll();
        if (error) {
            setValidationError(error);
            return;
        }
        setValidationError("");
        if (onSimulateDistress) onSimulateDistress();
    };

    return (
        <div className="w-full h-dvh bg-neutral-950 text-slate-100 flex items-center justify-center font-sans select-none overflow-hidden p-0 md:p-6 relative">
            <style>{`
        @keyframes clickRippleEffect {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(1); opacity: 0; }
        }
        .anim-ripple { animation: clickRippleEffect 550ms cubic-bezier(0.1, 0.7, 0.1, 1) forwards; }
      `}</style>

            {/* Desktop Simulator Aside */}
            <aside className="hidden md:flex flex-col gap-2.5 absolute top-8 left-8 max-w-xs z-20 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-2 text-violet-400">
                    <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <Smartphone className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Mobile View Simulator
                    </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pehra is optimized for transit emergencies. Features like the{" "}
                    <span className="text-slate-200 font-semibold">
                        OLED stealth blackout
                    </span>{" "}
                    and{" "}
                    <span className="text-slate-200 font-semibold">
                        decoy call screen
                    </span>{" "}
                    are framed in standard mobile dimensions.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Automated WhatsApp & SMS Gateway</span>
                </div>
            </aside>

            {/* Phone Chassis */}
            <div className="w-full max-w-md h-full md:h-[92vh] md:max-h-215 bg-[#080d1a] md:rounded-[36px] md:border md:border-slate-800/80 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col justify-between p-5 relative overflow-hidden">
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 right-0 w-48 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <header className="shrink-0 pt-1 pb-3 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="relative w-11 h-11 bg-linear-to-br from-violet-500/20 to-indigo-500/10 border border-violet-500/30 rounded-2xl shadow-sm flex items-center justify-center shrink-0 p-1">
                                <img
                                    src="/logo.png"
                                    alt="Pehra Logo"
                                    className="w-full h-full object-contain"
                                />
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#080d1a] animate-pulse" />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-black tracking-tight bg-linear-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                                        PEHRA
                                    </h1>
                                    <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full font-bold bg-violet-500/15 text-violet-300 border border-violet-500/20 shadow-xs">
                                        Sentinel
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    Autonomous Transit Distress Guard
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold tracking-wide">
                            <Radio className="w-3 h-3 animate-pulse" />
                            <span>STANDBY</span>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1 py-1 relative z-10 scrollbar-thin [scrollbar-color:#334155_transparent]">
                    {/* Emergency Contacts Card */}
                    <section className="bg-linear-to-b from-white/[0.06] to-white/2 border border-white/10 rounded-2xl p-4 shadow-sm backdrop-blur-md space-y-3.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                                    Emergency Contacts
                                </h2>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                                {contactList.length}{" "}
                                {contactList.length === 1 ? "Guardian" : "Guardians"}
                            </span>
                        </div>

                        <div className="space-y-3.5">
                            {contactList.map((contact, index) => {
                                const isSameAsSms = contact.sameAsSms ?? true;
                                const waNumber = String(contact.whatsapp || contact.phone || "").trim();
                                const smsNumber = String(contact.sms || "").trim();

                                const waIsValid = /^\d{10}$/.test(waNumber);
                                const waIsInvalid = waNumber.length > 0 && !waIsValid;
                                const waDupOwner = getDuplicateOwner(contact.id, waNumber);

                                const smsIsValid =
                                    !isSameAsSms && /^\d{10}$/.test(smsNumber);
                                const smsIsInvalid =
                                    !isSameAsSms && smsNumber.length > 0 && !smsIsValid;
                                const smsDupOwner =
                                    !isSameAsSms ? getDuplicateOwner(contact.id, smsNumber) : null;

                                return (
                                    <div
                                        key={contact.id || index}
                                        className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3 shadow-inner"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                                Guardian #{index + 1}
                                            </span>
                                            {contactList.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveContact(contact.id)}
                                                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                                                    title="Remove contact"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* WhatsApp Number (Primary) */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                <span className="flex items-center gap-1 text-emerald-300">
                                                    <span>WhatsApp Number</span>
                                                    <span className="text-rose-400 font-bold">*</span>
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                                        Required
                                                    </span>
                                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                                        Primary Relay
                                                    </span>
                                                </div>
                                            </div>
                                            <div
                                                className={`flex items-center rounded-xl bg-[#0a101f] border transition-all ${waDupOwner || waIsInvalid
                                                        ? "border-rose-500/80 ring-2 ring-rose-500/20"
                                                        : waIsValid
                                                            ? "border-emerald-500/60 ring-2 ring-emerald-500/15"
                                                            : "border-amber-500/50 focus-within:border-emerald-500/70 focus-within:ring-2 focus-within:ring-emerald-500/20"
                                                    }`}
                                            >
                                                <span className="px-3 text-xs font-semibold text-emerald-400 border-r border-slate-800 bg-slate-950/40 py-2.5 rounded-l-xl">
                                                    +91
                                                </span>
                                                <input
                                                    type="tel"
                                                    maxLength={10}
                                                    value={contact.whatsapp ?? contact.phone ?? ""}
                                                    onChange={(e) =>
                                                        updateContactField(
                                                            contact.id,
                                                            "whatsapp",
                                                            e.target.value.replace(/\D/g, "")
                                                        )
                                                    }
                                                    placeholder="Required: 10-digit WhatsApp number"
                                                    className="w-full bg-transparent px-3 py-2.5 text-sm font-medium tracking-wide focus:outline-none placeholder:text-slate-600 text-slate-100"
                                                />
                                            </div>
                                            {waDupOwner && (
                                                <p className="text-[10px] text-rose-400 font-semibold">
                                                    * Duplicate: Already assigned to {waDupOwner}
                                                </p>
                                            )}
                                            {!waDupOwner && waIsInvalid && (
                                                <p className="text-[10px] text-rose-400 font-medium">
                                                    * Must be exactly 10 digits to activate Sentinel
                                                </p>
                                            )}
                                            {waNumber.length === 0 && (
                                                <p className="text-[10px] text-amber-400/90 font-medium">
                                                    * WhatsApp number is required to activate Sentinel
                                                </p>
                                            )}
                                        </div>

                                        {/* "Same as SMS" Checkbox Toggle */}
                                        <div className="pt-0.5">
                                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={isSameAsSms}
                                                    onChange={(e) =>
                                                        updateContactField(
                                                            contact.id,
                                                            "sameAsSms",
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 accent-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                                                />
                                                <span className="text-[11px] font-medium text-slate-300 hover:text-white transition-colors">
                                                    Same as SMS
                                                </span>
                                            </label>
                                        </div>

                                        {/* Conditional Dedicated SMS Field */}
                                        {!isSameAsSms && (
                                            <div className="space-y-1 pt-1 animate-in fade-in duration-200">
                                                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                    <span className="flex items-center gap-1 text-sky-300">
                                                        <span>SMS Mobile Number</span>
                                                        <span className="text-rose-400 font-bold">*</span>
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                                            Required
                                                        </span>
                                                        <span className="text-[9px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                                                            Cellular Carrier
                                                        </span>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`flex items-center rounded-xl bg-[#0a101f] border transition-all ${smsDupOwner || (smsNumber.length > 0 && !smsIsValid)
                                                            ? "border-rose-500/80 ring-2 ring-rose-500/20"
                                                            : smsIsValid
                                                                ? "border-sky-500/60 ring-2 ring-sky-500/15"
                                                                : "border-amber-500/50 focus-within:border-sky-500/70 focus-within:ring-2 focus-within:ring-sky-500/20"
                                                        }`}
                                                >
                                                    <span className="px-3 text-xs font-semibold text-sky-400 border-r border-slate-800 bg-slate-950/40 py-2.5 rounded-l-xl">
                                                        +91
                                                    </span>
                                                    <input
                                                        type="tel"
                                                        maxLength={10}
                                                        value={contact.sms || ""}
                                                        onChange={(e) =>
                                                            updateContactField(
                                                                contact.id,
                                                                "sms",
                                                                e.target.value.replace(/\D/g, "")
                                                            )
                                                        }
                                                        placeholder="Required: 10-digit SMS mobile number"
                                                        className="w-full bg-transparent px-3 py-2.5 text-sm font-medium tracking-wide focus:outline-none placeholder:text-slate-600 text-slate-100"
                                                    />
                                                </div>
                                                {smsDupOwner && (
                                                    <p className="text-[10px] text-rose-400 font-semibold">
                                                        * Duplicate: Already assigned to {smsDupOwner}
                                                    </p>
                                                )}
                                                {!smsDupOwner && smsNumber.length > 0 && !smsIsValid && (
                                                    <p className="text-[10px] text-rose-400 font-medium">
                                                        * Must be exactly 10 digits to activate Sentinel
                                                    </p>
                                                )}
                                                {smsNumber.length === 0 && (
                                                    <p className="text-[10px] text-amber-400/90 font-medium">
                                                        * Dedicated SMS number is required while toggle is off
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <RippleButton
                                type="button"
                                onClick={handleAddContact}
                                className="w-full py-2.5 border border-dashed border-slate-700/80 hover:border-violet-500/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-violet-300 hover:bg-violet-500/5 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5 text-violet-400" />
                                <span>Add another guardian</span>
                            </RippleButton>
                        </div>
                    </section>

                    {/* Sensitivity Card */}
                    <section className="bg-linear-to-b from-white/[0.06] to-white/2 border border-white/10 rounded-2xl p-4 shadow-sm backdrop-blur-md space-y-3.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                    <Volume2 className="w-4 h-4" />
                                </div>
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                                    Acoustic Sensitivity
                                </h2>
                            </div>
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                {threshold} dB
                            </span>
                        </div>

                        <div className="space-y-2 pt-1">
                            <input
                                type="range"
                                min="65"
                                max="95"
                                step="1"
                                value={threshold}
                                onChange={(e) => setThreshold(Number(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
                            />
                            <div className="flex justify-between text-[10px] font-medium text-slate-400 px-0.5">
                                <span>65 dB (Spoken)</span>
                                <span className="text-emerald-400 font-semibold">
                                    80 dB (Distress shout)
                                </span>
                                <span>95 dB (Extreme)</span>
                            </div>
                        </div>

                        {isListening && (
                            <div className="pt-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                                <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    <span>Microphone Activity</span>
                                    <span
                                        className={
                                            currentDecibels >= threshold
                                                ? "text-rose-400 font-bold"
                                                : "text-emerald-400 font-bold font-mono"
                                        }
                                    >
                                        {currentDecibels} dB
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                                    <div
                                        className={`h-full rounded-full transition-all duration-75 ${currentDecibels >= threshold
                                                ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]"
                                                : "bg-linear-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                            }`}
                                        style={{ width: `${meterWidth}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
                            Acoustic levels sustaining over{" "}
                            <span className="text-emerald-400 font-semibold">
                                {threshold} dB
                            </span>{" "}
                            dispatch high-priority WhatsApp and SMS coordinate packets and trigger the 911 line.
                        </p>
                    </section>

                    {/* Operating Protocol */}
                    <section className="rounded-2xl border border-white/5 bg-white/3 p-3.5 space-y-2 backdrop-blur-md">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                            <Info className="w-3.5 h-3.5 text-amber-400" />
                            <span>Transit Safety Protocol</span>
                        </div>
                        <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                            <li>Display darkens completely to simulate an idle, sleeping phone.</li>
                            <li>Background Wake Lock keeps the acoustic monitor active during transit.</li>
                            <li>Double-tap anywhere during transit to safely disarm at your destination.</li>
                        </ul>
                    </section>
                </div>

                {/* Action Dock */}
                <footer className="shrink-0 space-y-2.5 pt-3.5 pb-1 relative z-10 border-t border-white/5 bg-[#080d1a]/95">
                    {validationError && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span className="font-medium">{validationError}</span>
                        </div>
                    )}

                    <RippleButton
                        onClick={handleArmClick}
                        className="w-full bg-linear-to-r from-violet-600 via-indigo-600 to-emerald-500 hover:from-violet-500 hover:to-emerald-400 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md shadow-indigo-950/40"
                    >
                        <span className="tracking-wide text-sm font-extrabold">
                            ARM & ACTIVATE SENTINEL
                        </span>
                        <ChevronRight className="w-4 h-4" />
                    </RippleButton>

                    <RippleButton
                        type="button"
                        onClick={handleSimulateClick}
                        className="w-full py-1 text-[11px] font-medium text-slate-500 hover:text-amber-400/90 transition-colors"
                    >
                        <Sparkles className="w-3 h-3 text-amber-400/70" />
                        <span>[Judge Demo Mode: Simulate Distress Spike]</span>
                    </RippleButton>
                </footer>
            </div>
        </div>
    );
}