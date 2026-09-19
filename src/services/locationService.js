// High-accuracy GPS coordinates snapshot acquisition
export const getCurrentLocation = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({
                success: false,
                error: "Geolocation API not supported by this browser.",
                mapsUrl: null,
            });
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0,
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
                resolve({
                    success: true,
                    latitude,
                    longitude,
                    accuracy: Math.round(accuracy),
                    mapsUrl,
                });
            },
            (error) => {
                console.warn("High-accuracy GPS failed, fallback triggered:", error.message);
                resolve({
                    success: false,
                    error: error.message,
                    mapsUrl: null,
                });
            },
            options
        );
    });
};