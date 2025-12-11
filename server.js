const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configuración del transporter de email
// Configura esto con tus credenciales SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.SMTP_USER || 'tu-email@gmail.com',
        pass: process.env.SMTP_PASS || 'tu-contraseña-app' // Usa contraseña de aplicación para Gmail
    }
});

// Ruta para enviar email
app.post('/api/send-email', async (req, res) => {
    try {
        const { to_email, subject, html_content, message } = req.body;

        // Validaciones
        if (!to_email || !subject) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email y asunto son requeridos' 
            });
        }

        // Configurar el email
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@sygna.com',
            to: to_email,
            subject: subject,
            text: message || 'Presupuesto Sygna',
            html: html_content || message
        };

        // Enviar email
        const info = await transporter.sendMail(mailOptions);

        console.log('Email enviado:', info.messageId);
        
        res.json({ 
            success: true, 
            message: 'Email enviado correctamente',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('Error al enviar email:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al enviar el email: ' + error.message 
        });
    }
});

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando' });
});

// Servir la aplicación
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log('Asegúrate de configurar las variables de entorno SMTP_*');
});

