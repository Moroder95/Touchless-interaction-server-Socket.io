const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: true,
    origins: ['http://127.0.0.1:3000', 'http://localhost:3000'],
});
const rooms = {};
const roomsHosts = {};
const roomCustomKeys = {};
let type = 'cursor';

app.get('/main', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/phoneHighlight?:id', (req, res) => {
    res.sendFile(__dirname + '/phone.html');
});

app.get('/phoneTouchPad?:id', (req, res) => {
    res.sendFile(__dirname + '/phonetouchpad.html');
});

app.get('/pclient.js', (req, res) => {
    res.sendFile(__dirname + '/pclient.js');
});

io.on('connection', (socket) => {
    const roomID = socket.handshake.auth.token;
    let inRoom = false;

    socket.on('initialize room', () => {
        if(rooms[roomID] >= 1 && roomID in roomsHosts){
            socket.disconnect();
            return
        }
        
        socket.join(roomID);
        rooms[roomID] = rooms[roomID] === undefined ? 1 : rooms[roomID] + 1;
        roomsHosts[roomID] = socket.id;
        inRoom = true;
        const users = rooms[roomID];
        io.to(roomID).emit('room size changed', { users });
    });

    socket.on('join room', () => {
        let msg = 'Something went wrong.';
        if (rooms[roomID] > 0 && rooms[roomID] < 2) {
            inRoom = true;
            socket.join(roomID);
            rooms[roomID] += 1;
            const users = rooms[roomID];
            io.to(roomID).emit('room size changed', { users, type });
            return;
        } else if (rooms[roomID] === undefined || rooms[roomID] <= 0) {
            msg = "Host screen isn't available.";
        } else if (rooms[roomID] >= 2) {
            msg = 'Host screen is already in use.';
        }
        socket.emit('error', { msg });
    });

    socket.on('host disconnected', () => {
        const msg = 'Host has disconnected';
        io.to(roomID).emit('error', { msg });
    });

    socket.on('disconnecting', (newSocket) => {
        if (inRoom) {
            const users = (rooms[roomID] -= 1);

            if (roomsHosts[roomID] === socket.id) {
                delete roomsHosts[roomID];
            }

            if (users === 0) {
                delete rooms[roomID];
                delete roomCustomKeys[roomID];
            }

            io.to(roomID).emit('room size changed', { users });
        }
    });

    socket.on('register key', ({ key }) => {
        const objKey = key === "click" ? "Enter" : 'swipe'+ key.substr('Arrow'.length);

        if(roomCustomKeys[roomID] && objKey in roomCustomKeys[roomID]){
            io.to(roomID).emit('key event', { key: roomCustomKeys[roomID][objKey] });
        }else{
            io.to(roomID).emit('key event', { key });
        }
    });

    socket.on('register cursor move', ({ deltaX, deltaY }) => {
        io.to(roomID).emit('cursor move', { deltaX, deltaY });
    });

    socket.on('update phone UI', ({ data }) => {
        io.to(roomID).emit('change UI', { data });
    });

    socket.on('redirect phone', (href) => {
        io.to(roomID).emit('redirect', { href });
    });
    socket.on('set custom keys', (data)=>{
        if(Object.entries(data).length < 1){
           delete roomCustomKeys[roomID];
        } else{
            roomCustomKeys[roomID] = data;
        }
        socket.disconnect();
    })
});

const port = process.env.PORT || 3002;
http.listen(port, () => {
    console.log(`listening on *:${port}`);
});
