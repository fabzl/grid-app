# Build Guide - Grip App

Esta guía te ayudará a crear builds descargables de la app para Android e iOS.

## Prerequisitos

1. **Instalar EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Crear cuenta en Expo**:
   ```bash
   eas login
   ```

3. **Configurar el proyecto**:
   ```bash
   cd packages/mobile
   eas build:configure
   ```

## Build para Android (APK)

1. **Crear build de Android**:
   ```bash
   cd packages/mobile
   eas build --platform android --profile preview
   ```

2. **Obtener el link de descarga**:
   - Espera a que el build termine (puede tomar 10-20 minutos)
   - El comando mostrará un link de descarga directo
   - O ve a: https://expo.dev/accounts/[tu-usuario]/projects/grip/builds
   - Haz clic en el build completado y copia el link de descarga

3. **Actualizar downloads.json**:
   ```bash
   # Edita packages/landing/downloads.json
   # Pega el link de descarga en el campo "android"
   ```

## Build para iOS

**Nota**: Para iOS necesitas:
- Una cuenta de desarrollador de Apple ($99/año)
- Configurar certificados y provisioning profiles

1. **Crear build de iOS**:
   ```bash
   cd packages/mobile
   eas build --platform ios --profile preview
   ```

2. **Obtener el link**:
   - Si usas TestFlight: después del build, sube a TestFlight automáticamente
   - Link de TestFlight: `https://testflight.apple.com/join/[CODIGO]`
   - O descarga el .ipa manualmente desde la página de builds

3. **Actualizar downloads.json**:
   ```bash
   # Edita packages/landing/downloads.json
   # Pega el link de TestFlight o el link de descarga en "ios"
   ```

## Alternativa: Build local (solo Android APK)

Si prefieres construir localmente sin usar los servidores de Expo:

```bash
cd packages/mobile
eas build --platform android --profile preview --local
```

Esto requiere que tengas Android SDK instalado y configurado.

## Automatización

Puedes usar el script en `package.json`:

```bash
# Desde la raíz del proyecto
npm run mobile:build:android
npm run mobile:build:ios
```

## Actualizar Landing Page

Después de obtener los links de descarga:

1. Edita `packages/landing/downloads.json`:
   ```json
   {
     "android": "https://expo.dev/artifacts/eas/...",
     "ios": "https://testflight.apple.com/join/...",
     "web": "http://localhost:19006"
   }
   ```

2. Reinicia el servidor de landing page si está corriendo

Los botones de descarga se actualizarán automáticamente.

