var faker = require('faker'),
    redis_client = new (require('ioredis'))();

var room_id = 1,
    message_id = 1;

var gen_room_properties = function(){

    var room_topic = faker.lorem.sentence().slice(0, -1);

    redis_client.hset('room_properties:' + room_id, 'topic', room_topic);
};

var gen_room_messages = function(){
    for(var i=0;i<10;i++){

        var message = faker.lorem.sentence(),
            name = faker.name.findName();

        if(Math.random() > 0.5)
            message += ' ' + faker.lorem.sentence();

        redis_client.zadd('room_messages:' + room_id, +new Date(), JSON.stringify({username : name, message : message, message_id : message_id}));

        message_id++;
    };
};

(function(){
    for(var i=0;i<10;i++){

        gen_room_properties();

        gen_room_messages();

        room_id++;
    };
})();

setTimeout(function(){
    console.log('probably can close this now');
}, 3000);
