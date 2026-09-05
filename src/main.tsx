import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

document.documentElement.classList.add("dark");

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
} else if ("serviceWorker" in navigator) {
  // Clear stale caches in development.
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) =>
      registrations.forEach((registration) => registration.unregister()),
    );
  caches
    .keys()
    .then((keys) =>
      keys
        .filter((key) => key.startsWith("countries-explorer-shell-"))
        .forEach((key) => caches.delete(key)),
    );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
