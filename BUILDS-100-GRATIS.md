# 🆓 Builds 100% Gratuitos - Guía Completa

## ✅ Sí, es posible hacer builds 100% gratuitos

Hay varias formas de generar APK e IPA **completamente gratis**, sin límites ni pagos.

## Opción 1: GitHub Actions (Recomendado) 🚀

### ✅ Ventajas:
- **100% gratis** para repos públicos
- **2000 minutos/mes gratis** para repos privados (más que suficiente)
- **Ilimitado** para repos públicos
- **Automático** - se ejecuta al hacer push
- **Sin configuración local** - todo en la nube

### 📋 Cómo usar:

1. **El workflow ya está creado** en `.github/workflows/build-android.yml`

2. **Para ejecutar manualmente:**
   - Ve a tu repositorio en GitHub
   - Click en "Actions"
   - Selecciona "Build Android APK"
   - Click en "Run workflow"

3. **O se ejecuta automáticamente** cuando:
   - Haces push a `main`
   - Creas un release/tag

4. **Descargar el APK:**
   - Ve a "Actions" → Último workflow ejecutado
   - En "Artifacts" descarga el APK

### 🔧 Configuración (opcional):

Si quieres usar EAS Build (pero sigue siendo gratis):
```bash
# Crear token de Expo (opcional, solo si quieres usar EAS)
eas login
eas whoami  # Copia el token

# En GitHub: Settings → Secrets → New secret
# Nombre: EXPO_TOKEN
# Valor: [tu token de Expo]
```

**Nota**: El workflow funciona **sin** EXPO_TOKEN usando builds locales.

## Opción 2: Build Local (100% Gratis) 💻

### Para Android:

```bash
# 1. Instalar Android Studio
# 2. Instalar Android SDK
# 3. Configurar variables de entorno

# 4. Build local
cd packages/mobile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease

# El APK estará en:
# android/app/build/outputs/apk/release/app-release.apk
```

### Requisitos:
- Android Studio (gratis)
- Android SDK (gratis)
- Java JDK (gratis)
- ~10GB de espacio

### ✅ Ventajas:
- **100% gratis**
- **Ilimitado**
- **Sin dependencias externas**
- **Más rápido** (no esperas cola)

### ❌ Desventajas:
- Requiere configurar Android SDK
- Solo funciona en tu máquina
- Más complejo de configurar

## Opción 3: EAS Build Local (Gratis) 🔧

```bash
cd packages/mobile
eas build --platform android --profile preview --local
```

### Requisitos:
- Android SDK instalado
- EAS CLI instalado

### ✅ Ventajas:
- Usa herramientas de Expo
- Más fácil que Gradle directo
- **100% gratis**

## Comparación de Opciones Gratuitas

| Opción | Gratis | Límites | Facilidad | Automático |
|--------|--------|---------|-----------|------------|
| **GitHub Actions** | ✅ Sí | 2000 min/mes (privado) | ⭐⭐⭐⭐⭐ | ✅ Sí |
| **Build Local** | ✅ Sí | Ninguno | ⭐⭐⭐ | ❌ No |
| **EAS Local** | ✅ Sí | Ninguno | ⭐⭐⭐⭐ | ❌ No |
| **EAS Cloud** | ✅ Sí | 30 builds/mes | ⭐⭐⭐⭐⭐ | ✅ Sí |

## 🎯 Recomendación

**Para la mayoría de casos: GitHub Actions**
- ✅ Más fácil
- ✅ Automático
- ✅ Sin configurar nada local
- ✅ Gratis y suficiente

**Para builds frecuentes: Build Local**
- ✅ Ilimitado
- ✅ Más rápido
- ❌ Requiere configurar Android SDK

## 📱 Para iOS (más complejo)

iOS requiere macOS y Apple Developer ($99/año) para firmar. Opciones gratuitas:

1. **GitHub Actions con runner macOS** (gratis pero limitado)
2. **Build local en Mac** (gratis pero necesitas Mac)
3. **Apple Developer** ($99/año) - necesario para distribuir

## 🚀 Quick Start - GitHub Actions

Ya está todo configurado. Solo necesitas:

1. **Hacer push a tu repo:**
   ```bash
   git add .
   git commit -m "Trigger build"
   git push
   ```

2. **O ejecutar manualmente:**
   - GitHub → Actions → Build Android APK → Run workflow

3. **Descargar APK:**
   - Actions → Último workflow → Artifacts

## 💡 Tips

- Los builds en GitHub Actions tardan ~10-15 minutos
- Los APKs se guardan por 30 días
- Puedes automatizar releases con tags
- Todo es 100% gratis para repos públicos

## ✅ Conclusión

**Sí, puedes hacer builds 100% gratuitos** usando:
1. ✅ GitHub Actions (recomendado)
2. ✅ Build local con Android SDK
3. ✅ EAS Build local

**No necesitas pagar nada** para generar APKs. Solo pagarías si quieres publicar en tiendas ($25 Google Play, $99/año Apple).

