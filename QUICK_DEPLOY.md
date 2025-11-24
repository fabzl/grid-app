# 🚀 Quick Deployment Guide

## ✅ Backend Status

El backend Holochain está funcionando y compila correctamente.

## 📱 Desplegar App para Clientes - Opciones Rápidas

### ⚡ Opción 1: Expo Go (MÁS RÁPIDA - 2 minutos)

**Para testing rápido con clientes:**

```bash
# 1. Iniciar servidor de desarrollo
npm run mobile:start

# 2. Compartir QR code o link con clientes
# Los clientes instalan "Expo Go" desde Play Store/App Store
# Escanean el QR code y la app se abre directamente
```

**Ventajas:**
- ✅ Instantáneo
- ✅ No requiere builds
- ✅ Ideal para testing temprano

**Desventajas:**
- ⚠️ Clientes necesitan Expo Go instalado
- ⚠️ Algunas funcionalidades nativas limitadas

---

### 📦 Opción 2: APK Instalable (15-30 minutos)

**Para distribución directa (sin Play Store):**

```bash
# 1. Instalar EAS CLI (una vez)
npm install -g eas-cli

# 2. Login en Expo (una vez)
eas login

# 3. Build APK
npm run mobile:build:android

# 4. Esperar build (15-30 min)
# 5. Descargar APK desde dashboard de Expo
# 6. Compartir APK con clientes (instalan directamente)
```

**Ventajas:**
- ✅ Instalación directa
- ✅ No necesita Play Store
- ✅ Build completo con código nativo

---

### 🌐 Opción 3: Web App (5 minutos)

**Para distribución web:**

```bash
npm run mobile:build:web

# Los archivos se generan en packages/mobile/dist/
# Subir a cualquier hosting (Netlify, Vercel, etc.)
```

**Ventajas:**
- ✅ Accesible desde navegador
- ✅ No requiere instalación
- ✅ Fácil de compartir

---

## 📋 Checklist Rápido

- [ ] Backend compilado: `npm run backend:build`
- [ ] App configurada en `packages/mobile/app.json`
- [ ] Iconos y splash screen en `packages/mobile/assets/`
- [ ] Elegir método de deployment
- [ ] Compartir con clientes

## 🔗 Links Útiles

- Expo Dashboard: https://expo.dev
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- Expo Go: Disponible en Play Store y App Store

## 💡 Recomendación

**Para testing rápido**: Usa Expo Go (Opción 1)  
**Para distribución profesional**: Usa APK (Opción 2)


