# Configuración del Backend para Envío de Emails

## Instalación

1. **Instalar Node.js** (si no lo tienes):
   - Descarga desde: https://nodejs.org/
   - Versión recomendada: 18.x o superior

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

## Configuración

1. **Crear archivo `.env`**:
   ```bash
   cp .env.example .env
   ```

2. **Configurar credenciales SMTP** en el archivo `.env`:

   ### Para Gmail:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=tu-contraseña-de-aplicación
   ```
   
   **Importante para Gmail**: Necesitas crear una "Contraseña de aplicación":
   - Ve a tu cuenta de Google → Seguridad
   - Activa la verificación en 2 pasos
   - Ve a "Contraseñas de aplicaciones"
   - Genera una nueva contraseña para "Correo"
   - Usa esa contraseña en `SMTP_PASS`

   ### Para Outlook/Office365:
   ```
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_USER=tu-email@outlook.com
   SMTP_PASS=tu-contraseña
   ```

   ### Para IONOS u otros proveedores:
   - Consulta la documentación de tu proveedor de email
   - Configura el host y puerto SMTP correspondiente

## Ejecutar el servidor

### Modo desarrollo (con auto-reload):
```bash
npm run dev
```

### Modo producción:
```bash
npm start
```

El servidor estará disponible en: `http://localhost:3000`

## Actualizar el frontend

El archivo `script.js` ya está configurado para usar el backend. Solo necesitas:

1. Asegurarte de que el servidor esté corriendo
2. La URL del backend está configurada en `script.js` (línea de `API_URL`)

Si el backend está en otro puerto o dominio, actualiza la variable `API_URL` en `script.js`.

## Despliegue

### Opciones de hosting:

1. **Vercel/Netlify** (Serverless):
   - Crea un archivo `vercel.json` o `netlify.toml`
   - Configura las variables de entorno en el panel

2. **Heroku**:
   ```bash
   heroku create
   heroku config:set SMTP_HOST=...
   heroku config:set SMTP_USER=...
   # etc.
   git push heroku main
   ```

3. **VPS/Servidor propio**:
   - Usa PM2 para mantener el proceso activo:
   ```bash
   npm install -g pm2
   pm2 start server.js
   pm2 save
   pm2 startup
   ```

## Seguridad

- **NUNCA** subas el archivo `.env` a Git
- Usa variables de entorno en producción
- Considera usar un servicio de email profesional (SendGrid, Mailgun, etc.) para mayor confiabilidad

