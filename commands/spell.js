/**
 * Created by Peter on 03/06/2017.
 */
var async = require('async');


exports.command = {
    name: "spell",
    desc: "Spell a word with reactions. Use ^ to spell it on the last message",
    usage: "spell [^] [word]",
    func: function(user, userID, channel, args, message, bot, event){
        if(args.length < 2){
            return false;
        }

        var letters = {
            abc: ["🔤"],
            ab: ["🆎"],
            id: ["🆔"],
            vs: ["🆚"],
            ok: ["🆗"],
            cool: ["🆒"],
            "0": ["🇴", "🅾", "⭕", "🔄", "🔃"],
            "10": ["🔟"],
            "100": ["💯"],
            lo: ["🔟"],
            new: ["🆕"],
            ng: ["🆖"],
            free: ["🆓"],
            cl: ["🆑"],
            wc: ["🚾"],
            sos: ["🆘"],
            atm: ["🏧"],
            up: ["🆙"],
            end: ["🔚"],
            back: ["🔙"],
            on: ["🔛"],
            top: ["🔝"],
            soon: ["🔜"],
            "$": ["💲"],
            "!!": ["‼"],
            "!": ["❗", "❕", "⚠", "‼"],
            tm: ["™"],
            a: ["🅰",  "🇦"],
            b: ["🅱", "🇧"],
            c: ["🇨", "©", "↪"],
            d: ["🇩"],
            e: ["🇪"],
            f: ["🇫"],
            g: ["🇬"],
            h: ["🇭"],
            i: ["🇮", "ℹ", "🇯", "♊", "👁"],
            j: ["🇯", "🇮"],
            k: ["🇰"],
            l: ["🇱"],
            m: ["🇲", "Ⓜ", "🇳"],
            n: ["🇳", "🇲", "Ⓜ"],
            o: ["🇴", "🅾", "⭕", "🔄", "🔃"],
            p: ["🇵", "🅿"],
            q: ["🇶"],
            r: ["🇷", "®"],
            s: ["🇸", "💲"],
            t: ["🇹"],
            u: ["🇺"],
            v: ["🇻"],
            w: ["🇼"],
            x: ["🇽", "❌", "✖", "❎"],
            y: ["🇾"],
            z: ["🇿", "💤"]
        };

        var str = message.toLowerCase().substring(7).replace(" ", "");
        var keys = Object.keys(letters);
        var times = 0;
        var done = true;
        var target = event.d.id;
        if(args[1] === "^")
            bot.getMessages({
                channelID: channel,
                limit: 2
            }, function(err, resp){
                target = resp[1].id;
                doTheRestOfIt();
            });
        else doTheRestOfIt();
        function doTheRestOfIt() {
            async.doUntil(function (callback) {
                    done = true;
                    times++;
                    async.eachSeries(keys, function (key, cb) {
                        var ind = str.indexOf(key);
                        if (ind > -1) {
                            done = false;
                            var sub;
                            var i = -1;
                            async.doWhilst(function (cb2) {
                                i++;
                                sub = letters[key][i];
                                cb2();
                            }, function () {
                                return !sub && i < letters[key].length;
                            }, function () {
                                if (sub) {
                                    str = str.replace(key, sub + " ");
                                    letters[key][i] = null;
                                }
                            });
                        }
                        cb();
                    }, callback);
                },
                function () {
                    console.log("Run times:" + times);
                    return done || times > 30;
                },
                function () {
                    var reacts = str.replace(/[A-z]/, "").split(" ");
                    async.eachSeries(reacts, function (react, cb) {
                        if (react) {
                            console.log(react);
                            bot.addReaction({
                                channelID: channel,
                                messageID: target,
                                reaction: react
                            }, function () {
                                setTimeout(cb, 500);
                            });
                        }
                        else
                            cb();

                    })

                });
        }


        return true;
    }
};