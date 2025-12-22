import { useSyncExternalStore } from "react";

export interface AppSettings {
  n8nWebhookUrl: string;
  autoSendToN8n: boolean;
  theme: "light" | "dark" | "auto";
  articlesPerPage: number;
  showNotionButton: boolean;
  showDiscordButton: boolean;
  showMattermostButton: boolean;
}

const STORAGE_KEY = "dechno_settings";

const DEFAULT_SETTINGS: AppSettings = {
  n8nWebhookUrl: "",
  autoSendToN8n: false,
  theme: "light",
  articlesPerPage: 20,
  showNotionButton: true,
  showDiscordButton: true,
  showMattermostButton: true,
};

let listeners: Array<() => void> = [];
let cachedSettings: AppSettings | null = null;

function getSnapshot(): AppSettings {
  if (cachedSettings === null) {
    cachedSettings = loadSettings();
  }
  return cachedSettings;
}

function getServerSnapshot(): AppSettings {
  return DEFAULT_SETTINGS;
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange() {
  cachedSettings = null;
  for (const listener of listeners) {
    listener();
  }
}

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const storedSettings = localStorage.getItem(STORAGE_KEY);
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Error loading settings from localStorage:", error);
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    cachedSettings = settings;
    emitChange();
  } catch (error) {
    console.error("Error saving settings to localStorage:", error);
  }
}

export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateSettings = (updates: Partial<AppSettings>) => {
    const currentSettings = getSnapshot();
    const updatedSettings = { ...currentSettings, ...updates };
    saveSettings(updatedSettings);
  };

  const resetSettings = () => {
    saveSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
