const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const chatServer = require('./lib/chat-server');

let cache = {};

function send404(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain' });
  response.write('Error 404: resource not found');
  response.end();
}

function sendFile(response, filePath, fileContents) {
  response.writeHead(200, { 'content-type': mime.lookup(path.basename(filePath)) });
  response.end(fileContents);
}

function serveStatic(response, cache, absPath) {
  if (cache[absPath]) {
    return sendFile(response, absPath, cache[absPath]);
  }

  fs.exists(absPath, (exists) => {
    if (exists) {
      fs.readFile(absPath, (err, data) => {
        if (err) {
          return send404(response);
        }

        cache[absPath] = data;
        sendFile(response, absPath, data);
      });
    } else {
      send404(response);
    }
  });
}

const server = http.createServer((request, response) => {
  let filePath = (request.url == '/') ? 'public/index.html' : `public/${request.url}`;
  serveStatic(response, cache, `./${filePath}`);
});

server.listen(8000, () => console.log('Server listening on port 8000.'));

chatServer.listen(server);