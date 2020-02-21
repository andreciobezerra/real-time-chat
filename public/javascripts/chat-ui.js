function divEscapedContentElement(message) {
  return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
  return $('<div></div>').html(`<i>${message}</i>`);
}

function processUserInput(chatApp, socket){
  let message = $('#send-message').val();
  let systemMessage;

  if(message.startsWith('/')){
    systemMessage = chatApp.processCommand(message);
    if(systemMessage){
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  }
  else{
    chatApp.sendMessage($('#room').text(),message);
    $('#messages').append(divEscapedContentElement(message));
    $('#messages').scrollTop($('messages').prop('scrollHeight'));
  }

  $('#send-message').val('');
}

let socket = io.connect();

$(document).ready(()=>{
  let chatApp = Chat(socket);

  socket.on('nameResult',(result)=>{
    let message=(result.success)? `You are now know as ${result.name}.` : result.message;

    $('#messages').append(divSystemContentElement(message));
  });

  socket.on('joinResult', (result)=>{
    $('#room').text(result.room);
    $('#messages').append(divSystemContentElement('Room changed.'));
  });

  
  socket.on('message', (message)=>{    
    $('#messages').append(divEscapedContentElement(message.text));
  });

  socket.on('rooms', (rooms)=>{
    $('#room-list').empty();

    for(var room in rooms){
      room = room.substring(1,room.length);
      if(room != ''){
        $('#room-list').append(divEscapedContentElement(room));
      }
    }

    $('#room-list div').click(function(){
      chatApp.processCommand(`/join ${$(this).text()}`);
      $('#send-message').focus();
    });
  });

  setInterval(()=>socket.emit('rooms'),1000);
  $('#send-message').focus();
  $('#send-form').submit(()=>{
    processUserInput(chatApp,socket);
    return false;
  });
});