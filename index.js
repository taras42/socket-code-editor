var express = require('express');
var path = require("path");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, "scripts")));
app.use(express.static(path.join(__dirname, "node_modules/jquery/dist")));
app.use(express.static(path.join(__dirname, "node_modules/codemirror")));

var rooms = {};

function createRoomIfNotExists(roomId) {
	if (!rooms[roomId]) {
		rooms[roomId] = {
			soketIdToUsersMap: {},
			editorContent: ""
		};
	}
}

app.get('/', function(req, res) {
	var roomId = String(Date.now());

	createRoomIfNotExists(roomId);

	res.redirect('/room/' + roomId);
});

app.get('/room/:roomId', function(req, res) {
	res.sendFile(__dirname + '/view/index.html');
});

io.on('connection', function(socket) {
  console.log('a user connected');

  socket.on('disconnecting', function() {
	console.log('user disconnected');

	Object.keys(socket.rooms).forEach(function(roomId) {
		if (rooms[roomId]) {
			delete rooms[roomId].soketIdToUsersMap[socket.id];

			socket.broadcast.in(roomId).emit("userDisconnected", Object.values(rooms[roomId].soketIdToUsersMap));
		}
	});
   });

  socket.on('room', function(roomId, userName) {
  	console.log("a used joined room " + roomId);

    socket.join(roomId);

    createRoomIfNotExists(roomId);

    rooms[roomId].soketIdToUsersMap[socket.id] = userName;

    var users = Object.values(rooms[roomId].soketIdToUsersMap);

    // init new user
    io.sockets.connected[socket.id].emit("userInit", users, rooms[roomId].editorContent);

    // bordcast users to others in the room
    socket.broadcast.in(roomId).emit("newUserJoined", users);

    socket.on('edit', function(content, roomId) {
  		rooms[roomId].editorContent = content;

  		// bordcast content to others in the room
  		socket.broadcast.in(roomId).emit("updateEditor", content);
  	});
  });
});

var port = process.env.PORT || 3000;

http.listen(port, function() {
	console.log('listening on *:' + port);
});