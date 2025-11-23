# 🆓 Cómo Usar Builds 100% Gratuitos

## ✅ Respuesta Corta: SÍ, es 100% gratis

Puedes generar APKs **completamente gratis** usando GitHub Actions. Ya está todo configurado.

## 🚀 Opción 1: GitHub Actions (Ya Configurado)

### Paso 1: Hacer push a tu repositorio

```bash
git add .
git commit -m "Trigger build"
git push origin main
```

### Paso 2: Ver el build en GitHub

1. Ve a tu repositorio en GitHub
2. Click en la pestaña **"Actions"**
3. Verás el workflow "Build Android APK" ejecutándose
4. Espera 10-15 minutos

### Paso 3: Descargar el APK

1. Cuando termine, click en el workflow completado
2. Scroll hacia abajo hasta "Artifacts"
3. Click en "android-apk" para descargar
4. Descomprime el ZIP
5. ¡Tienes tu APK listo!

### Ejecutar Manualmente (Sin hacer push)

1. Ve a GitHub → Tu repo → **Actions**
2. Selecciona **"Build Android APK"** en el menú izquierdo
3. Click en **"Run workflow"** (botón arriba a la derecha)
4. Selecciona la rama (usualmente `main`)
5. Click en **"Run workflow"**
6. Espera y descarga el APK

## 💻 Opción 2: Build Local (También Gratis)

Si prefieres hacerlo en tu computadora:

### Requisitos:
- Android Studio instalado
- Android SDK configurado

### Pasos:

```bash
# 1. Ir al directorio mobile
cd packages/mobile

# 2. Generar proyecto Android nativo
npx expo prebuild --platform android

# 3. Compilar APK
cd android
./gradlew assembleRelease

# 4. El APK estará en:
# android/app/build/outputs/apk/release/app-release.apk
```

## 📊 Comparación

| Método | Gratis | Automático | Requiere Config |
|--------|--------|------------|-----------------|
| **GitHub Actions** | ✅ Sí | ✅ Sí | ❌ No |
| **Build Local** | ✅ Sí | ❌ No | ✅ Sí (Android SDK) |

## 🎯 Recomendación

**Usa GitHub Actions** - Ya está todo configurado, solo necesitas hacer push o ejecutar manualmente desde GitHub.

## ⚙️ Configuración Avanzada (Opcional)

### Cambiar cuándo se ejecuta:

Edita `.github/workflows/build-android.yml`:

```yaml
on:
  workflow_dispatch:  # Manual
  push:
    branches: [ main ]  # Al hacer push
  release:
    types: [created]    # Al crear release
```

### Agregar más triggers:

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Cada domingo a medianoche
```

## 💡 Tips

- Los builds tardan ~10-15 minutos
- Los APKs se guardan 30 días
- Puedes hacer builds ilimitados (repos públicos)
- Repos privados: 2000 minutos/mes gratis (suficiente para ~130 builds)

## ❓ Preguntas Frecuentes

**P: ¿Cuánto cuesta?**
R: **$0 - Completamente gratis** para repos públicos. Repos privados: 2000 minutos/mes gratis.

**P: ¿Hay límites?**
R: Repos públicos: **ilimitado**. Repos privados: 2000 minutos/mes (suficiente para ~130 builds).

**P: ¿Necesito configurar algo?**
R: **No**, ya está todo configurado. Solo haz push o ejecuta manualmente.

**P: ¿Funciona para iOS?**
R: iOS requiere macOS y Apple Developer ($99/año) para firmar. GitHub Actions tiene runners macOS pero son limitados.

## ✅ Conclusión

**Sí, puedes hacer builds 100% gratuitos** usando GitHub Actions. Ya está todo listo, solo úsalo.

