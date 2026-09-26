"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

// Événement non standard (Chromium), absent des types DOM
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!installEvent) return null;

  const handleInstall = async () => {
    await installEvent.prompt();
    await installEvent.userChoice;
    // Un événement ne peut être utilisé qu'une fois
    setInstallEvent(null);
  };

  return (
    <button
      data-umami-event="Install PWA"
      onClick={handleInstall}
      className="p-3 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-all shadow-md hover:shadow-lg"
      title="Installer l'application"
    >
      <Download className="w-5 h-5" />
    </button>
  );
}
