let Chat = (socket) => {
  const sendMessage = (room, text) => socket.emit('message', { room, text });
  const changeRoom = (room) => socket.emit('join', { newRoom: room });
  const processCommand = (command) => {
    let words = command.split(' ');
    let task = words[0].substring(1, words[0].length).toLowerCase();
    let message = false;

    if (!task.match(/join|nick/)) {
      message = 'Unrecognized command.';
      return message;
    }

    words.shift();
    task === 'join' ? changeRoom(words.join(' ')) : socket.emit('nameAttempt', words.join(' '));

    return message;
  };
  
  return { sendMessage, processCommand };
};