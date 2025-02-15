const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());

// Socket.io bağlantısı
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Manuel bildirim gönderme API'si
app.post('/send-notification', async (req, res) => {
    const { token, title, body } = req.body;

    if (!token || !title || !body) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const message = {
        token,
        notification: { title, body },
    };

    try {
        await admin.messaging().send(message);
        io.emit('new-notification', { title, body });
        res.json({ success: true, message: 'Notification sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
