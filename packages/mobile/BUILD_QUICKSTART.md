# 🚀 Guía Rápida - Construir Apps Descargables

## Paso 1: Instalar EAS CLI
```bash
npm install -g eas-cli
```

## Paso 2: Iniciar sesión en Expo
```bash
eas login
```

## Paso 3: Configurar el proyecto (solo la primera vez)
```bash
cd packages/mobile
eas build:configure
```

## Paso 4: Construir Android APK
```bash
# Desde la raíz del proyecto
npm run mobile:build:android

# O desde packages/mobile
cd packages/mobile
eas build --platform android --profile preview
```

**Espera 10-20 minutos** y luego:
1. Ve a https://expo.dev
2. Entra a tu proyecto "grip"
3. Ve a la sección "Builds"
4. Copia el link de descarga del APK

## Paso 5: Construir iOS (requiere cuenta de Apple Developer)

```bash
npm run mobile:build:ios
```

**Nota**: Necesitas una cuenta de desarrollador de Apple ($99/año).

## Paso 6: Actualizar downloads.json

Edita `packages/landing/downloads.json` y pega los links:

```json
{
  "android": "https://expo.dev/artifacts/eas/...tu-link-aqui...",
  "ios": "https://testflight.apple.com/join/...tu-link-aqui...",
  "web": "http://localhost:19006"
}
```

¡Listo! Los botones de descarga en la landing page funcionarán.

## 💡 Tips

- Los builds de Android (APK) se pueden descargar directamente sin tienda
- Los builds de iOS necesitan TestFlight o App Store para distribución
- Puedes hacer builds locales con `--local` si tienes Android SDK instalado

