(function(){
    $.ajax({
        url : '/homepage_json',
        dataType : 'text',
    }).done(function(data){ // todo: handle errors
        render_homepage(JSON.parse(data));
    });

    if(typeof Cookies.get('jwt') === 'undefined')
        $('.register').show();
})();

var render_homepage = function(json){
    var html = '',
        ui_items_in_row = 0,
        ui_items_per_row = 3;

    for(var i=0, room_id, room_topic, room_messages, l=json.length;i<l;i=i+3){
        room_id = json[i+0].split(':')[1];
        room_topic = json[i+1].topic;
        room_messages = json[i+2];

        if(ui_items_in_row === 0)
            html += '<div class="row">';

        ui_items_in_row++;

        html += `
                <div class="room" data-room_id="${room_id}">
                    <div class="sidebar">
                        <div class="image" style="background: url('/static/demo/${room_id}.png')"></div>
                        <div class="topic">${room_topic}</div>
                    </div>
                    <div class="messages">
                            ${render_messages(room_messages, true)}
                    </div><!-- /messages -->
                    <input class="new_message" type="text" />
                </div><!-- /room -->
        `;

        if(ui_items_in_row === ui_items_per_row){
            html += '</div><!-- /row -->';
            ui_items_in_row = 0;

            ui_items_per_row = ui_items_per_row === 3 ? 4 : 3;
        };

    };

    $('.jsdom').html(html);

    // ---

    $('.messages').each(function(k, v){
        v.scrollTop = v.scrollHeight; // scroll to end
    });
};

var render_messages = function(arr, str_arr){
    var html = '';
    for(var i=0, t, l=arr.length;i<l;i++){

        if(str_arr === true)
            t = JSON.parse(arr[i]);
        else
            t = arr[i];

        html += `<div class="text">${multiavatar(t.username)}<span>${t.username}</span>: ${t.message}</div>`; // todo: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
    };

    return html;
};

// ---

$('.jsdom').on('keyup', 'input', function(e){
    if(e.key !== 'Enter')
        return;

    var message = this.value.trim();

    if(message.length === 0)
        return;

    this.value = '';

    var input = $(this),
        room_id = input.parent().data('room_id');

    $.ajax({
        url : '/new_message',
        method : 'post',
        data : {room_id : room_id, message : message},
    });
});

$('.register div').click(function(){
    var username = $('#username').val(),
        password = $('#password').val();

    $.ajax({
        url : '/register',
        method : 'post',
        data : {username : username, password : password},
    }).done(function(data){ // todo: handle errors
        if(data === '-1')
            return alert('This username is already taken');

        $('.register').hide();
    });
});

// ---

var socket = io('ws://all.chat.redis:2022', {transports : ['websocket']});

socket.on('custom_event', function(e){
    switch(e.type){
        case 'new_room':
            // todo
        break;
        case 'new_message':
            var dom = $('.room[data-room_id=' + e.room_id + '] .messages');

            if(dom.length === 0)
                return;

            var el = dom[0],
                at_end = el.scrollHeight - el.scrollTop === el.clientHeight;

            dom.append(render_messages([e]));

            if(at_end)
                el.scrollTop = el.scrollHeight;
        break;
        default:
            return;
        break;
    };
});
