# Guía de Deployment - Grip App

## Estado del Backend

El backend Holochain está configurado y compila correctamente. El archivo WASM se genera en:
```
packages/backend/target/wasm32-unknown-unknown/release/grip_backend.wasm
```

## Desplegar App Móvil para Clientes (Expo)

### Opción 1: Expo Development Build (Recomendado para Testing)

Esta opción permite crear builds instalables para Android/iOS que los clientes pueden descargar directamente.

#### Prerequisitos:
1. Instalar Expo CLI globalmente:
```bash
npm install -g expo-cli
```

2. Tener una cuenta de Expo (gratis):
```bash
npx expo login
```

#### Para Android (APK):
```bash
cd packages/mobile
npx expo build:android --type apk
```

O usando EAS Build (recomendado):
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar build
eas build:configure

# Build para Android APK
eas build --platform android --profile preview
```

#### Para iOS (Ad-Hoc):
```bash
eas build --platform ios --profile preview
```

### Opción 2: Expo Go (Más Rápido para Testing Temprano)

Los clientes pueden descargar Expo Go desde Play Store/App Store y escanear un QR code:

```bash
cd packages/mobile
npx expo start
```

Luego compartir el QR code o link con los clientes.

**Limitaciones**: Algunas funcionalidades nativas pueden no funcionar en Expo Go.

### Opción 3: Web App (PWA)

Para distribución web:

```bash
cd packages/mobile
npx expo export --platform web
```

Los archivos estáticos se generan en `packages/mobile/dist/` y pueden subirse a cualquier hosting.

### Opción 4: EAS Build (Producción)

Para builds de producción con código nativo:

1. Configurar `eas.json`:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    }
  }
}
```

2. Build:
```bash
eas build --platform android --profile preview
```

3. Distribuir:
- Descargar el APK/IPA desde el dashboard de Expo
- Compartir el link de descarga con clientes
- O usar EAS Submit para subir a Play Store/App Store

## Build Scripts Rápidos

Crear scripts en `package.json` para facilitar:

```json
{
  "scripts": {
    "mobile:build:android": "cd packages/mobile && eas build --platform android --profile preview",
    "mobile:build:ios": "cd packages/mobile && eas build --platform ios --profile preview",
    "mobile:build:web": "cd packages/mobile && npx expo export --platform web",
    "mobile:start": "cd packages/mobile && npx expo start"
  }
}
```

## Configuración de app.json

Asegúrate de actualizar `packages/mobile/app.json` con:
- `name`: Nombre de la app
- `slug`: Identificador único
- `version`: Versión (ej: "1.0.0")
- `orientation`: Orientación de pantalla
- Iconos y splash screen en `./assets/`

## Distribución Rápida para Testing

### Método Más Rápido (Expo Go):
1. Ejecutar: `npm run mobile:start`
2. Compartir el QR code o link con clientes
3. Clientes instalan Expo Go y escanean

### Método Instalable (APK):
1. Ejecutar: `eas build --platform android --profile preview`
2. Esperar a que termine el build (15-30 min)
3. Descargar APK desde dashboard de Expo
4. Compartir APK con clientes (pueden instalarlo directamente)

## Notas Importantes

- Para builds de producción necesitarás:
  - Certificados de desarrollo (iOS)
  - Keystore de Android
  - Configuración de EAS Build
  
- El backend Holochain funciona independientemente
- La app móvil puede funcionar sin backend inicialmente (con datos mock)
- Para producción, necesitarás configurar la conexión al backend Holochain


