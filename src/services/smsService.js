/**
 * Simulated Carrier Dispatch Gateway
 * Emulates sub-second cellular modem packet transmission and TRAI DLT-compliant SMS payload creation.
 */
export const sendEmergencySMS = async (recipientNumber, mapsUrl) => {
    const cleanNumber = recipientNumber.replace(/\D/g, "").slice(-10);
    const locationText = mapsUrl
        ? `\n📍 LIVE GPS: ${mapsUrl}`
        : "\n📍 Location: Coordinates unavailable (Indoor Sentinel Fallback)";

    const payload = {
        header: "PEHRA-SENTINEL-DISPATCH",
        recipient: `+91 ${cleanNumber}`,
        body: `🚨 PEHRA SENTINEL DISTRESS ALERT 🚨\nAutomated transit acoustic threshold breached.${locationText}\nPlease verify passenger safety immediately.`,
        packetId: `PKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        status: "DELIVERED_SIMULATED",
    };

    // Simulate network latency of high-priority cellular relay (350ms)
    await new Promise((resolve) => setTimeout(resolve, 350));

    console.groupCollapsed(`%c[SIMULATED SMS GATEWAY] Dispatch -> ${payload.recipient}`, "color: #10b981; font-weight: bold;");
    console.info("Packet ID:", payload.packetId);
    console.info("Timestamp:", payload.timestamp);
    console.info("Simulated Payload:\n", payload.body);
    console.groupEnd();

    return {
        success: true,
        simulated: true,
        data: payload,
    };
};