import { useState, useEffect, useCallback } from "react";

// Keeps the mobile display active during transit to prevent OS background process freezing
export const useWakeLock = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [wakeLockSentinel, setWakeLockSentinel] = useState(null);

    useEffect(() => {
        setIsSupported("wakeLock" in navigator);
    }, []);

    const requestWakeLock = useCallback(async () => {
        if (!("wakeLock" in navigator)) {
            console.warn("Screen Wake Lock API not supported on this browser.");
            return false;
        }

        try {
            const sentinel = await navigator.wakeLock.request("screen");
            setWakeLockSentinel(sentinel);
            setIsLocked(true);

            sentinel.addEventListener("release", () => {
                setIsLocked(false);
                setWakeLockSentinel(null);
            });

            return true;
        } catch (err) {
            console.warn(`Wake Lock acquisition failed: ${err.message}`);
            setIsLocked(false);
            return false;
        }
    }, []);

    const releaseWakeLock = useCallback(async () => {
        if (wakeLockSentinel) {
            try {
                await wakeLockSentinel.release();
            } catch (err) {
                console.warn("Wake Lock release failed:", err);
            }
            setWakeLockSentinel(null);
            setIsLocked(false);
        }
    }, [wakeLockSentinel]);

    // Re-acquire lock automatically if user minimizes and returns to the browser
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === "visible" && isLocked && !wakeLockSentinel) {
                await requestWakeLock();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isLocked, wakeLockSentinel, requestWakeLock]);

    return {
        isSupported,
        isLocked,
        requestWakeLock,
        releaseWakeLock,
    };
};