const { MessageEmbed } = require("discord.js");
const sendError = require("../util/error");

module.exports = {
  info: {
    name: "resume",
    description: "To resume the paused music",
    usage: "",
    aliases: [],
  },

  run: async function (client, message, args) {
    const serverQueue = message.client.queue.get(message.guild.id);
    if (serverQueue && !serverQueue.playing) {
      serverQueue.playing = true;
      serverQueue.connection.dispatcher.resume();
      let xd = new MessageEmbed()
      .setDescription("▶ Parça devam ettiriliyor!")
      .setColor("YELLOW")
      .setAuthor("Parça devam ettiriliyor.")
      return message.channel.send(xd);
    }
    return sendError("Şuan da sırada bir parça yok.", message.channel);
  },
};
