# 🗺️ Mapa de Navegación - RedLibre App

## Estructura General

La aplicación utiliza **React Navigation** con dos tipos de navegadores:
- **Stack Navigator** (navegación principal)
- **Bottom Tab Navigator** (tabs principales dentro de MainTabs)

---

## 📱 Flujo de Navegación Principal

```
┌─────────────────────────────────────────────────────────────┐
│                    STACK NAVIGATOR                           │
│                  (Navegación Principal)                      │
└─────────────────────────────────────────────────────────────┘

1. Splash (Pantalla inicial)
   ├─→ Login (si no hay usuario)
   └─→ MainTabs (si hay usuario)

2. Login
   ├─→ Register
   ├─→ ForgotPassword
   └─→ MainTabs (después de login exitoso)

3. Register
   └─→ MainTabs (después de registro exitoso)

4. ForgotPassword
   └─→ ResetPassword

5. ResetPassword
   └─→ Login

6. MainTabs (Bottom Tab Navigator)
   ├─→ Feed (Tab)
   ├─→ Profiles (Tab)
   ├─→ Marketplace (Tab)
   ├─→ Services (Tab)
   ├─→ Chats (Tab)
   ├─→ Wishes (Tab) ⭐ NUEVO
   └─→ MyProfile (Tab)
```

---

## 🎯 Pantallas del Stack Navigator

### Autenticación
- **Splash** - Pantalla inicial con logo y carga
- **Login** - Inicio de sesión
- **Register** - Registro de nuevo usuario
- **ForgotPassword** - Recuperar contraseña
- **ResetPassword** - Nueva contraseña (requiere email y token)

### Navegación Principal
- **MainTabs** - Contenedor de tabs principales (Bottom Tab Navigator)

### Perfil y Verificación
- **Profile** - Perfil de usuario (puede ser propio o de otro usuario)
- **Verification** - Verificación de RUT

### Marketplace
- **ProductDetail** - Detalle de producto (requiere: `product`)
- **CreateProduct** - Crear nuevo producto para vender

### Servicios
- **ServiceDetail** - Detalle de servicio (requiere: `service`)
- **CreateService** - Crear nuevo servicio

### Posts Sociales
- **CreatePost** - Crear nueva publicación (texto, imagen, video, stickers)

### Mensajería
- **Chats** - Lista de conversaciones
- **Chat** - Chat individual (requiere: `userId`, `userName`)
- **VideoCall** - Video llamada (requiere: `userId`, `userName`)

### Opciones de Usuario
- **UserOptions** - Opciones de usuario (requiere: `user`)
  - Enviar mensaje
  - Video llamada
  - Bloquear usuario
  - Mute/Hide

### Tamagochi
- **Tamagochi** - Gestión del Tamagochi virtual

### Wishes (Deseos) ⭐ NUEVO
- **Wishes** - Lista de deseos (también disponible como Tab)
- **CreateWish** - Crear nuevo deseo
- **WishDetail** - Detalle de deseo (requiere: `wish`)

### Servicios de Transporte
- **DriversMap** - Mapa de conductores
- **RegisterDriver** - Registro como conductor
- **ShareLocation** - Compartir ubicación (requiere: `userId`, `userName`)
- **RequestRide** - Solicitar viaje
- **RideQuotes** - Cotizaciones de viaje (requiere: `pickupLat`, `pickupLon`, `dropoffLat`, `dropoffLon`)

---

## 📑 Bottom Tab Navigator (MainTabs)

Las siguientes pantallas están disponibles como **tabs** en la barra inferior:

1. **📰 Feed** (Muro)
   - Ver publicaciones
   - Crear publicación → `CreatePost`
   - Ver perfil de usuario → `Profile`
   - Ver opciones de usuario → `UserOptions`

2. **👥 Profiles** (Perfiles)
   - Ver todos los usuarios
   - Ver perfil → `Profile`
   - Agregar amigo (corazón)
   - Enviar mensaje → `Chat`
   - Ver opciones → `UserOptions`

3. **🛒 Marketplace** (Comprar)
   - Ver productos
   - Ver detalle → `ProductDetail`
   - Crear producto → `CreateProduct`
   - Contactar vendedor → `Chat`

4. **🚕 Services** (Servicios)
   - Ver servicios (Uber, Airbnb, Profesionales)
   - Ver detalle → `ServiceDetail`
   - Crear servicio → `CreateService`
   - Solicitar viaje → `RequestRide` → `RideQuotes`
   - Ver mapa de conductores → `DriversMap`
   - Registro como conductor → `RegisterDriver`

