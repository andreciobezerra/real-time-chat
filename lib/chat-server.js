const socketio = require('socket.io');

let guestNumber = 1;
let io;
let nickNames = {};
let namesUsed = [];
let currentRoom = {};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  let name = `Guest${guestNumber}`;
  nickNames[socket.id] = name;
  socket.emit('nameResult', { success: true, name });
  namesUsed.push(name);

  return guestNumber + 1;
}

function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', { room });
  socket.broadcast.to(room).emit('message', { text: `${nickNames[socket.id]} has joined ${room}.` });

  let usersInRoom = io.sockets.clients(room);

  if (usersInRoom.length > 1) {
    let usersInRoomSumary = `Users currently in ${room}:`;
    usersInRoom.map((user, index) => {
      if (user.id != socket.id) {
        if (index > 0) {
          usersInRoomSumary += ', ';
        }
        usersInRoomSumary += nickNames[user.id];
      }
    });

    usersInRoomSumary += '.';
    socket.emit('message', { text: usersInRoomSumary });
  }
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', (name) => {
    if (name.match(/^Guest/)) {
      socket.emit('nameResult', { success: false, message: 'Name cannot begin with "Guest".' });
    }
    else {
      if (!namesUsed.includes(name)) {
        let previousName = nickNames[socket.id];
        let previousNameIndex = namesUsed.indexOf(previousName);

        namesUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[previousNameIndex];
        socket.emit('nameResult', { success: true, name });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', { text: `${previousName} is now known as ${name}.` });

      }
      else {
        socket.emit('nameResult', { success: false, message: 'That name is already in use.' });
      }
    }
  });
}

function handleMessageBroadcasting(socket, nickNames) {
  socket.on('message', (message) => {
    console.log('aqui', message);
    
    socket.broadcast.to(message.room).emit('message', {
      text: `${nickNames[socket.id]}: ${message.text} !!!!`
    });
  });
}

function handleRoomJoining(socket) {
  socket.on('join', (room) => {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}

function handleClientDisconnection(socket, nickNames, namesUsed) {
  socket.on('disconnect', () => {
    let nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
}

exports.listen = (server) => {
  io = socketio.listen(server);
  io.set('log level', 1);
  io.sockets.on('connection', (socket) => {
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    joinRoom(socket, 'Lobby');
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);
    socket.on('rooms', () => socket.emit('rooms', io.sockets.manager.rooms));
    handleClientDisconnection(socket, nickNames, namesUsed);
  });
};
