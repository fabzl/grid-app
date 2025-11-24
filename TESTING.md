# 🧪 Guía de Pruebas - Grip App

## 🚀 Inicio Rápido

### Opción 1: Usando el Launcher (Recomendado)
```powershell
cd C:\Users\usuario\grid-app
py main.py --new-windows
```
Esto abrirá:
- Servidor web de Expo en una ventana nueva
- Backend demo en otra ventana (si Rust está configurado)
- Navegador automáticamente en http://localhost:19006

### Opción 2: Manual (Solo Mobile)
```powershell
cd C:\Users\usuario\grid-app\packages\mobile
npm run web
```
Luego abre http://localhost:19006 en tu navegador.

## 📱 Flujos de Prueba

### 1. Login y Verificación
1. **Entrar**: Escribe cualquier nombre y presiona "Entrar"
2. **Ver Perfil**: Toca el avatar en la esquina superior derecha
3. **Verificar Cuenta**:
   - Presiona "Verificar cuenta"
   - Ingresa un RUT válido (ej: `12.345.678-5`)
   - Sube una foto de carnet
   - Presiona "Confirmar"

### 2. Grilla de Perfiles (Estilo Grindr)
1. Ve a la tab **"Perfiles"** (primera tab)
2. Deberías ver una grilla 2x2 con usuarios mock
3. **Toca cualquier perfil** para ver opciones:
   - 💬 Enviar mensaje
   - 📹 Video llamada
   - 🔇 Silenciar
   - 🙈 Ocultar
   - ⚠️ Reportar

### 3. Marketplace (Comprar)
1. Ve a la tab **"Comprar"** (segunda tab)
2. Verás productos en grilla
3. Toca un producto para ver detalles
4. Presiona "Contactar vendedor" para ir al chat

### 4. Servicios
1. Ve a la tab **"Servicios"** (tercera tab)
2. Verás filtros en la parte superior:
   - Todos
   - 🚕 Taxi
   - 🏠 Habitaciones
   - 💼 Profesionales
   - 🚴 Delivery
3. **Prueba cada filtro** para ver diferentes servicios
4. Toca un servicio para ver detalles completos:
   - Habitaciones: muestra capacidad, amenities, precio/noche
   - Profesionales: muestra categoría y precio/hora
   - Taxi: muestra precio/km

### 5. Chat con Fotos
1. Desde cualquier perfil, toca **"💬 Enviar mensaje"**
2. Escribe un mensaje y presiona enviar (➤)
3. Toca el ícono **📷** para enviar una foto
4. Selecciona una imagen de tu galería
5. La foto aparecerá en el chat

### 6. Video Llamada
1. Desde opciones de usuario, toca **"📹 Video llamada"**
2. Verás la pantalla de video call
3. Prueba los controles:
   - 🎤/🔇 Para silenciar/micrófono
   - 📷/📹 Para video on/off
   - 📞 Para colgar

### 7. Moderación de Usuarios
1. Desde opciones de usuario:
   - **Silenciar**: Oculta notificaciones de ese usuario
   - **Ocultar**: Oculta el usuario de la grilla
   - **Reportar**: Abre modal para ingresar motivo

### 8. Perfil Completo
1. Ve a la tab **"Perfil"** (última tab)
2. Verás tu información:
   - Foto de perfil (si subiste una)
   - Nombre
   - RUT (si verificaste)
   - Estado de verificación
3. Botones:
   - "Verificar cuenta" o "Actualizar verificación"
   - "Salir" para logout

## 🧪 Pruebas Específicas

### Validación de RUT
Prueba estos RUTs válidos:
- `12.345.678-5`
- `12345678-5`
- `76543210-K`

RUTs inválidos (deberían mostrar error):
- `12.345.678-9`
- `1234567` (muy corto)
- `abc123` (no numérico)

### Filtros de Servicios
1. En la tab Servicios, prueba cada filtro:
   - **Todos**: Muestra todos los servicios
   - **Taxi**: Solo servicios de taxi (3 items)
   - **Habitaciones**: Solo habitaciones (5 items con amenities)
   - **Profesionales**: Solo servicios profesionales (6 items con categorías)
   - **Delivery**: Solo delivery (2 items)

### Funcionalidad de Ocultar
1. Toca un perfil en la grilla
2. Presiona "Ocultar"
3. Vuelve a la grilla - ese usuario NO debería aparecer
4. Ve a tu perfil y busca una opción para "Mostrar usuarios ocultos" (TODO: implementar)

## 🔍 Qué Verificar

### ✅ Checklist de Funcionalidad
- [ ] Login funciona con cualquier nombre
- [ ] La grilla muestra usuarios con distancia
- [ ] Los filtros de servicios funcionan correctamente
- [ ] El chat envía mensajes de texto
- [ ] El chat permite enviar fotos
- [ ] Video llamada se abre y muestra controles
- [ ] Silenciar/Desilenciar funciona
- [ ] Ocultar funciona (usuario desaparece de grilla)
- [ ] Reportar abre modal y guarda el reporte
- [ ] Verificación de RUT valida correctamente
- [ ] Subida de foto de carnet funciona

### ⚠️ Problemas Conocidos
- **Ubicación**: Si no das permisos, los usuarios no se ordenarán por distancia
- **Fotos**: En web, puede que no funcione la cámara (normal en navegador)
- **Video Call**: Es una UI mock, no hay conexión real (se necesita WebRTC)
- **Persistencia**: Al recargar la página, se pierden los datos (normal, falta AsyncStorage)

## 🌐 URLs Importantes

- **App Web**: http://localhost:19006
- **Expo DevTools**: Se abre automáticamente cuando corres `npm run web`

## 🐛 Solución de Problemas

### "Cannot find module" errores
```powershell
cd packages/mobile
rm -r node_modules
npm install
```

### Puerto 19006 ocupado
```powershell
# Matar proceso en puerto 19006
netstat -ano | findstr :19006
taskkill /PID <PID> /F

# O usar otro puerto
cd packages/mobile
$env:PORT='19007'
npm run web
```

### La app no carga en el navegador
1. Verifica que el servidor esté corriendo (deberías ver output en consola)
2. Abre http://localhost:19006 manualmente
3. Revisa la consola del navegador (F12) para errores

## 📱 Probar en Dispositivo Móvil

### Android/iOS (Expo Go)
1. Instala "Expo Go" desde Play Store / App Store
2. Corre: `cd packages/mobile && npm start`
3. Escanea el QR code con la app Expo Go

### Emulador Android
```powershell
cd packages/mobile
npm run android
```

### Simulador iOS (solo macOS)
```powershell
cd packages/mobile
npm run ios
```

## ✅ Estado Actual

- ✅ Frontend completo y funcional
- ✅ Navegación entre pantallas
- ✅ Todas las features implementadas
- ✅ Backend Holochain listo (requiere WSL/Nix para ejecutar)
- ⚠️ Falta persistencia (AsyncStorage)
- ⚠️ Falta conexión real con Holochain backend

