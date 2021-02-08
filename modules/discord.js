module.exports = (connection) => {
    const discord = require("discord.js");
    const client = new discord.Client();
    const events = connection.getEmitter();
    let online = false;

    client.on("ready", () => {
        online=true;
        console.log(`2b2w: Discord bot online as ${client.user.username}/${client.user.id}`)
    })

    events.on("connected", (data) => {
        if (online){
            client.user.setActivity(`Connected to 2b2t`, {type: 'PLAYING' });
        }
    })
    events.on("queue_update", (data) => {
        if (online){
            const timeRemaining = data.magicEstimation;
            const hours = Math.round(timeRemaining/60)-1;
            const minutes = Math.round(timeRemaining%60);
            client.user.setActivity(`P: ${data.position} E: ${data.estimation} ${hours !== NaN && minutes !== NaN ? `Hrs: ${hours} Mins: ${minutes}` : ""}`, {type: 'PLAYING' });

            if (config.discord_configuration.notificationSettings.enabled == true){
                if (data.position <= config.discord_configuration.notificationSettings.place){
                    client.users.fetch(config.discord_configuration.ownerId).then(user => {
                        user.createDM().then(channel => {
                            const embed = new discord.MessageEmbed()
                            .setColor('#1c60ff')
                            .setTitle('2b2w Notification')
                            .setDescription('You\'re almost connected!')
                            .addField(`Position`, status.queuePosition, true)
                            .addField(`Estimation`, status.queueEstimation, true)
                            .addField(`Magic Estimation [in seconds]`, timeRemaining, true)
                            .setTimestamp();
            
                            channel.send(embed)
                        }).reject(() => {

                        })
                    }).reject(() => {

                    })
                }
            }
        }
    })
    events.on("finished_queue", (data) => {
        if (online){
            client.user.setActivity(`Finished queue 2b2t, in-game!`, {type: 'PLAYING' });
        }
    })
    events.on("disconnected", (data) => {
        if (online){
            client.user.setActivity(`Disconnected from 2b2t`, {type: 'PLAYING' });
        }
    })

    client.on("message", (msg) => {
        const content = msg.content;
        if (msg.author.id == config.discord_configuration.ownerId){ // ensure only bot owner has control

            if (content == "status"){
                const status = connection.getSettings();
                const embed = new discord.MessageEmbed()
                .setColor('#1c60ff')
                .setTitle('2b2w Status')
                .setDescription('Status for your amazing waiting')
                .addField(`Bot connected?`, status.inQueue == true || status.inGame == true, true)
                .addField(`In queue?`, status.inQueue, true)
                .addField(`In game?`, status.inGame, true)
                .addField(`Position`, status.queuePosition, true)
                .addField(`Estimation`, status.queueEstimation, true)
                .addField(`Can connect`, status.canConnect, true)
                .setTimestamp();

               msg.reply(embed)

            }
            if (content == "start"){
                const embed = new discord.MessageEmbed()
                .setColor('#1c60ff')
                .setTitle('2b2w Start')
                .setDescription('Joining the queue, this may take a minute if your recently disconnected from the server.')
                .setTimestamp();

               msg.reply(embed);

               connection.startConnection();

            }
            if (content == "stop"){
                const embed = new discord.MessageEmbed()
                .setColor('#1c60ff')
                .setTitle('2b2w Stop')
                .setDescription('Leaving the queue')
                .setTimestamp();

               msg.reply(embed);

               connection.leaveQueue();

            }

        }
    })

    client.login(config.discord_configuration.botToken)
}