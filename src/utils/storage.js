const STORAGE_KEY = "pehra_settings";

export const getStoredSettings = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {
                contacts: [
                    {
                        id: "contact-default",
                        whatsapp: "",
                        sms: "",
                        sameAsSms: true,
                        phone: "",
                    },
                ],
                threshold: 80,
            };
        }

        const data = JSON.parse(raw);

        // Migrate existing items to guarantee full field structure
        const migratedContacts = (data.contacts || []).map((c, index) => {
            const primaryNumber = (c.whatsapp || c.phone || "").trim();
            return {
                id: c.id || `contact-${Date.now()}-${index}`,
                whatsapp: primaryNumber,
                sms: c.sms || "",
                sameAsSms: c.sameAsSms ?? true,
                phone: primaryNumber,
            };
        });

        return {
            contacts:
                migratedContacts.length > 0
                    ? migratedContacts
                    : [
                        {
                            id: "contact-default",
                            whatsapp: "",
                            sms: "",
                            sameAsSms: true,
                            phone: "",
                        },
                    ],
            threshold: typeof data.threshold === "number" ? data.threshold : 80,
        };
    } catch (error) {
        console.warn("[STORAGE] Failed to parse local settings, resetting:", error);
        return {
            contacts: [
                {
                    id: "contact-default",
                    whatsapp: "",
                    sms: "",
                    sameAsSms: true,
                    phone: "",
                },
            ],
            threshold: 80,
        };
    }
};

export const saveStoredSettings = (contacts, threshold) => {
    try {
        const payload = {
            contacts,
            threshold,
            updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
        console.error("[STORAGE] Failed to persist settings:", error);
    }
};