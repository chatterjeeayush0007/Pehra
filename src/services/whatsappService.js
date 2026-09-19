export const sendEmergencyWhatsApp = async (recipientNumber, mapsUrl) => {
    const cleanNumber = recipientNumber.replace(/\D/g, "").slice(-10);
    const locationText = mapsUrl
        ? `\n📍 LIVE GPS: ${mapsUrl}`
        : "\n📍 Location: Indoor Sentinel Baseline";

    const payload = {
        messaging_product: "whatsapp",
        to: `+91 ${cleanNumber}`,
        body: `🚨 PEHRA DISTRESS ALERT 🚨\nAcoustic anomaly detected.${locationText}`,
        timestamp: new Date().toISOString(),
    };

    await new Promise((resolve) => setTimeout(resolve, 350));
    console.info("[SIMULATED WHATSAPP]", payload);

    return { success: true, simulated: true };
};