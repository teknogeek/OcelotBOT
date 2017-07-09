/**
 * Created by Peter on 02/07/2017.
 */
const async = require('async');
module.exports = {
    name: "Spell",
    usage: "spell [^] <word>",
    accessLevel: 0,
    commands: ["spell"],
    init: function init(bot, cb){
        bot.spellQueue = [];
        bot.processingSpellQueue = false;
        bot.spellQueueTotal = 0;
        bot.spellQueueTotalTime = 0;
        bot.spellQueueTotalRetries = 0;
        bot.spellQueueTotalFailed = 0;

        bot.processSpellQueue = function processSpellQueue(){
            if(bot.processingSpellQueue)return;
            bot.processingSpellQueue = true;
            var reaction = bot.spellQueue.shift();
            if(reaction){
                bot.spellQueueTotal++;
                var now = new Date();
                bot.spellQueueTotalTime += now-reaction.time;
                var receiver = reaction.receiver;
                delete reaction.receiver;
                receiver.addReaction(reaction, function (err) {
                    if(err) {
                        bot.log("Spell queue item failed with: "+err);
                        console.log(err);
                        reaction.retries++;
                        if (reaction.retries < 3 && err.response.message.indexOf("ate") > -1){
                            bot.spellQueueTotalRetries++;
                            reaction.receiver = receiver;
                            bot.spellQueue.unshift(reaction);
                        }else{
                            bot.spellQueueTotalFailed++;
                        }
                    }
                    bot.processingSpellQueue = false;
                    setTimeout(processSpellQueue, 200);
                });
            }else{
                bot.processingSpellQueue = false;
            }
        };
        cb();
    },
    run: function run(user, userID, channel, message, args, event, bot, recv) {
        var letters = {
            abc: ["🔤"],
            ab: ["🆎"],
            id: ["🆔"],
            vs: ["🆚"],
            ok: ["🆗"],
            cool: ["🆒"],
            "0": ["0⃣","🇴", "🅾", "⭕", "🔄", "🔃"],
            "1": ["1⃣"],
            "2": ["2⃣"],
            "3": ["3⃣"],
            "4": ["4⃣"],
            "5": ["5⃣"],
            "6": ["6⃣"],
            "7": ["7⃣"],
            "8": ["8⃣"],
            "9": ["9⃣"],
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
            off: ["📴"],
            oo: "➿",
            "$": ["💲"],
            "!!": ["‼"],
            "!": ["❗", "❕", "⚠", "‼"],
            tm: ["™"],
            a: ["🅰",  "🇦"],
            b: ["🅱", "🇧"],
            c: ["🇨", "©", "↪"],
            d: ["🇩"],
            e: ["🇪", "📧"],
            f: ["🇫"],
            g: ["🇬"],
            h: ["🇭"],
            i: ["🇮", "ℹ", "🇯", "♊", "👁"],
            j: ["🇯", "🇮"],
            k: ["🇰"],
            l: ["🇱"],
            m: ["🇲", "Ⓜ", "〽", "🇳"],
            n: ["🇳", "🇲", "Ⓜ"],
            o: ["🇴", "🅾", "⭕", "🔄", "🔃", "👁‍", "🔅", "🔆"],
            p: ["🇵", "🅿"],
            q: ["🇶"],
            r: ["🇷", "®"],
            s: ["🇸", "💲", "💰"],
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
        var target = event.d ? event.d.id : event.ts;
        if(args[1] === "^")
            recv.getMessages({
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
                            if(letters[key] != undefined)
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
                                        if(letters[key].lastIndexOf(null) === letters[key].length-1){
                                            delete letters[key];
                                        }
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
                    var reacts = str.replace(/[A-z]/g, "").split(" ");
                    reacts.splice(20);
                    async.eachSeries(reacts, function (react, cb) {
                        if (react) {
                            console.log(react);
                            bot.spellQueue.push({
                                channelID: channel,
                                messageID: target,
                                reaction: react,
                                retries: 0,
                                receiver: recv,
                                time: new Date()
                            });
                        }
                        cb();

                    }, function(){
                        bot.processSpellQueue(bot);
                    });

                });
        }

    }
};