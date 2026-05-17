import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();
const isLocalDev =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const API_BASE =
  configuredBaseUrl || (isLocalDev ? "http://localhost:3000/api" : "/api");
const API_KEY = import.meta.env.VITE_API_KEY || "";

if (!configuredBaseUrl && !isLocalDev) {
  console.warn(
    "VITE_API_URL is not set. Production builds will call /api on the current origin; configure VITE_API_URL in Netlify if your backend is hosted elsewhere.",
  );
}

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
  },
});

export default api;
