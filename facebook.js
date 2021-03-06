/**
 * Created by Peter on 20/07/2016.
 */

var request = require('request');

module.exports = function(bot){
    return {
        name: "Facebook Message Listener",
        init: function init(cb){
            bot.app.get('/facebook', function facebookWebhookValidate(req, res){

                if (req.query['hub.mode'] === 'subscribe' &&
                    req.query['hub.verify_token'] === "bootybooty") {
                    bot.log("Validating webhook");
                    res.status(200).send(req.query['hub.challenge']);
                } else {
                    console.error("Failed validation. Make sure the validation tokens match.");
                    res.status(403);
                }
            });

            bot.app.post('/facebook', function facebookWebhook(req, res){
                var data = req.body;
                bot.log("yesy");
                console.log(data);
                // Make sure this is a page subscription
                if (data.object == 'page') {
                    // Iterate over each entry
                    // There may be multiple if batched
                    data.entry.forEach(function(pageEntry) {
                        var pageID = pageEntry.id;
                        var timeOfEvent = pageEntry.time;

                        // Iterate over each messaging event
                        pageEntry.messaging.forEach(function(messagingEvent) {
                            bot.log("got a thing");
                            console.log(messagingEvent);
                            receivedMessage(messagingEvent);
                        });
                    });

                    // Assume all went well.
                    //
                    // You must send back a 200, within 20 seconds, to let us know you've
                    // successfully received the callback. Otherwise, the request will time out.
                    res.sendStatus(200);
                }
            });
            bot.log("Registered facebook callbacks");
            if(cb)
                cb();
        }
    }
};


function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: "EAABjGqKs9qEBAMOraKTyWAOOUADMZC8jMUJwB7SOg8nDtwwEQgJVfkZAX7GzoZCtInyYHSdvUijxYb36JEGMqqsV9m6iPDoqXgGDnwJ3V6kUaaOGQAp1r9yBbDhU95g9lZAbuCKxtX1fYIorSX9IPQqyVkNjDHgHZCfrnsvkxogZDZD" },
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            console.log("Successfully sent generic message with id %s to recipient %s",
                messageId, recipientId);
        } else {
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });
}

function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    var messageId = message.mid;

    // You may get a text or attachment but not both
    var messageText = message.text;
    var messageAttachments = message.attachments;

    if (messageText) {

        // If we receive a text message, check to see if it matches any special
        // keywords and send back the corresponding example. Otherwise, just echo
        // the text we received.
        switch (messageText) {
            case 'image':
               // sendImageMessage(senderID);
                break;

            case 'button':
                //sendButtonMessage(senderID);
                break;

            case 'generic':
               // sendGenericMessage(senderID);
                break;

            case 'receipt':
               // sendReceiptMessage(senderID);
                break;

            default:
                sendTextMessage(senderID, messageText);
        }
    } else if (messageAttachments) {
        sendTextMessage(senderID, "Message with attachment received");
    }
}

function sendTextMessage(recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    callSendAPI(messageData);
}