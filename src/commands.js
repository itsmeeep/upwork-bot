const modules = require('./modules');
const fs = require('fs').promises
const { EmbedBuilder, hyperlink, hideLinkEmbed } = require('discord.js');

const helperEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setAuthor({ name: 'Upwork Bot', iconURL: 'https://yt3.googleusercontent.com/Rt0a-mNaBF7D9fzrf0sHhbJr0PZT0nftaII_lWzWJ1Oqnj20ovwsKEMmlQfq-H1pm8kgFBwDDag=s900-c-k-c0x00ffffff-no-rj' })
    .setDescription('There are severals rules to generate upwork jobs data, to generate it properly you should put the keyword as designed to get desired results \n')
    .addFields({ name: 'Basic Search', value: `To do basic searching, you can use \n'!job <**your keyword**>'\n to find jobs with your search keywords \n Note: type your keywords without <> sign \n as example: \n **!job database** \n\n`})
    .addFields({ name: 'Advance Search', value: `To put filters on your query, you can use scripts below \n'!job <**your keyword**> !filter:<**filter**>&<**filter**>'\nyou can add multiple filters on your search query to get specific result`})
    .addFields({ name: 'Experience Level', value: `'&experience level=[entry level/intermediate/expert]'` })
    .addFields({ name: 'Type', value: `'&type=[hourly/fixed]'` })
    .addFields({ name: 'Proposal Applied on Job', value: `'&proposals=[5/10/15/20/50]'` })
    .addFields({ name: 'Previous Client', value: `'&previous_client'` })
    .addFields({ name: 'Total Hires', value: `'&hires=[no hires/9/10]'` })
    .addFields({ name: 'Payment Verified', value: `'&payment_verified' \n\n` })
    .addFields({ name: ' ', value: `the full script should be like this: \n` })
    .addFields({ name: ' ', value: `!job node.js !filter:experience level=entry level&type=fixed&proposal=5&payment verified&hires=no hires \n` })
    .addFields({ name: ' ', value: `Note: the filters are optional, so you can put no filter or any filter you need. [/] mean that you can choose one of the value inside the brackets` })
    .addFields({ name: 'RSS', value: `To see saved RSS URL lists, you can use\n'!rss'\n\nTo turn on RSS service you can use script below\n'!setup rss'\n\nTo add new RSS, use\n'!setup rss add [rss name without space] [rss url]'\n\nTo turn off the RSS service, use\n'!setup rss stop'\n\nNote:\nyou need to type the command on the channel that you want to be the RSS channel update, so the RSS update will be sent on the channel where you type the command` })
    .setTimestamp()
    .setFooter({ text: 'Upwork Bot', iconURL: 'https://yt3.googleusercontent.com/Rt0a-mNaBF7D9fzrf0sHhbJr0PZT0nftaII_lWzWJ1Oqnj20ovwsKEMmlQfq-H1pm8kgFBwDDag=s900-c-k-c0x00ffffff-no-rj' });

const execute = (message, discord) => new Promise (async (resolve, reject) => {
    try {
        var command = message.content;
        command = command.toString().split(' ');
        if (command.length > 0) {
            switch(command[0]) {
                case '!rss':
                    if (command[1]) {
                        switch(command[1]) {
                            case 'start':
                                var data = await fs.readFile('./assets/setup.json');
                                data = JSON.parse(data)

                                data.rss_channel = message.channelId;
                                await fs.writeFile('./assets/setup.json', JSON.stringify(data, null, 2), 'utf8');

                                message.reply({content: "RSS Channel Setup Successful!! \n\n Note:\nif you want to turn of the RSS update, you can type '!setup rss stop'"});
                                break;
                            case 'stop':
                                var data = await fs.readFile('./assets/setup.json');
                                data = JSON.parse(data)

                                data.rss_channel = ""
                                await fs.writeFile('./assets/setup.json', JSON.stringify(data, null, 2), 'utf8');

                                message.reply({ content: "RSS Channel Stopped!" });

                                break;
                            case 'add':
                                var data = await fs.readFile('./assets/setup.json');
                                data = JSON.parse(data)

                                data.rss_url.push({
                                    name: command[2],
                                    url: command[3],
                                    last_feed: []
                                });

                                await fs.writeFile('./assets/setup.json', JSON.stringify(data, null, 2), 'utf8');
                                message.reply({ content: "RSS URL successfully added" });

                                break;
                            case 'remove':
                                var data = await fs.readFile('./assets/setup.json');
                                data = JSON.parse(data);

                                data = data.rss_url.filter(function (element) {
                                    return element.name !== command[2];
                                });

                                await fs.writeFile('./assets/setup.json', JSON.stringify(data, null, 2), 'utf8');
                                message.reply({ content: "RSS URL successfully removed" });

                                break;
                            default:
                                null;
                        }
                    } else {
                        // RSS List
                        var data = await fs.readFile('./assets/setup.json');
                        data = JSON.parse(data);

                        var embedRSS = {
                            color: 0x0099ff,
                            title: 'RSS List',
                            description: `Here you may see saved RSS URL and the assigned channel as RSS update channel`,
                            fields: [],
                            timestamp: new Date().toISOString(),
                            footer: {
                                text: 'Upwork Bot',
                                icon_url: 'https://yt3.googleusercontent.com/Rt0a-mNaBF7D9fzrf0sHhbJr0PZT0nftaII_lWzWJ1Oqnj20ovwsKEMmlQfq-H1pm8kgFBwDDag=s900-c-k-c0x00ffffff-no-rj',
                            },
                        }

                        data.rss_url.forEach((element) => {
                            embedRSS.fields.push({
                                name: element.name,
                                value: element.url
                            })
                        });

                        message.reply({
                            embeds: [embedRSS]
                        })
                    }

                    break;
                case '!helper':
                    message.reply({ embeds: [helperEmbed] })

                    break;
                case '!job':
                    var pathTo = await modules.generateURL(message.content);
                    if (pathTo.status == "success") {
                        var xml = await modules.generateXML(pathTo.rss);
                        if (xml.status == "success") {
                            var rssJSON = await modules.convertXMLtoJSON(xml.data);
                            if (rssJSON.status == "success") {
                                var embedJobs = {
                                    color: 0x0099ff,
                                    title: 'Most Recent Jobs',
                                    description: `Here you may see the most recent jobs that posted based on your search query \n **URL**\n${pathTo.url} \n\n **RSS**\n${pathTo.rss} \n\n\n**Job List:**`,
                                    fields: [],
                                    timestamp: new Date().toISOString(),
                                    footer: {
                                        text: 'Upwork Bot',
                                        icon_url: 'https://yt3.googleusercontent.com/Rt0a-mNaBF7D9fzrf0sHhbJr0PZT0nftaII_lWzWJ1Oqnj20ovwsKEMmlQfq-H1pm8kgFBwDDag=s900-c-k-c0x00ffffff-no-rj',
                                    },
                                }

                                rssJSON.data.forEach((x) => {
                                    var desc = x.description[0].toString().replace(/<(?:[^<>]*?\salt="([^"]*)")?[^<>]*>/g, '$1').replace('\n', ' ').substring(0, 100);

                                    embedJobs.fields.push({
                                        name: x.title[0],
                                        value: desc + ` - ${ x.link[0] }`
                                    })
                                });

                                message.reply({ embeds: [embedJobs] })
                            }
                        }
                    }

                    break;
                default:
                    null;
            }
        }

        resolve('success')
    } catch (err) {
        resolve('error')
    }
});

module.exports = {
    execute
}