let path = require('path');
let express = require('express');
let app = express();
let server = app.listen(process.env.PORT || 3000);
let socket = require('socket.io');
let io = socket(server);
let crypto = require('crypto');git
const rooms = new Map();
const timeToClose = 1000 * 60 * 60;
app.use(express.static('public'));
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});
io.sockets.on('connection', newConnection);

function newConnection(socket) {
    let roomId = socket.id;
    ConsoleLog.newConnection(socket);

    socket.on('room', (data) => {
        roomId = roomProcess(socket, data);
    });

    socket.on('disconnecting', () => {
        disconnectUser(roomId);
    });

    // receiving info about new line from client and sending it to all other clients
    socket.on('draw', (data) => {
        draw(roomId, data);
    });

    socket.on('clearAll', () => {
        clearAllStuff(socket, roomId);
    });

    socket.on('background', (data) => {
        changeBackground(roomId, data);
        redrawLines(roomId, data);
    });
}

function disconnectUser(roomId) {
    if (roomExists(roomId)) {
        rooms.get(roomId).users.delete(socket.id);

        if (rooms.get(roomId).users.size == 0) {
            ConsoleLog.closingRoom(roomId);

            rooms.get(roomId).timeout = setTimeout(
                deleteRoom,
                timeToClose,
                roomId
            );
        }
    }
}
function deleteRoom(roomId) {
    if (roomExists(roomId)) {
        rooms.delete(roomId);

        ConsoleLog.closeRoom(roomId);
        ConsoleLog.roomsCount();
    }
}

function roomExists(data) {
    return rooms.has(data);
}

function stopTimeOut(roomId) {
    if (rooms.get(roomId).timeout != null) {
        clearTimeout(rooms.get(roomId).timeout);
        rooms.get(roomId).timeout = null;
    }
}

function addUserToRoom(socket, roomId) {
    rooms.get(roomId).users.add(socket.id);
    socket.join(roomId);
    ConsoleLog.userJoin(socket, roomId);
}
function createRoom(socket, roomId) {
    rooms.set(roomId, {
        users: new Set([socket.id]),
        lines: new Array(),
        background: null,
        timeout: null,
    });

    socket.join(roomId);
    socket.emit('path', '/' + roomId);
    ConsoleLog.userJoin(socket, roomId);
}

function roomProcess(socket, data) {
    let roomId;

    if (roomExists(data)) {
        roomId = data;
        stopTimeOut(roomId);
        addUserToRoom(socket, roomId);
        loadCanvasToUser(socket, roomId);
    } else {
        roomId = crypto.randomBytes(10).toString('hex');
        createRoom(socket, roomId);
    }
    ConsoleLog.roomsCount();

    return roomId;
}



