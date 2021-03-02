const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { disconnect } = require('process');
const { v4: uuid } = require('uuid');
const rooms = {};

app.get('/main', (req, res) => {
    res.sendFile(__dirname + '/index.html');
 });
 app.get('/phone?:id', (req, res) => {
    res.sendFile(__dirname + '/phone.html');
 });
//  app.get('/client.js', (req, res) => {
//     res.sendFile(__dirname + '/client.js');
//  });
 app.get('/pclient.js', (req, res) => {
    res.sendFile(__dirname + '/pclient.js');
 });

 io.on('connection', (socket) => {
    console.log('a user connected');
});

io.on('connection', (socket) => {
    const roomID = socket.handshake.auth.token;
    
    let inRoom = false;
    if(roomID && (rooms[roomID] === undefined)){
        socket.join(roomID);
        rooms[roomID] = 1;
        inRoom = true;
        io.to(roomID).emit('room size changed', {users: rooms[roomID]})
    }else if(roomID && rooms[roomID] < 2){
       socket.join(roomID);
       rooms[roomID] += 1;
       inRoom = true;
       io.to(roomID).emit('room size changed', {users: rooms[roomID]})
    }else{
        const msg = 'Someone already connected to this instance';
        socket.emit('error', {msg})
    }
    socket.on('initialize room', (roomID) =>{
        const uid = uuid();
        console.log(roomID);
        socket.join(roomID);
        
        rooms[socket.id] = roomID;
    });

    socket.on('disconnecting', (socket)=>{
        console.log('disconnecting')
        if(inRoom){
            rooms[roomID] -= 1;
            io.to(roomID).emit('room size changed', {users: rooms[roomID]})
        }
    });
    socket.on('register key', ({ key })=>{
        io.to(roomID).emit('key event', { key });
    })
});
io.on('disconnect', (socket)=>{
    console.log(socket.id, 'has disconnected')
})

http.listen( process.env.PORT || 3001, () => {
  console.log(`listening on *:${process.env.PORT || 3001}`);
});