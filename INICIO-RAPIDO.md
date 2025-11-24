# Inicio Rápido - Servidor Web

## Opción 1: Usar el script de Python (recomendado)

```bash
python main.py
```

Esto iniciará automáticamente:
- Servidor de landing page en http://localhost:8080
- Servidor web de Expo en http://localhost:19006

## Opción 2: Iniciar solo el servidor web de Expo

### Windows (PowerShell):
```powershell
.\start-web.ps1
```

O manualmente:
```powershell
cd packages\mobile
npm run web
```

### Linux/Mac:
```bash
cd packages/mobile
npm run web
```

## Opción 3: Iniciar solo la landing page

```bash
python packages/landing/server.py
```

La landing page estará disponible en http://localhost:8080

## Solución de Problemas

### Error: ERR_CONNECTION_REFUSED

1. **Verifica que el servidor esté corriendo:**
   - Deberías ver mensajes en la consola indicando que el servidor está activo
   - Busca mensajes como "Metro waiting on..." o "Web is waiting on..."

2. **Verifica el puerto correcto:**
   - Expo web: http://localhost:19006 (puerto por defecto)
   - Landing page: http://localhost:8080

3. **Si el puerto está ocupado:**
   - El servidor intentará usar el siguiente puerto disponible
   - Revisa los mensajes en la consola para ver qué puerto está usando

4. **Reinicia el servidor:**
   ```powershell
   # Detén el servidor (Ctrl+C) y vuelve a iniciarlo
   cd packages\mobile
   npm run web
   ```

### El servidor no inicia

1. **Instala las dependencias:**
   ```powershell
   cd packages\mobile
   npm install
   ```

2. **Limpia la caché de Expo:**
   ```powershell
   cd packages\mobile
   npx expo start --clear
   ```

3. **Verifica que Node.js esté instalado:**
   ```powershell
   node --version
   npm --version
   ```

