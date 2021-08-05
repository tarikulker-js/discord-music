const { MessageEmbed } = require("discord.js");
const sendError = require("../util/error");

module.exports = {
    info: {
        name: "leave",
        aliases: ["goaway", "disconnect"],
        description: "Leave The Voice Channel!",
        usage: "Leave",
    },

    run: async function (client, message, args) {
        let channel = message.member.voice.channel;
        if (!channel) return sendError("Lütfen öncelikle bir kanala giriniz.", message.channel);
        if (!message.guild.me.voice.channel) return sendError("Herhangi bir ses kanalında değilim.", message.channel);

        try {
            await message.guild.me.voice.channel.leave();
        } catch (error) {
            await message.guild.me.voice.kick(message.guild.me.id);
            return sendError("Ses kanalından ayrılınılıyor...", message.channel);
        }

        const Embed = new MessageEmbed()
            .setAuthor("Leave Voice Channel")
            .setColor("GREEN")
            .setTitle("Success")
            .setDescription("Sesli kanaldan ayrılındı 🎶 🎶 🎶")
            .setTimestamp();

        return message.channel.send(Embed).catch(() => message.channel.send("🎶 Kanaldan ayrılırken bir sorun oluştu. "));
    },
};
