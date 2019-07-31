var express = require('express');
var path = require("path");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var routes = require('./src/server/routes');
var ioEvents = require('./src/server/ioEvents');

app.use(express.static(path.join(__dirname, "dist"), {index: false}));

routes(app);
ioEvents(io);

var port = process.env.PORT || 3000;

http.listen(port, function () {
    console.log('listening on *:' + port);
});
