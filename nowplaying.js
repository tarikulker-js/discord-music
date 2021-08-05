const { MessageEmbed } = require("discord.js");
const sendError = require("../util/error")

module.exports = {
  info: {
    name: "nowplaying",
    description: "To show the music which is currently playing in this server",
    usage: "",
    aliases: ["np"],
  },

  run: async function (client, message, args) {
    const serverQueue = message.client.queue.get(message.guild.id);
    if (!serverQueue) return sendError("Şuan da hiçbir parça çalmıyor.", message.channel);
    let song = serverQueue.songs[0]
    let thing = new MessageEmbed()
      .setAuthor("Şuan çalan parça")
      .setThumbnail(song.img)
      .setColor("BLUE")
      .addField("Şarkı Adı", song.title, true)
      .addField("Parça Uzunluğu", song.duration, true)
      .addField("Parçayı açan kullanıcı", song.req.tag, true)
      .setFooter(`Toplam dinlenmeler: ${song.views}  ${song.ago}`)
    return message.channel.send(thing)
  },
};
