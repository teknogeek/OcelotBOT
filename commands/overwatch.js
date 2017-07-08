/**
 * Created by Peter on 08/07/2017.
 */
const request = require('request');
const platforms = ["pc", "ps4", "xbl"];
const regions = ["us", "eu", "kr", "cn", "global"];


const ranks = {
    "https://blzgdapipro-a.akamaihd.net/game/rank-icons/season-2/rank-1.png": "Bronze",
    "https://blzgdapipro-a.akamaihd.net/game/rank-icons/season-2/rank-2.png": "Silver",
    "https://blzgdapipro-a.akamaihd.net/game/rank-icons/season-2/rank-3.png": "Gold",
    "https://blzgdapipro-a.akamaihd.net/game/rank-icons/season-2/rank-4.png": "Platinum",
    "https://blzgdapipro-a.akamaihd.net/game/rank-icons/season-2/rank-5.png": "Diamond",
    "https://blzgdapipro-a.akamaihd.net/game/rank-icons/season-2/rank-6.png": "Master",
    "https://blzgdapipro-a.akamaihd.net/game/rank-icons/season-2/rank-7.png": "Grandmaster",
};
module.exports = {
    name: "Overwatch Profile Info",
    usage: "overwatch <profile> [platform] [region]",
    accessLevel: 0,
    commands: ["overwatch", "ow"],
    run: function run(user, userID, channel, message, args, event, bot, recv) {
        recv.simulateTyping(channel);
        function render(platform, region, user){
            request(`http://ow-api.herokuapp.com/profile/${platform}/${region}/${user}`, function(err, resp, body){
                if(err){
                    recv.sendMessage({
                        to: channel,
                        message: ":bangbang: Error contacting Overwatch API. Try again later."
                    });
                    bot.error(err.stack);
                }else{
                    try{
                        var data = JSON.parse(body);
                       recv.sendMessage({
                           to: channel,
                           message: "",
                           embed: {
                               color: 0xF59503,
                               title: `Overwatch profile for ${data.username}:`,
                               description: "",
                               author: {
                                   name: "Overwatch Profile",
                                   icon_url: "https://vignette1.wikia.nocookie.net/overwatch/images/1/1f/Overwatchemblem_black.png/revision/latest/scale-to-width-down/16?cb=20160519003857"
                               },
                               thumbnail: {
                                    "url": data.portrait
                               },
                               fields: [
                                   {
                                       name: "Level",
                                       value: ""+data.level,
                                       inline: true
                                   },
                                   {
                                       name: "Quickplay",
                                       value: `**${data.games.quickplay.won}** games won. **${data.playtime.quickplay}** played.`,
                                       inline: true
                                   },
                                   {
                                       name: "Competitive",
                                       value: data.competitive.rank_img ? `${ranks[data.competitive.rank_img]} **${data.games.competitive.won}** wins / **${data.games.competitive.lost}** losses / **${data.games.competitive.draw}** draws. **${data.playtime.competitive}** played.`
                                       : `Not finished placements. (${data.games.competitive.played}/10 played.)`,
                                       inline: true
                                   }
                               ]
                           }
                       });
                    }catch(e){
                        recv.sendMessage({
                            to: channel,
                            message: `:bangbang: Error parsing Overwatch data. Try again later. ${body}`
                        });
                        bot.error(e.stack);
                    }
                }
            });
        }

        if(args[1]){
            var region = (args[2] && regions.indexOf(args[2]) > -1) ? args[2] : (args[3] && regions.indexOf(args[3]) > -1) ? args[3] : "eu";
            if(args[1].indexOf("#") > -1){
                render("pc", region, args[1].replace("#", "-"))
            }else if(!args[2] || platforms.indexOf(args[2]) === -1){
                recv.sendMessage({
                    to: channel,
                    message: ":bangbang: You must enter a platform: pc/ps4/xbl"
                });
            }else{
                render(args[2], region, args[1].replace("#", "-"))
            }
        }else{
            recv.sendMessage({
                to: channel,
                message: ":bangbang: You must enter a battletag i.e: !overwatch Peter#25877"
            });
        }


    }
};