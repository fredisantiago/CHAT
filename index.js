const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

// Reemplaza la siguiente cadena con tu URI de conexión de MongoDB Atlas
const mongoUri = 'mongodb+srv://fredisantiago19:Fredi613@cluster0.zjm1e.mongodb.net/<dbname>?retryWrites=true&w=majority';

// Conectar a MongoDB Atlas
async function connectDB() {
    try {
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Conectado a MongoDB Atlas');
    } catch (error) {
        console.error('Error conectando a MongoDB Atlas:', error.message);
    }
}

// Crear una instancia de Express y Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Definir el esquema y modelo de Chat
const chatSchema = new mongoose.Schema({
    usuario: String,
    mensaje: String,
    timestamp: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', chatSchema);

// Servir archivos estáticos (como tu index.html y chat.js)
app.use(express.static('public'));

// Manejar la conexión de los sockets
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

// Iniciar la conexión a la base de datos y el servidor
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`El servidor está corriendo en http://localhost:${PORT}`);
    });
}).catch(err => console.error(err));
