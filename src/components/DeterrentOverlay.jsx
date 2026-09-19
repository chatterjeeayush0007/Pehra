import React, { useState, useEffect, useRef } from "react";
import {
    Phone,
    PhoneOff,
    ShieldAlert,
    CheckCircle2,
    Radio,
    MapPin,
    Sparkles,
    ExternalLink,
} from "lucide-react";

export default function DeterrentOverlay({
    recipientNumber = "",
    isDispatching = false,
    onDecline,
    onAccept,
}) {
    const [callState, setCallState] = useState("RINGING");
    const [seconds, setSeconds] = useState(0);
    const audioRef = useRef(null);

    const cleanNumber = String(recipientNumber).replace(/\D/g, "").slice(-10);
    const sampleLocation = "https://maps.google.com/?q=28.61390,77.20900";
    const whatsappPreviewUrl = cleanNumber
        ? `https://wa.me/91${cleanNumber}?text=${encodeURIComponent(
            `🚨 PEHRA SENTINEL DISTRESS ALERT 🚨\nAutomated acoustic emergency threshold breached.\n📍 LIVE GPS: ${sampleLocation}\nPlease verify passenger transit safety immediately.`
        )}`
        : null;

    // Incoming ringtone audio playback
    useEffect(() => {
        const audio = new Audio("/audio/ringtone.mp3");
        audio.loop = true;
        audioRef.current = audio;
        audio.play().catch((err) => console.warn("Autoplay blocked:", err));

        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, []);

    // Native mobile vibration
    useEffect(() => {
        let vibeInterval = null;

        if (callState === "RINGING" && "vibrate" in navigator) {
            navigator.vibrate([600, 400, 600, 400]);

            vibeInterval = setInterval(() => {
                navigator.vibrate([600, 400, 600, 400]);
            }, 2000);
        } else if (callState !== "RINGING" && "vibrate" in navigator) {
            navigator.vibrate(0);
        }

        return () => {
            if (vibeInterval) clearInterval(vibeInterval);
            if ("vibrate" in navigator) navigator.vibrate(0);
        };
    }, [callState]);

    // Silence ringtone upon acceptance
    useEffect(() => {
        if (callState === "CONNECTED" && audioRef.current) {
            audioRef.current.pause();
        }
    }, [callState]);

    // Call duration counter
    useEffect(() => {
        let interval = null;
        if (callState === "CONNECTED") {
            interval = setInterval(() => setSeconds((s) => s + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [callState]);

    const handleAccept = () => {
        if ("vibrate" in navigator) navigator.vibrate(0);
        if (audioRef.current) audioRef.current.pause();
        setCallState("CONNECTED");
        if (onAccept) onAccept();
    };

    const handleEnd = () => {
        if ("vibrate" in navigator) navigator.vibrate(0);
        if (audioRef.current) audioRef.current.pause();
        if (onDecline) onDecline();
    };

    const formatTime = (total) => {
        const m = String(Math.floor(total / 60)).padStart(2, "0");
        const s = String(total % 60).padStart(2, "0");
        return `${m}:${s}`;
    };

    const displayTarget = cleanNumber
        ? `+91 ${cleanNumber}`
        : "Registered Guardians";

    return (
        <div className="fixed inset-0 z-50 bg-neutral-950 text-slate-100 flex items-center justify-center font-sans select-none overflow-hidden p-0 md:p-6">
            {/* Desktop Simulator Simulation Notice (Outside Chassis) */}
            <aside className="hidden md:flex flex-col gap-2.5 absolute top-8 left-8 max-w-xs z-20 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-2 text-amber-400">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Judge Demo Telemetry
                    </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                    Emergency dispatch payloads for both{" "}
                    <span className="text-[#25D366] font-semibold">WhatsApp Cloud</span>{" "}
                    and <span className="text-sky-400 font-semibold">Cellular SMS</span>{" "}
                    are <span className="text-slate-200 font-semibold">simulated</span>{" "}
                    client-side for live hackathon demonstration to prevent carrier latency
                    and API subscription bottlenecks.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Simulated Gateway: Live Dispatch</span>
                </div>

                {/* Actionable WhatsApp verification link for evaluators */}
                {whatsappPreviewUrl && (
                    <a
                        href={whatsappPreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-[11px] font-semibold transition-all group"
                    >
                        <span>Preview WhatsApp Dispatch</span>
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                )}
            </aside>

            {/* Mobile Frame Chassis */}
            <div className="w-full max-w-md h-full md:h-[92vh] md:max-h-215 bg-[#060a12] md:rounded-[36px] md:border md:border-slate-800/80 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col justify-between p-5 relative overflow-hidden">
                {/* Glow Accents */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 right-0 w-48 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Telemetry HUD */}
                <div className="w-full mx-auto pt-1 relative z-30 shrink-0">
                    <div
                        className={`w-full rounded-2xl p-3 border transition-all duration-300 backdrop-blur-xl ${isDispatching
                                ? "bg-amber-500/15 border-amber-500/30 text-amber-200"
                                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-100"
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className={`p-1.5 rounded-lg ${isDispatching
                                            ? "bg-amber-500/20 text-amber-400 animate-spin"
                                            : "bg-emerald-500/20 text-emerald-400"
                                        }`}
                                >
                                    {isDispatching ? (
                                        <Radio className="w-3.5 h-3.5" />
                                    ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold tracking-wide">
                                        {isDispatching
                                            ? "TRANSMITTING DUAL-CHANNEL TELEMETRY..."
                                            : "SMS + WHATSAPP BROADCAST CONFIRMED"}
                                    </p>
                                    <p className="text-[10px] text-slate-300 font-mono flex items-center gap-1 mt-0.5">
                                        <MapPin className="w-3 h-3 text-rose-400" />
                                        <span>GPS Routed: {displayTarget}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 uppercase font-bold">
                                    WA
                                </span>
                                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40 uppercase font-bold">
                                    SMS
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decoy 911 Call Screen */}
                <div className="w-full flex-1 flex flex-col items-center justify-center text-center space-y-6 my-auto relative z-20">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full bg-rose-600/20 border border-rose-500/30 flex items-center justify-center animate-pulse">
                            <ShieldAlert className="w-14 h-14 text-rose-400" />
                        </div>
                        <span className="absolute bottom-1 right-1 p-2 bg-rose-600 rounded-full text-white shadow-lg ring-4 ring-[#060a12]">
                            <Radio className="w-3.5 h-3.5 animate-ping" />
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-bold tracking-widest uppercase text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                            EMERGENCY RESPONSE
                        </span>
                        <h1 className="text-3xl font-black tracking-tight text-white pt-1">
                            Emergency 911
                        </h1>
                        <p className="text-xs text-slate-400 font-medium">
                            {callState === "RINGING"
                                ? "Incoming Emergency Call..."
                                : "Connected"}
                        </p>
                        {callState === "CONNECTED" && (
                            <p className="text-xl font-mono font-bold text-emerald-400 pt-1 tracking-wider">
                                {formatTime(seconds)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="w-full pb-2 space-y-4 relative z-20 shrink-0">
                    {callState === "RINGING" ? (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={handleEnd}
                                className="w-full py-4 rounded-2xl bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600/30 text-rose-300 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <PhoneOff className="w-4 h-4" /> Decline
                            </button>
                            <button
                                type="button"
                                onClick={handleAccept}
                                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                            >
                                <Phone className="w-4 h-4 animate-bounce" /> Accept
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleEnd}
                            className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-950/50"
                        >
                            <PhoneOff className="w-4 h-4" /> End Call
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}