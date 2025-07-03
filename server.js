const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
});

app.use(sessionMiddleware);
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

app.post('/login', (req, res) => {
    const { username } = req.body;
    if (username) {
        req.session.username = username;
        return res.redirect('/chat.html');
    }
    res.redirect('/');
});

app.get('/', (req, res) => {
    if (req.session.username) {
        return res.redirect('/chat.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    const username = socket.request.session.username;
    if (!username) {
        return socket.disconnect(true);
    }
    socket.on('chat message', (msg) => {
        io.emit('chat message', { user: username, message: msg });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Server listening on port ' + PORT);
});
