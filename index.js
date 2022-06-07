const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const token = 'OTEzNDE3ODczNjM1MDI0OTA3.YZ-Mrw.HxaKwTW5wrDsTgC0fWqBFD6s2HA';

const ig = require('./ig.js');

var loggedInUser = null;
client.on('ready', async () => {
    console.log(`Discord de ${client.user.tag} Iniciado`);
    loggedInUser = await ig.loginIg("pollofritocommunity", "colacaoincertidumbreboliviana55");
  });

client.on('messageCreate', async (message) => {
    if(message.channel.id == '914843299595059202') {
        if(message.attachments.size !== 0) {
            const MessageUrl = message.attachments.first().url;
            await ig.publishIg(MessageUrl, message.content);
            message.channel.send('Publicación creada correctamente');
        }
        else if (message.content.startsWith('https://')) {
            var desc = "";
            for (i = 1; i < message.content.split(' ').length; i++) {
                desc = desc + " " + message.content.split(' ')[i];
            }
            await ig.publishIg(message.content.split(' ')[0], desc);
            message.channel.send('Publicación creada correctamente, descripcion: ' + desc);
        }
    }
});

client.login(token);