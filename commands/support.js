/**
 * Created by Peter on 18/07/2017.
 */
module.exports = {
    name: "Support",
    usage: "support",
    accessLevel: 0,
    commands: ["support", "donate"],
    run: function run(user, userID, channel, message, args, event, bot, recv) {
        recv.sendMessage({
            to: channel,
            embed: {
                title: "[Click Here To Join The Support Server](https://discord.gg/7YNHpfF)",
                description: "Running a Discord bot is costly. If you enjoy OcelotBOT click [here](https://www.paypal.me/petermaguire) to donate."
            }
        });
    }
};