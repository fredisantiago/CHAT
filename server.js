const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

// Conexión a MongoDB Atlas
const mongoUri = 'mongodb+srv://fredisantiago19:Fredi613@cluster0.zjm1e.mongodb.net/<dbname>?retryWrites=true&w=majority';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

// Esquema de chat
const chatSchema = new mongoose.Schema({
    usuario: String,
    mensaje: String,
    timestamp: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', chatSchema);

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Un usuario se conectó');

    // Cargar mensajes anteriores desde la base de datos
    Chat.find().sort({ timestamp: 1 }).exec((err, mensajes) => {
        if (err) throw err;
        socket.emit('loadMessages', mensajes);
    });

    // Manejar el evento de chat
    socket.on('chat', (data) => {
        const nuevoMensaje = new Chat(data);
        nuevoMensaje.save((err) => {
            if (err) throw err;
            io.emit('chat', data); // Emitir el nuevo mensaje a todos los clientes
        });
    });

    // Manejar desconexiones
    socket.on('disconnect', () => {
        console.log('Un usuario se desconectó');
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`El servidor está corriendo en http://localhost:${PORT}`);
});
