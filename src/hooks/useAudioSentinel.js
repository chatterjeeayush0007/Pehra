import { useState, useEffect, useRef, useCallback } from "react";

export function useAudioSentinel(threshold = 80, onDistressTriggered) {
    const [isListening, setIsListening] = useState(false);
    const [currentDecibels, setCurrentDecibels] = useState(0);
    const [noiseStatus, setNoiseStatus] = useState("NORMAL"); // 'NORMAL' | 'FILTERED_NOISE' | 'DISTRESS_CANDIDATE'

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const animFrameIdRef = useRef(null);
    const breachStartTimeRef = useRef(null);

    const SUSTAIN_REQUIRED_MS = 700; // Must sustain in scream register for 700ms

    const stopListening = useCallback(() => {
        if (animFrameIdRef.current) {
            cancelAnimationFrame(animFrameIdRef.current);
            animFrameIdRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }

        breachStartTimeRef.current = null;
        setIsListening(false);
        setCurrentDecibels(0);
        setNoiseStatus("NORMAL");
    }, []);

    const startListening = useCallback(async () => {
        stopListening();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false, // Keep raw signal so filtering is accurate
                    autoGainControl: false,
                },
            });
            streamRef.current = stream;

            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;

            if (audioCtx.state === "suspended") {
                await audioCtx.resume();
            }

            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 1024;
            analyser.smoothingTimeConstant = 0.2; // Fast response for live transit
            source.connect(analyser);
            analyserRef.current = analyser;

            setIsListening(true);

            const bufferLength = analyser.frequencyBinCount;
            const freqData = new Uint8Array(bufferLength);
            const timeData = new Uint8Array(analyser.fftSize);

            const sampleRate = audioCtx.sampleRate;
            const binWidth = sampleRate / analyser.fftSize;

            // Frequency Bin Ranges:
            // Low Band (Car Horn Fundamentals + Transit Rumble): 300Hz - 1000Hz
            const lowBinStart = Math.max(1, Math.floor(300 / binWidth));
            const lowBinEnd = Math.floor(1000 / binWidth);

            // Scream Band (Vocal Distress & Formant Spikes): 1800Hz - 4400Hz
            const screamBinStart = Math.floor(1800 / binWidth);
            const screamBinEnd = Math.min(bufferLength - 1, Math.floor(4400 / binWidth));

            const monitorAcoustics = () => {
                if (!analyserRef.current) return;

                // 1. Calculate Overall RMS Decibels
                analyser.getByteTimeDomainData(timeData);
                let sumSquares = 0;
                for (let i = 0; i < timeData.length; i++) {
                    const normalized = (timeData[i] - 128) / 128;
                    sumSquares += normalized * normalized;
                }
                const rms = Math.sqrt(sumSquares / timeData.length);
                const rawDb = 20 * Math.log10(Math.max(rms, 0.0001)) + 100;
                const liveDb = Math.round(Math.min(Math.max(rawDb, 0), 100));
                setCurrentDecibels(liveDb);

                // 2. Frequency Spectrum Analysis
                analyser.getByteFrequencyData(freqData);

                let lowBandEnergy = 0;
                let lowBandCount = 0;
                for (let i = lowBinStart; i <= lowBinEnd; i++) {
                    lowBandEnergy += freqData[i];
                    lowBandCount++;
                }
                const avgLowEnergy = lowBandEnergy / Math.max(lowBandCount, 1);

                let screamBandEnergy = 0;
                let screamBandCount = 0;
                for (let i = screamBinStart; i <= screamBinEnd; i++) {
                    screamBandEnergy += freqData[i];
                    screamBandCount++;
                }
                const avgScreamEnergy = screamBandEnergy / Math.max(screamBandCount, 1);

                // 3. Discrimination Criteria:
                // Car horns and vehicle engines have strong acoustic dominance in lowBand (< 1kHz).
                // Distress vocalizations shift energy into 1.8kHz - 4.4kHz.
                const isAcousticVolumeBreach = liveDb >= threshold;
                const isHumanScreamSignature =
                    avgScreamEnergy > 35 && avgScreamEnergy >= avgLowEnergy * 0.75;
                const isTransitNoise =
                    isAcousticVolumeBreach && avgLowEnergy > avgScreamEnergy * 1.5;

                const now = Date.now();

                if (isAcousticVolumeBreach) {
                    if (isTransitNoise) {
                        // Loud, but identified as low-frequency horn or transit noise
                        setNoiseStatus("FILTERED_NOISE");
                        breachStartTimeRef.current = null; // Reset persistence timer
                    } else if (isHumanScreamSignature) {
                        // High energy in the vocal distress band
                        setNoiseStatus("DISTRESS_CANDIDATE");

                        if (!breachStartTimeRef.current) {
                            breachStartTimeRef.current = now;
                        } else {
                            const sustainedTime = now - breachStartTimeRef.current;
                            if (sustainedTime >= SUSTAIN_REQUIRED_MS) {
                                console.warn(
                                    `[SENTINEL ACTIVATED] Verified Human Distress Scream: ${liveDb} dB, sustained for ${sustainedTime}ms`
                                );
                                breachStartTimeRef.current = null;
                                if (onDistressTriggered) {
                                    onDistressTriggered(liveDb);
                                }
                                return; // Stop animation loop once triggered
                            }
                        }
                    } else {
                        breachStartTimeRef.current = null;
                    }
                } else {
                    breachStartTimeRef.current = null;
                    setNoiseStatus("NORMAL");
                }

                animFrameIdRef.current = requestAnimationFrame(monitorAcoustics);
            };

            animFrameIdRef.current = requestAnimationFrame(monitorAcoustics);
        } catch (err) {
            console.error("[SENTINEL] Microphone capture error:", err);
            stopListening();
        }
    }, [threshold, onDistressTriggered, stopListening]);

    useEffect(() => {
        return () => {
            stopListening();
        };
    }, [stopListening]);

    return {
        isListening,
        currentDecibels,
        noiseStatus, // Exposes 'NORMAL' | 'FILTERED_NOISE' | 'DISTRESS_CANDIDATE'
        startListening,
        stopListening,
    };
}