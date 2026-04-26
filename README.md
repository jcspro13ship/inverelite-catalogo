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

La contraseña para acceder a las listas de precios y cotizaciones se configura desde el Sheet, en la pestaña `Config`, fila `password_equipo`.

## 📁 Estructura del proyecto

```
inverelite-catalogo/
├── index.html       ← Página principal (no editar)
├── config.js        ← URLs del Google Sheet (editar solo si cambias el Sheet)
├── app.js           ← Lógica de la app (no editar)
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
