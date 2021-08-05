const { Util, MessageEmbed } = require("discord.js");
const ytdl = require("ytdl-core");
const ytdlDiscord = require("discord-ytdl-core");
const yts = require("yt-search");
const fs = require("fs");
const sendError = require("../util/error");
const scdl = require("soundcloud-downloader").default;

module.exports = {
    info: {
        name: "play",
        description: "To play songs :D",
        usage: "<YouTube_URL> | <song_name>",
        aliases: ["p"],
    },

    run: async function (client, message, args) {
        let channel = message.member.voice.channel;
        if (!channel) return sendError("Lütfen öncelikle bir ses kanalına katılınız.", message.channel);

        const permissions = channel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) return sendError("Bu ses kanalına bağlanamıyorum. Lütfen izinlerimi gözden geçiriniz!", message.channel);
        if (!permissions.has("SPEAK")) return sendError("Bu ses kanalına bağlanamıyorum. Lütfen izinlerimi gözden geçiriniz!", message.channel);

        var searchString = args.join(" ");
        if (!searchString) return sendError("Lütfen çalmak istediğiniz parçanın adını giriniz.", message.channel);
        const url = args[0] ? args[0].replace(/<(.+)>/g, "$1") : "";
        var serverQueue = message.client.queue.get(message.guild.id);

        let songInfo;
        let song;
        if (url.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi)) {
            try {
                songInfo = await ytdl.getInfo(url);
                if (!songInfo) return sendError("Parça bulunamadı. Lütfen tekrar deneyiniz. Ya da Parça URL'ini giriniz. ", message.channel);
                song = {
                    id: songInfo.videoDetails.videoId,
                    title: songInfo.videoDetails.title,
                    url: songInfo.videoDetails.video_url,
                    img: songInfo.player_response.videoDetails.thumbnail.thumbnails[0].url,
                    duration: songInfo.videoDetails.lengthSeconds,
                    ago: songInfo.videoDetails.publishDate,
                    views: String(songInfo.videoDetails.viewCount).padStart(10, " "),
                    req: message.author,
                };
            } catch (error) {
                console.error(error);
                return message.reply(error.message).catch(console.error);
            }
        } else if (url.match(/^https?:\/\/(soundcloud\.com)\/(.*)$/gi)) {
            try {
                songInfo = await scdl.getInfo(url);
                if (!songInfo) return sendError("Görünüşe göre soundcloud'da böyle bir parça bulunamadı. Lütfen URL'ini girmeyi deneyiniz. ", message.channel);
                song = {
                    id: songInfo.permalink,
                    title: songInfo.title,
                    url: songInfo.permalink_url,
                    img: songInfo.artwork_url,
                    ago: songInfo.last_modified,
                    views: String(songInfo.playback_count).padStart(10, " "),
                    duration: Math.ceil(songInfo.duration / 1000),
                    req: message.author,
                };
            } catch (error) {
                console.error(error);
                return sendError(error.message, message.channel).catch(console.error);
            }
        } else {
            try {
                var searched = await yts.search(searchString);
                if (searched.videos.length === 0) return sendError("Görünüşe göre Youtube'da böyle bir parça bulunamadı. Lütfen URL'ini girmeyi deneyiniz.", message.channel);

                songInfo = searched.videos[0];
                song = {
                    id: songInfo.videoId,
                    title: Util.escapeMarkdown(songInfo.title),
                    views: String(songInfo.views).padStart(10, " "),
                    url: songInfo.url,
                    ago: songInfo.ago,
                    duration: songInfo.duration.toString(),
                    img: songInfo.image,
                    req: message.author,
                };
            } catch (error) {
                console.error(error);
                return message.reply(error.message).catch(console.error);
            }
        }

        if (serverQueue) {
            serverQueue.songs.push(song);
            let thing = new MessageEmbed()
                .setAuthor("Şarkı sıraya eklendi")
                .setThumbnail(song.img)
                .setColor("YELLOW")
                .addField("Parça Adı", song.title, true)
                .addField("Parça Uzunluğu", song.duration, true)
                .addField("Parçayı Başlatan kullanıcı", song.req.tag, true)
                .setFooter(`Dinlenmeler: ${song.views} | ${song.ago}`);
            return message.channel.send(thing);
        }

        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: channel,
            connection: null,
            songs: [],
            volume: 80,
            playing: true,
            loop: false,
        };
        message.client.queue.set(message.guild.id, queueConstruct);
        queueConstruct.songs.push(song);

        const play = async (song) => {
            const queue = message.client.queue.get(message.guild.id);
            if (!song) {
                sendError(
                    "Sırada bir şarkı olmadığı için Ses Kanalından Ayrılıyorum.",
                    message.channel
                );
                message.client.queue.delete(message.guild.id);
                return;
            }
            let stream;
            let streamType;

            try {
                if (song.url.includes("soundcloud.com")) {
                    try {
                        stream = await scdl.downloadFormat(song.url, scdl.FORMATS.OPUS, client.config.SOUNDCLOUD);
                    } catch (error) {
                        stream = await scdl.downloadFormat(song.url, scdl.FORMATS.MP3, client.config.SOUNDCLOUD);
                        streamType = "unknown";
                    }
                } else if (song.url.includes("youtube.com")) {
                    stream = await ytdlDiscord(song.url, { filter: "audioonly", quality: "highestaudio", highWaterMark: 1 << 25, opusEncoded: true });
                    streamType = "opus";
                    stream.on("error", function (er) {
                        if (er) {
                            if (queue) {
                                queue.songs.shift();
                                play(queue.songs[0]);
                                return sendError(`Beklenmeyen bir hata oluştu. \nMuhtemelen hata tipi: \`${er}\``, message.channel);
                            }
                        }
                    });
                }
            } catch (error) {
                if (queue) {
                    queue.songs.shift();
                    play(queue.songs[0]);
                }
            }
            queue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id));
            const dispatcher = queue.connection.play(stream, { type: streamType }).on("finish", () => {
                const shiffed = queue.songs.shift();
                if (queue.loop === true) {
                    queue.songs.push(shiffed);
                }
                play(queue.songs[0]);
            });

            dispatcher.setVolumeLogarithmic(queue.volume / 100);
            let thing = new MessageEmbed()
                .setAuthor("Parça başlatıldı")
                .setThumbnail(song.img)
                .setColor("BLUE")
                .addField("Parça Adı", song.title, true)
                .addField("Parça Uzunluğu", song.duration, true)
                .addField("Parçayı Başlatan kullanıcı", song.req.tag, true)
                .setFooter(`Dinlenmeler: ${song.views} | ${song.ago}`);
            queue.textChannel.send(thing);
        };

        try {
            const connection = await channel.join();
            queueConstruct.connection = connection;
            play(queueConstruct.songs[0]);
        } catch (error) {
            console.error(`Ses kanalına katılamadım. Hata: ${error}`);
            message.client.queue.delete(message.guild.id);
            await channel.leave();
            return sendError(`Ses kanalına katılamadım. Hata: ${error}`, message.channel);
        }
    },
};
