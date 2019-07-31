var rooms = require('./rooms');

module.exports = function(app) {
    app.get('/', (req, res) => {
        const roomId = String(Date.now());

        rooms.createRoomIfNotExists(roomId);

        res.redirect('/room/' + roomId);
    });

    app.get('/room/:roomId', (req, res) => {
        res.sendFile(process.cwd() + '/dist/index.html');
    });
}
