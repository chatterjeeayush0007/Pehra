import { sendEmergencySMS } from "./smsService";
import { sendEmergencyWhatsApp } from "./whatsappService";

const getCurrentPosition = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            () => {
                console.warn("[GEOLOCATION] Access unavailable. Using baseline station coordinates.");
                resolve({ latitude: 28.6139, longitude: 77.2090 });
            },
            { enableHighAccuracy: true, timeout: 3500, maximumAge: 0 }
        );
    });
};

export const dispatchDistressAlert = async (contacts) => {
    const validContacts = contacts.filter((c) => {
        const wa = (c.whatsapp || c.phone || "").trim();
        return /^\d{10}$/.test(wa);
    });

    if (validContacts.length === 0) {
        console.warn("[ALERT DISPATCHER] Aborted: No valid 10-digit recipients provided.");
        return [];
    }

    const coords = await getCurrentPosition();
    const mapsUrl = coords
        ? `https://maps.google.com/?q=${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)}`
        : null;

    const dispatchPromises = validContacts.flatMap((contact) => {
        const waNumber = (contact.whatsapp || contact.phone || "").trim();
        const smsNumber = (
            contact.sameAsSms !== false ? waNumber : (contact.sms || waNumber)
        ).trim();

        return [
            sendEmergencyWhatsApp(waNumber, mapsUrl),
            sendEmergencySMS(smsNumber, mapsUrl),
        ];
    });

    const results = await Promise.allSettled(dispatchPromises);
    console.info("[ALERT DISPATCHER] Dual-channel dispatch cycle complete:", results);
    return results;
};