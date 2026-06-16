// =====================================================================
// 🔧 CONFIGURACIÓN — InverElite
// =====================================================================
// Las URLs ya están configuradas con tu Google Sheet y Apps Script.
// Si en el futuro necesitas cambiarlas, reemplaza los valores aquí
// y haz commit del archivo.
// =====================================================================

window.INVERELITE_CONFIG = {
  // === URLs de lectura (CSV publicados desde el Sheet) ===
  URL_PRODUCTOS: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSdKQWrotEiFPm_DlNKUDC6CZpqISQluDLYwQybTf0EG1nf2psTSTSkq-YPeuETTHJC-2a4mr_GSZzd/pub?gid=150160099&single=true&output=csv",

  URL_CATEGORIAS: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSdKQWrotEiFPm_DlNKUDC6CZpqISQluDLYwQybTf0EG1nf2psTSTSkq-YPeuETTHJC-2a4mr_GSZzd/pub?gid=1352817599&single=true&output=csv",

  URL_CONFIG: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSdKQWrotEiFPm_DlNKUDC6CZpqISQluDLYwQybTf0EG1nf2psTSTSkq-YPeuETTHJC-2a4mr_GSZzd/pub?gid=146010779&single=true&output=csv",

  URL_VENDEDORES: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSdKQWrotEiFPm_DlNKUDC6CZpqISQluDLYwQybTf0EG1nf2psTSTSkq-YPeuETTHJC-2a4mr_GSZzd/pub?gid=1165722370&single=true&output=csv",

  // === URL del Apps Script (para guardar cotizaciones/pedidos) ===
  URL_API: "https://script.google.com/macros/s/AKfycbw-ETTIQcx2LgQPUzE-I4RAc9A6zeJ5MzESO2B-EnCPzKNwQLXVJyGUHDsVVboVusmh/exec",
};
