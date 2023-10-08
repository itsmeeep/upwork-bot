const commands = require('./src/commands')
const modules = require('./src/modules')

const cron = require('node-cron')
const fs = require('fs').promises;
const dotenv = require('dotenv')
dotenv.config();

const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const discord = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ]
});

discord.once(Events.ClientReady, async (dc) => {
    var setup = await modules.settingUp();
    console.log(setup.message)

	console.log(`[#] Upwork Bot Ready! ${ dc.user.tag }`);
});

discord.on('messageCreate', async (message) => {
    var result = commands.execute(message, discord);
});

cron.schedule('* * * * *', async () => {
    var data = await fs.readFile('./assets/setup.json');
    data = JSON.parse(data);

    if (data.rss_channel != "") {
        var today = new Date().toLocaleString('id-ID');
        var result = await modules.channelNotifications(data, discord);
        
        console.log(`${ result } - ${ today }`)
    }
});

// Log in to Discord with your client's token
discord.login(process.env.DISCORD_TOKEN);