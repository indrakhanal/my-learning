"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let hasReloaded = false;
    navigator.serviceWorker.register("/sw.js").then(registration => registration.update()).catch(error => console.warn("Service worker registration failed", error));
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hasReloaded) { hasReloaded = true; window.location.reload(); }
    });
  }, []);
  return null;
}
