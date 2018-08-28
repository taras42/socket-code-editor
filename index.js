var express = require('express');
var path = require("path");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, "scripts")));
app.use(express.static(path.join(__dirname, "css")));
app.use(express.static(path.join(__dirname, "node_modules/jquery/dist")));
app.use(express.static(path.join(__dirname, "node_modules/codemirror")));

var rooms = {};

function createRoomIfNotExists(roomId) {
	if (!rooms[roomId]) {
		rooms[roomId] = {
			soketIdToUsersMap: {},
			editor: {
				content: "",
				mode: "javascript",
				selections: null
			}
		};
	}
}

function getUsersByRoomId(roomId) {
	return Object.values(rooms[roomId].soketIdToUsersMap);
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

			socket.broadcast.in(roomId).emit("userDisconnected", getUsersByRoomId(roomId));
		}
	});

	Object.keys(rooms).forEach(function(roomId) {
		if (rooms[roomId] && !getUsersByRoomId(roomId).length) {
			console.log("room ", roomId, " deleted");
			delete rooms[roomId];
		}
	})
   });

  socket.on('room', function(roomId, options) {
  	console.log("a used joined room " + roomId);

    socket.join(roomId);

    createRoomIfNotExists(roomId);

    rooms[roomId].soketIdToUsersMap[socket.id] = {
      id: options.userId,
    	name: options.userName,
    	colour: options.userColour,
    	cursorPos: {x: 0, y: 0},
      screen: options.userScreen
    };

    var users = getUsersByRoomId(roomId);

    // init new user
    io.sockets.connected[socket.id].emit("userInit", users, rooms[roomId].editor);

    // bordcast users to others in the room
    socket.broadcast.in(roomId).emit("newUserJoined", users);

    socket.on('edit', function(editor, roomId) {
  		rooms[roomId].editor.content = editor.content || "";
  		rooms[roomId].editor.selections = editor.selections || null;

  		// bordcast content to others in the room
  		socket.broadcast.in(roomId).emit("updateEditor", rooms[roomId].editor);
  	});

  	socket.on('modeChange', function(mode) {
  		rooms[roomId].editor.mode = mode;

  		// bordcast mode to others in the room
  		socket.broadcast.in(roomId).emit("modeChanged", mode);
  	});

  	socket.on('updateUserCursor', function(options, roomId) {
      var user = rooms[roomId].soketIdToUsersMap[socket.id];

  		user.cursorPos = {
        x: options.x,
        y: options.y
      };

      user.screen = {
        width: options.screenWidth,
        height: options.screenHeight
      };

  		// bordcast mode to others in the room
  		socket.broadcast.in(roomId).emit("userCursorUpdated", getUsersByRoomId(roomId));
  	});
  });
});

var port = process.env.PORT || 3000;

http.listen(port, function() {
	console.log('listening on *:' + port);
});