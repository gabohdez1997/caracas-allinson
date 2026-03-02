# Caracas & Allison SPA PWA

Sistema de gestión para promocionar rifas, eventos y realizar el reporte de pagos, construido como una Single Page Application (SPA) y Progressive Web App (PWA) moderna.

## 🚀 Características Principales

*   **PWA Completa:** Soporte offline e instalable gracias a Vite PWA.
*   **Diseño Moderno ("Glassmorphism"):** Interfaz atractiva y minimalista utilizando `Tailwind CSS v4`.
*   **Totalmente Responsivo:** Prioridad ("Mobile-first") para la mejor experiencia de usuario en teléfonos y pantallas de todo tamaño.
*   **Gestión de Pagos:** Formulario público para que los clientes puedan reportar fácil y rápidamente sus transacciones.
*   **Dashboard Administrativo:** Interfaz para administrar rifas, eventos y revisión/aprobación de pagos.
*   **Listo para Vercel:** Despliegue estático configurado mediante `@sveltejs/adapter-static`.
*   **Control de Accesos (DRBAC):** Estructura preparada en Supabase para manejo avanzado de roles y permisos.

## 🛠️ Tecnologías Utilizadas

*   [SvelteKit](https://kit.svelte.dev/) - Framework Frontend reactivo.
*   [Tailwind CSS v4](https://tailwindcss.com/) - Utilidades de estilos (incluyendo Tailwind Vite Plugin).
*   [Supabase](https://supabase.com/) - Backend as a Service (Autenticación y Base de Datos PostgreSQL).
*   [Vite PWA](https://vite-pwa-org.netlify.app/) - Integración para soporte PWA.

## 📦 Desarrollo Local

Este proyecto requiere **Node.js 22.12+ o Node.js 24+**.

### Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/gabohdez1997/caracas-allinson.git
```

2. Entra al directorio del proyecto:
```bash
cd caracas-allinson
```

3. Instala las dependencias:
```bash
npm install
```

### Ejecutar el Servidor de Desarrollo

Para iniciar el servidor local con recarga en vivo:

```bash
npm run dev
# o bien, para abrirlo automáticamente en tu navegador:
npm run dev -- --open
```

### Construcción para Producción

Para generar una versión estática de la aplicación lista para producción:

```bash
npm run build
```

Puedes previsualizar la versión construida ejecutando:
```bash
npm run preview
```

## 🔒 Base de Datos y Supabase

El esquema SQL inicial, incluyendo tablas, roles (DRBAC) y políticas de seguridad por nivel de fila (RLS), se encuentra en el directorio:
`supabase/migrations/20260225_init.sql`

Asegúrate de configurar tus variables de entorno locales `.env` con las credenciales de tu proyecto Supabase:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

## 📝 Control de Versiones

Este proyecto utiliza convenciones de *Semantic Versioning* (SemVer) en sus commits.
Formato: `[Tipo] vX.X.X: Descripción del cambio`
Ejemplos de Tipo: `[Feat]`, `[Fix]`, `[Docs]`, `[Chore]`, `[Style]`.

---
*Desarrollado para Caracas & Allison.*
