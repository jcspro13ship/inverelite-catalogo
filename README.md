# InverElite — Catálogo Digital

Aplicación web de catálogo de productos, listas de precios y cotizaciones para **Elite Inversiones Agropecuarias SAS (InverElite)**.

## 🎯 Funcionalidades

- **Catálogo público** navegable, con búsqueda y filtros por categoría/proveedor.
- **3 listas de precios** (Punto de Venta, Veterinario, Público) — solo accesibles con contraseña.
- **Generador de cotizaciones** con datos del cliente, productos y descarga como PDF.
- **Compartir productos** por WhatsApp con link directo.
- **Datos en tiempo real desde Google Sheets** — los precios se actualizan editando el Sheet.

## 🔧 Cómo modificar productos, precios o categorías

**No necesitas tocar el código.** Todos los datos vienen del Google Sheet:

1. Abre el Sheet de InverElite en `sheets.google.com`
2. Edita lo que necesites (productos, precios, categorías, configuración)
3. Espera 5-10 minutos para que Google republique el CSV
4. La app web mostrará los cambios automáticamente

## 🔑 Acceso del equipo

La contraseña se valida en el servidor (Apps Script) y se guarda en las **Propiedades del script** con el nombre `PASSWORD_EQUIPO` (Apps Script → Configuración del proyecto). Ya no va en la pestaña `Config`, porque esa hoja es pública.

Con la sesión iniciada el equipo puede:

- Ver la **ficha interna** de cada producto (dosis, almacenamiento, transporte, notas), guardada en la pestaña privada `Fichas`.
- **Editar** cualquier producto y su ficha desde el botón "Editar".
- **Subir fotos** desde el celular o el computador; se guardan en la carpeta de fotos de Drive configurada en `FOTOS_FOLDER_ID`.
- **Activar o desactivar** productos del catálogo y filtrar los que no tienen foto.

La pestaña `Fichas` **no debe publicarse en la web**.

## 📱 Instalar como aplicación

La app se puede instalar en celulares y computadores (PWA). Al final de la página está el botón **Instalar aplicación**:

- **Android y Chrome/Edge en computador:** el botón abre el diálogo de instalación.
- **iPhone/iPad:** abrir en Safari → Compartir → "Agregar a inicio".
- **Safari en Mac:** Archivo → "Agregar al Dock".

Archivos: `manifest.webmanifest`, `sw.js` e `icons/`. El service worker solo guarda los archivos de la app; los datos siempre se leen de la red.

## ⚙️ Apps Script

El código del servidor está en `apps-script/Code.gs`. Para actualizarlo: pegarlo en Extensiones → Apps Script, ejecutar `setup` una vez y publicar una **nueva versión** de la implementación existente (así se conserva la URL).

## 📁 Estructura del proyecto

```
inverelite-catalogo/
├── index.html       ← Página principal (no editar)
├── config.js        ← URLs del Google Sheet (editar solo si cambias el Sheet)
├── app.js           ← Lógica de la app (no editar)
├── apps-script/     ← Código del servidor (se pega en Apps Script)
└── README.md        ← Este archivo
```

## 🚀 Despliegue

Esta app está diseñada para correr en **GitHub Pages** sin compilación.
Cualquier cambio en estos archivos requiere hacer commit + push al repositorio para que se actualice.

Para cambios de productos/precios, **edita el Google Sheet** — no requiere modificar el código.

## 📦 Tecnologías

- React 18 (vía CDN)
- Tailwind CSS (vía CDN)
- Babel Standalone (compila JSX en el navegador)
- PapaParse (lee los CSVs de Google Sheets)
- Lucide React (íconos)

---

© Elite Inversiones Agropecuarias SAS
