var request = require('request');

exports.command = {
	name: "nowplaying",
	desc: "Show whats currently playing",
	usage: "nowplaying",
	func: function(user, userID, channel, args, message, bot){
	    var target = args[1] ? args[1].replace("<@", "").replace(">", "") : userID;
        request(`https://unacceptableuse.com/petify/api/${bot.config.petify.apiKey}/nowPlaying/${bot.config.petify.users[target] ? bot.config.petify.users[target] : bot.config.petify.users["139871249567318017"]}`, function(err, resp, body){
            if(err){
                bot.sendMessage({
                    to: channel,
                    message: err
                });
            }else{
                try {
                    var data = JSON.parse(body);
                    if (data.err) {
                        bot.sendMessage({
                            to: channel,
                            message: "Error getting data from Petify:\n```\n"+JSON.stringify(data.err)+"\n```"
                        });
                    } else {
                        if(!bot.isDiscord){
                            bot.web.chat.postMessage(channel,  ":petify: Now Playing: *<https://unacceptableuse.com/petify/song/"+data.song_id+"/-|" + data.artist_name + " - " + data.title + ">*", {
                                parse: true,
                                unfurl_media: true,
                                unfurl_links: true
                            });
                        }else{
                            bot.sendMessage({
                                to: channel,
                                message: "Now Playing: *" + data.artist_name + " - " + data.title + "*\nhttps://unacceptableuse.com/petify/song/"+data.song_id+"/-%7C"
                            });
                        }


                    }
                }catch(e){
                    bot.sendMessage({
                        to: channel,
                        message: "Error: "+e
                    });
                    bot.log(body);
                }
            }
        });



		return true;
		
	},
    test: function(test){
        test.cb('nowplaying', function(t){
            t.plan(2);
            var bot = {};
            bot.sendMessage = function(data){
                t.true(data.message.indexOf("Now Playing") > -1 || data.message.indexOf("Nothing is Playing!") > -1);
                t.end();
            };

            t.true(exports.command.func(null, null, "", ["nowplaying"], "", bot));
        });
    }
};


