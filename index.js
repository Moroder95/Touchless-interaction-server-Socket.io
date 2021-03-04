const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { disconnect } = require('process');
const { v4: uuid } = require('uuid');
const rooms = {};
const roomsHosts = {};

app.get('/main', (req, res) => {
    res.sendFile(__dirname + '/index.html');
 });
 app.get('/phone?:id', (req, res) => {
    res.sendFile(__dirname + '/phone.html');
 });

 app.get('/pclient.js', (req, res) => {
    res.sendFile(__dirname + '/pclient.js');
 });

 io.on('connection', (socket) => {
    console.log('a user connected');
});

io.on('connection', (socket) => {
    // const roomID = socket.handshake.auth.token;
    const roomID = '123231';
    
    let inRoom = false;

    socket.on('initialize room', () =>{
        socket.join(roomID);
        rooms[roomID] = rooms[roomID] === undefined ? 1 : rooms[roomID] + 1;
        roomsHosts[roomID] = socket.id;
        inRoom = true;
        const users = rooms[roomID];
        io.to(roomID).emit('room size changed', {users})
    });

    socket.on('join room', () =>{
        let msg ='Something went wrong.';
        if(rooms[roomID] > 0 && rooms[roomID] < 2 ){
            inRoom= true;
            socket.join(roomID);
            rooms[roomID] += 1;
            const users = rooms[roomID];
            io.to(roomID).emit('room size changed', {users})
            return;
        }else if(rooms[roomID] === undefined || rooms[roomID] <=0 ){
            msg = 'Host screen isn\'t available.'
            
        }else if(rooms[roomID] >= 2){
            msg = 'Host screen is already in use.'
        };
        socket.emit('error', {msg}); 
    });

    socket.on('host disconnected',()=>{
        const msg= 'Host has disconnected';
        io.to(roomID).emit('error', {msg})
    });
    socket.on('disconnecting', (newSocket)=>{
      
        if(inRoom){
            const users = rooms[roomID] -= 1;

            if(roomsHosts[roomID] === socket.id){
                delete roomsHosts[roomID];
            }

            if(users === 0 ){
                delete rooms[roomID];
            }

            io.to(roomID).emit('room size changed', {users})
        }
    });
    socket.on('register key', ({ key })=>{
        io.to(roomID).emit('key event', { key });
    })
});

const port = process.env.PORT || 3001
http.listen( port, () => {
  console.log(`listening on *:${port}`);
});