# 💰 Costos para Generar APK e IPA

## Resumen Rápido

| Servicio | Costo | ¿Obligatorio? |
|----------|-------|---------------|
| **EAS Build (Expo)** | **GRATIS** (30 builds/mes) | ✅ Para builds en la nube |
| **Google Play Developer** | $25 USD (una vez) | Solo si publicas en Play Store |
| **Apple Developer** | $99 USD/año | Solo si publicas en App Store |
| **Builds locales** | **GRATIS** | Si tienes Android SDK instalado |

## 🆓 Opción Gratuita: EAS Build (Recomendado)

### Plan Gratuito de Expo:
- ✅ **30 builds al mes GRATIS**
- ✅ Builds de Android (APK)
- ✅ Builds de iOS (IPA) - pero necesitas cuenta de Apple Developer
- ✅ Sin tarjeta de crédito
- ✅ Sin límite de tiempo

### Cómo usar:
```bash
# 1. Crear cuenta gratuita en expo.dev
# 2. Iniciar sesión
eas login

# 3. Configurar proyecto (solo una vez)
cd packages/mobile
eas build:configure

# 4. Generar APK (GRATIS)
eas build --platform android --profile preview
```

**Conclusión**: Puedes generar APKs para Android **completamente gratis** con el plan gratuito de Expo.

## 💵 Costos Adicionales (Solo si publicas en tiendas)

### Para Android:
- **Google Play Developer**: $25 USD (pago único, de por vida)
- **Solo necesario si**: Quieres publicar en Google Play Store
- **NO necesario si**: Solo quieres distribuir el APK directamente (descarga directa)

### Para iOS:
- **Apple Developer Program**: $99 USD/año
- **Solo necesario si**: Quieres publicar en App Store o usar TestFlight
- **NO necesario si**: Solo quieres el archivo IPA para distribución interna

## 🆓 Alternativa: Builds Locales (100% Gratis)

Si no quieres usar EAS Build, puedes construir localmente:

### Android (APK local):
```bash
cd packages/mobile
eas build --platform android --profile preview --local
```

**Requisitos**:
- Android SDK instalado
- Java JDK
- Configuración de Android Studio

**Ventajas**:
- ✅ Completamente gratis
- ✅ Sin límites
- ✅ Más rápido (no esperas cola)

**Desventajas**:
- ❌ Requiere configurar Android SDK
- ❌ Más complejo de configurar

### iOS (IPA local):
```bash
cd packages/mobile
eas build --platform ios --profile preview --local
```

**Requisitos**:
- macOS (no funciona en Windows/Linux)
- Xcode instalado
- Cuenta de Apple Developer ($99/año) - **obligatorio para iOS**

## 📊 Comparación de Opciones

### Opción 1: EAS Build Gratuito (Recomendado)
```
✅ Fácil de usar
✅ 30 builds/mes gratis
✅ No requiere configurar SDKs
✅ Funciona en cualquier sistema operativo
❌ Dependes de servidores de Expo
```

### Opción 2: Build Local Android
```
✅ Ilimitado y gratis
✅ Más rápido
✅ Control total
❌ Requiere configurar Android SDK
❌ Más complejo
```

### Opción 3: GitHub Actions (Avanzado)
```
✅ Completamente gratis
✅ Automatizado
✅ Ilimitado
❌ Requiere configuración avanzada
❌ Curva de aprendizaje
```

## 💡 Recomendación

**Para empezar**: Usa EAS Build gratuito
- 30 builds al mes es más que suficiente para desarrollo
- Muy fácil de usar
- Sin configuración compleja

**Si necesitas más builds**: 
- Plan Production: $99/mes (builds ilimitados)
- O usa builds locales (gratis pero más trabajo)

## 🎯 Resumen Final

| ¿Qué quieres hacer? | Costo |
|---------------------|-------|
| Generar APK para Android | **GRATIS** (EAS Build) |
| Generar APK localmente | **GRATIS** (requiere Android SDK) |
| Publicar en Google Play | $25 USD (una vez) |
| Generar IPA para iOS | **GRATIS** (EAS Build) pero necesitas Apple Developer |
| Publicar en App Store | $99 USD/año (Apple Developer) |

## ✅ Conclusión

**Puedes generar APKs para Android completamente gratis** usando EAS Build de Expo. 

Solo pagarías si:
1. Quieres más de 30 builds/mes → Plan Production ($99/mes)
2. Quieres publicar en Google Play → $25 USD (una vez)
3. Quieres publicar en App Store → $99 USD/año

Para desarrollo y distribución directa de APK, **no necesitas pagar nada**.

