/**
 * Created by Peter on 02/07/2017.
 */

const request = require('request');
const async = require('async');
const columnify = require('columnify');
const config = require('config');
var questionsInProgress = [];
var correctAnswer = false;

const difficulties = [
    "easy",
    "medium",
    "hard"
];

module.exports = {
    name: "Trivia Game",
    usage: "trivia [leaderboard]",
    accessLevel: 0,
    commands: ["trivia"],
    run: function run(user, userID, channel, message, args, event, bot, recv) {
        if(args[1] && (args[1].toLowerCase() === "stats" || args[1].toLowerCase() === "leaderboard")){
            bot.database.getTriviaLeaderboard()
                .then(function(result){
                        var data = [];
                        var i = 1;
                        async.eachSeries(result, function(entry, cb){
                            var user = recv.getUser(entry.user);
                            data.push({
                                "#": i++,
                                "User": user ? `${user.username}#${user.discriminator}` : `Unknown User ${entry.user}`,
                                "Score": entry.Score,
                                "Correct": entry.correct,
                            });
                            cb();
                        }, function(){
                            recv.sendMessage({
                                to: channel,
                                message: "TOP 10 Trivia Players:\n```yaml\n"+columnify(data)+"\n```"
                            });
                        })
                })
                .catch(function(err){
                    bot.error(err);
                    console.log(err);
                    recv.sendMessage({
                        to: channel,
                        message: ":warning: Error getting leaderboard. Try again later."
                    });
                });

        }else if(questionsInProgress.indexOf(channel) > -1){
            bot.sendMessage({
                to: channel,
                message: "You can't start another question when one is already in progress. Vote with reactions!"
            });
        }else {
            request("https://opentdb.com/api.php?amount=1&type=boolean&encode=url3986", function (err, resp, body) {
                if (err) {
                    recv.sendMessage({
                        to: channel,
                        message: `:warning: Trivia service is currently unavailable (${err})`
                    })
                } else {
                    const triviaSeconds = config.get("Commands.trivia.seconds");
                    questionsInProgress.push(channel);
                    try {
                        var data = JSON.parse(body);
                        if (data.results[0]) {
                            var question = data.results[0];
                            correctAnswer = question.correct_answer === "True";
                            var winners = "";
                            var results = {};
                            var winnerArray;
                            var wrong;
                            async.mapValuesSeries({
                                    attachmentResp: function (cb) {
                                        recv.sendAttachment(channel, `Category: *${decodeURIComponent(question.category)}*`, [{
                                            fallback: `True/False: ${encodeURIComponent(question.question)}. React :white_check_mark: for true and :negative_squared_cross_mark: for false. You have ${triviaSeconds} seconds.`,
                                            color: "#00ad00",
                                            title: `*You have ${triviaSeconds} seconds to answer.*\nTrue or False:`,
                                            text: decodeURIComponent(question.question),
                                            fields: [
                                                {
                                                    title: "For TRUE:",
                                                    value: "React with :white_check_mark:",
                                                    short: true
                                                },
                                                {
                                                    title: "For FALSE:",
                                                    value: "React with :negative_squared_cross_mark:",
                                                    short: true
                                                }
                                            ]
                                        }], cb);
                                    },
                                    addTrueReact: function (cb) {
                                        recv.addReaction({
                                            channelID: channel,
                                            messageID: results.attachmentResp.id || results.attachmentResp.ts,
                                            reaction: "✅",
                                            reactionName: "white_check_mark"
                                        }, cb);
                                    },
                                    addFalseReact: function (cb) {
                                        recv.addReaction({
                                            channelID: channel,
                                            messageID: results.attachmentResp.id || results.attachmentResp.ts,
                                            reaction: "❎",
                                            reactionName: "negative_squared_cross_mark"
                                        }, cb);
                                    },
                                    triviaEnd: function (cb) {
                                        setTimeout(cb, triviaSeconds * 1000);
                                    },
                                    getTrueReacts: function (cb) {
                                        if (recv.id === "discord") {
                                            recv.getReaction({
                                                channelID: channel,
                                                messageID: results.attachmentResp.id,
                                                reaction: "✅"
                                            }, cb);
                                        } else {
                                            //TODO
                                            // bot.web.reactions.get({
                                            //     channel: channel,
                                            //     timestamp: results.attachmentResp.ts
                                            // }, cb);
                                        }
                                    },
                                    getFalseReacts: function (cb) {
                                        if (recv.id === "discord") {
                                            recv.getReaction({
                                                channelID: channel,
                                                messageID: results.attachmentResp.id,
                                                reaction: "❎"
                                            }, cb);
                                        } else {
                                            cb();
                                        }
                                    },
                                    calculateWinners: function (cb) {
                                        var trueVoters = [], falseVoters = [];
                                        if (!(recv.id === "discord")) {
                                            var fullResult = results.getTrueReacts;
                                            for (var i in fullResult.message.reactions) {
                                                if (fullResult.message.reactions[i].name === "white_check_mark") {
                                                    results.getTrueReacts = fullResult.message.reactions[i].users;
                                                } else if (fullResult.message.reactions[i].name === "negative_squared_cross_mark") {
                                                    results.getFalseReacts = fullResult.message.reactions[i].users;
                                                }
                                            }
                                        }
                                        for (var i in results.getTrueReacts) {
                                            trueVoters.push("<@" + (recv.id === "discord" ? results.getTrueReacts[i].id : results.getTrueReacts[i]) + ">");
                                        }
                                        for (var j in results.getFalseReacts) {
                                            falseVoters.push("<@" + (recv.id === "discord" ? results.getFalseReacts[j].id : results.getFalseReacts[j]) + ">");
                                        }

                                        var correct = (correctAnswer ? trueVoters : falseVoters);
                                        wrong = (!correctAnswer ? trueVoters : falseVoters);

                                        winnerArray = [];

                                        for (var k in correct) {
                                            var user = correct[k];
                                            if (wrong.indexOf(user) === -1) {
                                                winnerArray.push(user);
                                            }
                                        }
                                        var points = difficulties.indexOf(question.difficulty) + 1;
                                        winners = winnerArray.length > 0 ? "Congratulations " + winnerArray.join(" ") + `\nYou${winnerArray.length > 1 ? " each" : ""} earned ${points} point${points > 1 ? "s" : ""}!` : "Nobody won that round.";
                                        setTimeout(cb, 100);
                                    },
                                    showWinners: function (cb) {
                                        recv.sendMessage({
                                            to: channel,
                                            message: `:watch: Time's up! The correct answer was **${correctAnswer}**.\n${winners}`
                                        }, cb);
                                    },
                                    addScores: function (cb) {
                                        async.eachSeries(winnerArray, function (winner, cb2) {
                                            var id = winner.replace(/[<>@]/g, "");
                                            bot.database.logTrivia(id, 1, difficulties.indexOf(question.difficulty) + 1, recv.getServerFromChannel(channel))
                                                .then(function(){
                                                    cb2()
                                                })
                                                .catch(function(err){
                                                    bot.error(err);
                                                });
                                        }, cb);
                                    },
                                    addLosers: function (cb) {
                                        async.eachSeries(wrong, function (winner, cb2) {
                                            var id = winner.replace(/[<>@]/g, "");
                                            if (id !== "146293573422284800")
                                                bot.database.logTrivia(id, 0, difficulties.indexOf(question.difficulty) + 1, recv.getServerFromChannel(channel))
                                                    .then(function(){
                                                        cb2()
                                                    })
                                                    .catch(function(err){
                                                        bot.error(err);
                                                    });
                                            else cb2();
                                        }, cb);
                                    }
                                },
                                function (func, key, callback) {
                                    setTimeout(function () {
                                        func(function (err, result) {
                                            if (result) {
                                                results[key] = result;
                                            }
                                            callback(err, result);
                                        });
                                    }, 150);
                                }
                                , function (err) {
                                    if (err) {
                                        bot.log(err);
                                    }
                                    delete questionsInProgress[questionsInProgress.indexOf(channel)];
                                });

                        } else {
                            recv.sendMessage({
                                to: channel,
                                message: ":warning: Trivia service is currently unavailable. Try again later."
                            });
                            bot.error(body);
                        }
                    } catch (e) {
                        recv.sendMessage({
                            to: channel,
                            message: ":warning: Error parsing trivia question. Try again later."
                        });
                        bot.error(e.stack);
                        bot.error(body);
                    }
                }

            });
        }
    }
};