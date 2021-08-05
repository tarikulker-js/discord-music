const { MessageEmbed } = require("discord.js");
const sendError = require("../util/error");
const util = require("../util/pagination");

module.exports = {
    info: {
        name: "queue",
        description: "To show the server songs queue",
        usage: "",
        aliases: ["q", "list", "songlist", "song-list"],
    },
    run: async function (client, message, args) {
        const permissions = message.channel.permissionsFor(message.client.user);
        if (!permissions.has(["MANAGE_MESSAGES", "ADD_REACTIONS"])) return sendError("Lütfen yetkilerimi gözden geçiriniz. ", message.channel);

        const queue = message.client.queue.get(message.guild.id);
        if (!queue) return sendError("Şuan da bir parça oynatılmıyor.", message.channel);

        const que = queue.songs.map((t, i) => `\`${++i}.\` | [\`${t.title}\`](${t.url}) - [<@${t.req.id}>]`);

        const chunked = util.chunk(que, 10).map((x) => x.join("\n"));

        const embed = new MessageEmbed()
            .setAuthor("Sırada ki parçalar")
            .setThumbnail(message.guild.iconURL())
            .setColor("BLUE")
            .setDescription(chunked[0])
            .addField("Şuan Oynatılan", `[${queue.songs[0].title}](${queue.songs[0].url})`, true)
            .addField("Bot Komut Kanalı", queue.textChannel, true)
            .addField("Ses Kanalı", queue.voiceChannel, true)
            .setFooter(`Şuan ki ses düzeyi: ${queue.volume} | 1/${chunked.length}.`);
        if (queue.songs.length === 1) embed.setDescription(`Sırada bir parça yok. \` Eklemek için: \`${message.client.config.prefix} play <song_name> | <song_url>\`\``);

        try {
            const queueMsg = await message.channel.send(embed);
            if (chunked.length > 1) await util.pagination(queueMsg, message.author, chunked);
        } catch (e) {
            msg.channel.send(`Bir hata oluştu: ${e.message}.`);
        }
    },
};
