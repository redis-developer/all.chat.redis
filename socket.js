var io = require('socket.io')(2022);

io.adapter(require('socket.io-redis')({host : 'localhost', port : 6379})); // use redis pub/sub to pass messages between socket.io nodes (or from webserver)

io.on('connection', function(socket){
    if(socket.handshake.headers.origin !== 'http://all.chat.redis:2021') // typically you don't want other domains connecting to you.
        return socket.disconnect(true);
});
