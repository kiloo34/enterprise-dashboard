import { api } from "../utils/api";
import { Theme, Size, Language } from "../types";

export interface UISettings {
    theme?: Theme | "system";
    size?: Size;
    language?: Language;
}

export class UserService {
    /**
     * Update user specific UI settings persistenly to backend DB.
     */
    static async updateSettings(settings: UISettings): Promise<{ message: string; uiSettings: UISettings }> {
        return await api<{ message: string; uiSettings: UISettings }>("/api/user/settings", {
            method: "PUT",
            body: JSON.stringify({ uiSettings: settings }),
        });
    }
}
