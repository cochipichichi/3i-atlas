// config.js - producción
// Reemplaza esta URL por tu Apps Script desplegado en modo web
const ATLAS_CONFIG = {
  MODE: "production",
  GSCRIPT_URL: "https://script.google.com/macros/s/TU_SCRIPT_PROD/exec",
  MAP_SOURCE: "sheets", // "sheets" | "local"
  FALLBACK_JSON: "./data/observaciones.json",
  VERSION: "1.0.0-prod"
};
