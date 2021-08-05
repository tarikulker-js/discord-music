const { MessageEmbed } = require("discord.js");
const sendError = require("../util/error");

module.exports = {
  info: {
    name: "remove",
    description: "Remove song from the queue",
    usage: "rm <number>",
    aliases: ["rm"],
  },

  run: async function (client, message, args) {
   const queue = message.client.queue.get(message.guild.id);
    if (!queue) return sendError("There is no queue.",message.channel).catch(console.error);
    if (!args.length) return sendError(`Kullanım: ${client.config.prefix}\`remove <Queue_Number>\``);
    if (isNaN(args[0])) return sendError(`Kullanım: ${client.config.prefix}\`remove <Queue_Number>\``);
    if (queue.songs.length == 1) return sendError("Sırada parça yok.",message.channel).catch(console.error);
    if (args[0] > queue.songs.length)
      return sendError(`Sıra sadece ${queue.songs.length} parça uzunluğunda!`,message.channel).catch(console.error);
try{
    const song = queue.songs.splice(args[0] - 1, 1); 
    sendError(`❌ **|** Şu parça sıradan kaldırıldı: **\`${song[0].title}\`**`,queue.textChannel).catch(console.error);
                   message.react("✅")
} catch (error) {
        return sendError(`Bilinmeyen bir hata oluştu. \nMuhtemel hata türü: ${error}`, message.channel);
      }
  },
};
