var socket = io();

var form = document.getElementById('form');
var input = document.getElementById('input');

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';
    }
    console.log(socket)
});

socket.on('chat message', function(msg) {
    var item = document.createElement('li');
    item.textContent = msg;
    console.log(msg)
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  });