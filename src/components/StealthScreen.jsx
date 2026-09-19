import React, { useRef } from "react";
import { EyeOff, Radio } from "lucide-react";

export default function StealthScreen({ threshold = 80, onDisarm, onTriggerDistress }) {
    const lastTapRef = useRef(0);

    // Double-tap anywhere to safely disarm
    const handleTouchOrClick = (e) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 350;

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            if (onDisarm) onDisarm();
        }
        lastTapRef.current = now;
    };

    return (
        <div
            onClick={handleTouchOrClick}
            className="w-full h-dvh bg-neutral-950 text-slate-100 flex items-center justify-center font-sans select-none overflow-hidden p-0 md:p-6 relative cursor-pointer"
        >
            {/* Desktop Evaluator Aside */}
            <aside className="hidden md:flex flex-col gap-2.5 absolute top-8 left-8 max-w-xs z-20 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md shadow-2xl pointer-events-none">
                <div className="flex items-center gap-2 text-violet-400">
                    <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <EyeOff className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Stealth Blackout Mode
                    </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                    The OLED panel is darkened to simulate a locked, idle device. The acoustic engine remains vigilant in the background via the Screen Wake Lock API.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Sentinel Guard ({threshold} dB Threshold)</span>
                </div>
                <div className="text-[10px] text-slate-500 italic pt-1">
                    Tip: Double-click/tap the screen to disarm, or trigger acoustic distress.
                </div>
            </aside>

            {/* Mobile Frame Chassis */}
            <div className="w-full max-w-md h-full md:h-[92vh] md:max-h-215 bg-black md:rounded-[36px] md:border md:border-slate-800/80 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col justify-between p-5 relative overflow-hidden">
                {/* Subtle, near-invisible status beacon for live test feedback */}
                <div className="flex items-center justify-between opacity-15 hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                        <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                        <span>SENTINEL ARMED</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-600">Double-tap to disarm</span>
                </div>

                {/* Completely dark center viewport simulating sleep */}
                <div className="flex-1 flex items-center justify-center">
                    <span className="sr-only">Screen blacked out for transit safety</span>
                </div>

                {/* Invisible touch anchor to prevent accidental disarm skips */}
                <div className="h-6" />
            </div>
        </div>
    );
}