# all.chat.redis
Node.js demo chat app, where all `rooms` are on the home page. Messages are fanned with `socket.io` and redis pub/sub, uses RedisGears to re-generate the JSON snapshot cache.

![](https://raw.githubusercontent.com/allchatredis/all.chat.redis/main/src/static/demo/screen_1.png)

# How it works

![](https://raw.githubusercontent.com/allchatredis/all.chat.redis/main/src/static/demo/screen_2.png)

**Storage**

Homepage `snapshot` in a simple string key (homepage_json)

Previous `chat messages` as a stringified JSON in a sorted set (room_messages:id)

`room topics` (and possibly other properties) in a hash (room_properties:id)

Users authentication uses JWT tokens with a simple username -> hashed `password` map (user_password_hash)

# Running

```
clone/download repository

npm install

(start Redis with RedisGears module)

node demo_data.js // generate demo chat rooms with messages

node socket.js    // socket.io
node webserver.js

add to `hosts` `127.0.0.1 all.chat.redis`.

visit `http://all.chat.redis:2021`.
```