5. **💬 Chats** (Mensajes)
   - Lista de conversaciones ordenadas por caracteres
   - Abrir chat → `Chat`
   - Video llamada → `VideoCall`

6. **⭐ Wishes** (Deseos) ⭐ NUEVO
   - Ver todos los deseos
   - Crear deseo → `CreateWish`
   - Ver detalle → `WishDetail`
   - Ofrecer ayuda
   - Contactar ayudantes → `Chat`

7. **👤 MyProfile** (Perfil)
   - Ver perfil propio
   - Editar perfil
   - Verificación RUT → `Verification`
   - Tamagochi → `Tamagochi`
   - Configuración (color app, Tamagochi, ubicación)

---

## 🔗 Flujos de Navegación Comunes

### Flujo de Publicación
```
Feed → CreatePost → Feed (con nueva publicación)
```

### Flujo de Mensajería
```
Profiles → UserOptions → Chat
Chats → Chat
Chat → VideoCall
```

### Flujo de Marketplace
```
Marketplace → ProductDetail → Chat (contactar vendedor)
Marketplace → CreateProduct → Marketplace
```

### Flujo de Servicios
```
Services → ServiceDetail → RequestRide → RideQuotes
Services → RegisterDriver → Services
```

### Flujo de Wishes ⭐ NUEVO
```
Wishes → CreateWish → Wishes
Wishes → WishDetail → Chat (contactar ayudante)
WishDetail → Chat (contactar ayudante)
```

### Flujo de Perfil
```
MyProfile → Verification
MyProfile → Tamagochi
Profiles → Profile → UserOptions
```

---

## 📊 Resumen de Pantallas

### Total de Pantallas: **27**

#### Autenticación (5)
- Splash, Login, Register, ForgotPassword, ResetPassword

#### Tabs Principales (7)
- Feed, Profiles, Marketplace, Services, Chats, Wishes, MyProfile

#### Pantallas Modales/Detalle (15)
- Profile, Verification
- ProductDetail, CreateProduct
- ServiceDetail, CreateService
- CreatePost
- Chats, Chat, VideoCall
- UserOptions
- Tamagochi
- Wishes, CreateWish, WishDetail
- DriversMap, RegisterDriver, ShareLocation, RequestRide, RideQuotes

---

## 🎨 Parámetros de Navegación

### Pantallas con Parámetros

```typescript
// ProductDetail
{ product: Product }

// ServiceDetail
{ service: Service }

// Chat
{ userId: string, userName: string }

// VideoCall
{ userId: string, userName: string }

// UserOptions
{ user: UserProfile }

// ResetPassword
{ email: string, token: string }

// ShareLocation
{ userId: string, userName: string }

// RideQuotes
{ pickupLat: number, pickupLon: number, dropoffLat: number, dropoffLon: number }

// WishDetail ⭐ NUEVO
{ wish: Wish }
```

---

## 🔄 Navegación Programática

### Ejemplos de uso:

```typescript
// Navegar a crear post
navigation.navigate('CreatePost');

// Navegar a chat con usuario
navigation.navigate('Chat', { 
  userId: 'user123', 
  userName: 'Juan Pérez' 
});

// Navegar a detalle de producto
navigation.navigate('ProductDetail', { 
  product: productData 
});

// Navegar a crear wish ⭐ NUEVO
navigation.navigate('CreateWish');

// Navegar a detalle de wish ⭐ NUEVO
navigation.navigate('WishDetail', { 
  wish: wishData 
});
```

---

## 📝 Notas Importantes

1. **MainTabs** es el punto central de navegación después del login
2. Todas las pantallas de creación (CreatePost, CreateProduct, CreateService, CreateWish) regresan a su pantalla origen después de crear
3. **Chat** y **VideoCall** requieren userId y userName
4. **Wishes** está disponible tanto como Tab como pantalla modal
5. La navegación está optimizada para flujos intuitivos de usuario

---

## 🆕 Cambios Recientes

- ✅ Agregada sección **Wishes** (Deseos)
- ✅ Agregadas pantallas: WishesScreen, CreateWishScreen, WishDetailScreen
- ✅ Wishes agregado como Tab en MainTabs
- ✅ Integración completa con sistema de mensajería para contactar ayudantes

