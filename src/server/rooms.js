var rooms = {};

module.exports = {
    deleteEmptyRooms: function() {
        Object.keys(rooms).forEach((roomId) => {
            const room = this.getRoomById(roomId);

            if (room && !this.getUsersByRoomId(roomId).length) {
                console.log(`room ${roomId} deleted`);
                delete this.deleteRoomById(roomId);
            }
        });
    },
    createRoomIfNotExists: function(roomId) {
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
    },
    getRoomById: function(id) {
        return rooms[id];
    },
    getUsersByRoomId: function(roomId) {
        return Object.values(rooms[roomId].soketIdToUsersMap);
    },
    deleteRoomById: function(id) {
        delete rooms[id];
    }
}
