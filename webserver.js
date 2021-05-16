var express = require('express'),
    app = express(),
    cookie_parser = require('cookie-parser'),
    redis = require('ioredis'),
    async = require('neo-async'),
    bcrypt = require('bcrypt'),
    jwt = require('jsonwebtoken'),
    path = require('path');

var jwt_private_key = 'my-private-key-not-secure';

var io = new (require('@socket.io/redis-emitter').Emitter)(new redis()); // socket.io publisher over redis pub/sub

var gears_client = new redis();

var redis_client = new redis();

// ---

app.use(cookie_parser()); // req.cookies.abc

app.use(express.urlencoded({extended : false})); // req.params.abc

app.use('/static', express.static('./src/static', {fallthrough : false})); // https://expressjs.com/en/advanced/best-practice-performance.html#use-a-reverse-proxy

// ---

app.get('/', function(req, res){
    res.sendFile(path.resolve('./src/static/index.html'));
});

app.get('/homepage_json', function(req, res){
    redis_client.get('homepage_json', function(err, result){ // todo: handle error
        res.end(result);
    });
});

// ---

app.post('/register', function(req, res){ // todo: validate input requirements
    var wf = [];

    wf.push(function(acb){
        bcrypt.hash(req.body.password, 12, acb);
    });

    wf.push(function(hash, acb){
        redis_client.hsetnx('user_password_hash', req.body.username.toLowerCase(), hash, acb); // todo: use lua and per user hash
    });

    wf.push(function(result, acb){

        if(result === 0){
            res.end('-1');
            return acb(false);
        };

        // ---

        var token = jwt.sign({username : req.body.username}, jwt_private_key, {algorithm : 'HS256'});

        res.cookie('jwt', token, {expires : new Date(2500, 0)});

        res.end();

        acb(false);
    });

    async.waterfall(wf); // todo: handle errors
});

app.post('/login', function(req, res){
    res.end(); // todo
});

// --- require valid jwt cookie from here on out

app.use(function(req, res, next){
    if(typeof req.cookies.jwt !== 'string')
        return res.end();

    jwt.verify(req.cookies.jwt, jwt_private_key, {algorithms : ['HS256']}, function(err, decoded){
        if(err !== null)
            return res.end();

        req.jwt = decoded;
        next();
    });

});

// ---

app.post('/new_message', function(req, res){ // todo: validate data (room_id is int etc). todo: csrf checks.

    res.end();

    io.emit('custom_event', {type : 'new_message', room_id : req.body.room_id, message : req.body.message, username : req.jwt.username});

    // ---

    var wf = [];

    wf.push(function(acb){
        redis_client.hincrby('counters', 'message_id', 1, acb);
    });

    wf.push(function(message_id, acb){
        redis_client.zadd('room_messages:' + req.body.room_id, +new Date(), JSON.stringify({username : req.jwt.username, message : req.body.message, message_id : message_id}), acb);
    });

    // ---

    async.waterfall(wf); // todo: handle errors
});

// ---

app.listen(2021);

//  ---

var gears_script = `
import json;

gb = GearsBuilder('KeysReader', 'room_properties:*');

gb.flatmap(lambda x: [ # why list order is reversed?
    execute('zrange', 'room_messages:' + x['key'].split(':')[1], -10, -1),
    x['value'],
    x['key'],
]);

gb.aggregate([],
             lambda a, r: a + [r],
             lambda a, r: a + r);

gb.map(lambda x: execute('set', 'homepage_json', json.dumps(x)));

gb.run(False, True);
`;

var gears_loop = function(){
    gears_client.call('RG.PYEXECUTE', gears_script, function(err, result){
        setTimeout(gears_loop, 1000);
    });
};

gears_loop();
