// Native Web Audio API dual-tone phone ring synthesizer (Zero asset dependency fallback)
let audioCtx = null;
let isPlaying = false;
let ringInterval = null;

export const playSyntheticRing = () => {
    if (isPlaying) return;
    isPlaying = true;

    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        audioCtx = new AudioContextClass();

        const ringBurst = () => {
            if (!isPlaying || !audioCtx) return;

            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const now = audioCtx.currentTime;

            // Dual tone frequencies (Standard telecom ring cadence: 440Hz + 480Hz)
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(440, now);
            osc2.frequency.setValueAtTime(480, now);

            // Envelope: ramp up, stay loud for 1.8s, ramp down
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
            gainNode.gain.setValueAtTime(0.3, now + 1.8);
            gainNode.gain.linearRampToValueAtTime(0, now + 1.9);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 2);
            osc2.stop(now + 2);
        };

        ringBurst();
        // Repeating cadence: 2 seconds ring, 2 seconds silence (4 second cycle)
        ringInterval = setInterval(ringBurst, 4000);
    } catch (err) {
        console.warn('Synthesizer audio playback failed', err);
    }
};

export const stopSyntheticRing = () => {
    isPlaying = false;
    if (ringInterval) {
        clearInterval(ringInterval);
        ringInterval = null;
    }
    if (audioCtx) {
        try {
            audioCtx.close();
        } catch (_) { }
        audioCtx = null;
    }
};