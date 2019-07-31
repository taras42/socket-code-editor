var rooms = require('./rooms');
var events = require('../isomorfic/events');

module.exports = function(io) {
    io.on(events.CONNECTION, (socket) => {
        console.log('a user connected');

        socket.on(events.DISCONNECTING, () => {
            console.log('user disconnected');

            Object.keys(socket.rooms).forEach((roomId) => {
                const room = rooms.getRoomById(roomId);

                if (room) {
                    delete room.soketIdToUsersMap[socket.id];

                    socket.broadcast.in(roomId).emit(events.USER_DISCONNECTED,
                        rooms.getUsersByRoomId(roomId));
                }
            });

            rooms.deleteEmptyRooms();
        });

        socket.on(events.ROOM, (roomId, options) => {
            console.log(`a used joined room ${roomId}`);

            socket.join(roomId);

            rooms.createRoomIfNotExists(roomId);

            const room = rooms.getRoomById(roomId);

            room.soketIdToUsersMap[socket.id] = {
                id: options.userId,
                name: options.userName,
                colour: options.userColour,
                screen: options.userScreen
            };

            const users = rooms.getUsersByRoomId(roomId);

            // init new user
            io.sockets.connected[socket.id].emit(events.USER_INIT, users, room.editor);

            // bordcast users to others in the room
            socket.broadcast.in(roomId).emit(events.NEW_USER_JOINED, users);

            socket.on(events.EDIT, (editor, roomId) => {
                const room = rooms.getRoomById(roomId);

                room.editor.content = editor.content || "";
                room.editor.selections = editor.selections || null;

                // bordcast content to others in the room
                socket.broadcast.in(roomId).emit(events.UPDATE_EDITOR, room.editor);
            });

            socket.on(events.MODE_CHANGE, (mode) => {
                room.editor.mode = mode;
                // bordcast mode to others in the room
                socket.broadcast.in(roomId).emit(events.MODE_CHANGED, mode);
            });
        });
    });
}
