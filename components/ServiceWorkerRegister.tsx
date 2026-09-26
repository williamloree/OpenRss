"use client";

import { useEffect } from "react";
import { toast } from "sonner";

function promptUpdate(worker: ServiceWorker) {
  toast("Nouvelle version disponible", {
    id: "sw-update",
    duration: Infinity,
    action: {
      label: "Recharger",
      onClick: () => worker.postMessage("SKIP_WAITING"),
    },
  });
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker
      .register(`/sw.js?v=${process.env.NEXT_PUBLIC_APP_VERSION}`)
      .then((registration) => {
        // Pas de controller = première installation, rien à proposer
        if (registration.waiting && navigator.serviceWorker.controller) {
          promptUpdate(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              promptUpdate(worker);
            }
          });
        });

        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
      })
      .catch((error) => {
        console.error("[ServiceWorker] Registration failed:", error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
