const https = require('https');
const xml2js = require('xml2js');
const fs = require('fs').promises;

const settingUp = () => new Promise (async (resolve, reject) => {
    try {
        var setup = await fs.readFile('./assets/setup.json');

        resolve({
            status: "success",
            message: "[#] Configuration Loaded"
        })
    } catch (err) {
        /**
         * rss_url [{
         * name: rss name
         * url: rss url
         * last_feed: [] array last grabbed data
         * }] array
         * 
         */

        var data = {
            rss_channel: "",
            rss_url: []
        }

        var setup = await fs.writeFile('./assets/setup.json', JSON.stringify(data, null, 2), 'utf8');
        
        resolve({
            status: "success",
            message: "[#] Setting Up Data"
        })
    }
});

const generateURL = (text) => new Promise (async (resolve, reject) => {
    try {
        // search query
        var array = text.split("!filter:");
        var query = array[0].replace("!job ", "");
        query = query.toString().trim();

        //filters
        var experience, type, proposal, previous, hires, payment

        if (array[1]) {
            var filters = array[1].split('&');
            
            // experience level
            experience = filters.filter(item => item.toLowerCase().indexOf('experience level') > -1);
            if (experience.length > 0) {
                experience = experience[0].toLowerCase();

                if (experience.includes('entry')) {
                    experience = "&contractor_tier=1"
                } else if (experience.includes('intermediate')) {
                    experience = "&contractor_tier=2"
                } else if (experience.includes('expert')) {
                    experience = "&contractor_tier=3"
                }

            } else {
                experience = ""
            }

            // job type : fixed / hourly
            type = filters.filter(item => item.toLowerCase().indexOf('type') > -1);
            if (type.length > 0) {
                type = type[0].toLowerCase();

                if (type.includes('hourly')) {
                    type = "&t=0"
                } else if (type.includes('fixed')) {
                    type = "&t=1"
                }

            } else {
                type = ""
            }

            // proposal 
            proposal = filters.filter(item => item.toLowerCase().indexOf('proposals') > -1);
            if (proposal.length > 0) {
                proposal = proposal[0].toLowerCase();

                if (proposal.includes('5')) {
                    proposal = "&proposals=0-4"
                } else if (proposal.includes('10')) {
                    proposal = "&proposals=5-9"
                } else if (proposal.includes('15')) {
                    proposal = "&proposals=10-14"
                } else if (proposal.includes('20')) {
                    proposal = "&proposals=15-19"
                } else if (proposal.includes('50')) {
                    proposal = "&proposals=20-49"
                }

            } else {
                proposal = ""
            }

            // previous clients
            previous = filters.filter(item => item.toLowerCase().indexOf('previous client') > -1);
            if (previous.length > 0) {
                previous = "&previous_clients=all"
            } else {
                previous = ""
            }

            // hires
            hires = filters.filter(item => item.toLowerCase().indexOf('hires') > -1);
            if (hires.length > 0) {
                hires = hires[0].toLowerCase();

                if (hires.includes('no hires')) {
                    hires = "&client_hires=0"
                } else if (hires.includes('9')) {
                    hires = "&client_hires=1-9"
                } else if (hires.includes('10')) {
                    hires = "&client_hires=10-"
                }

            } else {
                hires = ""
            }

            // payment
            payment = filters.filter(item => item.toLowerCase().indexOf('payment verified') > -1);
            if (payment.length > 0) {
                payment = "&payment_verified=1"

            } else {
                payment = ""
            }
        }

        // merge filters
        var pathTo, url, rss, cred;
        pathTo = "https://www.upwork.com/search/jobs/url?q=";
        url = pathTo + query + "&sort=recency";
        if (array[1]) {
            url = url + type + experience + hires + proposal + previous + payment;
        }

        pathTo = "https://www.upwork.com/ab/feed/jobs/rss?q=";
        cred = "&paging=0%3B20&api_params=1&securityToken=d3be0a318e8be17e5d3634085f447146882ecb123bb15731085cec48fb1fe38d436ef74454fabeb1e753426459580e7e471d87e2d140a32ba1e659ae7b5bfe71&userUid=1678435651088986112&orgUid=1678435651088986113"
        rss = pathTo + query + "&sort=recency";
        if (array[1]) {
            rss = rss + type + experience + hires + proposal + previous + payment + cred;
        }

        resolve({
            status: "success",
            url: url,
            rss: rss
        })
    } catch (err) {
        resolve({
            status: "error",
            url: null,
            rss: null
        })
    } 
});

const generateXML = (url) => {
    return new Promise((resolve) => {
        try {
            let data = ''
            https.get(url, res => {
                res.on('data', chunk => { data += chunk }) 
                res.on('end', () => {
                    resolve({
                        status: "success",
                        data: data
                    });
                });
            });
        } catch (err) {
            resolve({
                status: "error",
                data: null
            })
        }
    });
};

const convertXMLtoJSON = (text) => new Promise (async (resolve, reject) => {
    var parser = new xml2js.Parser();
    try {
        var result = await new Promise((res, rej) => parser.parseString(text, (err, result) => {
            if (err) res("error");
            else res(result.rss.channel[0].item);
        }))

        if (result == "error") {
            throw "Error processing RSS"
        }

        resolve({
            status: "success",
            message: "",
            data: result
        });
    } catch (err) {
        resolve({
            status: "error",
            message: err,
            data: []
        });
    }
});

const channelNotifications = (rss, discord) => new Promise (async (resolve, reject) => {
    try {
        for (var i = 0; i < rss.rss_url.length; i++) {
            var xml = await generateXML(rss.rss_url[i].url);
            if (xml.status == "success") {

                var converted = await convertXMLtoJSON(xml.data);
                if (converted.status == "success") {

                    var data = converted.data;

                    if (rss.rss_url[i].last_feed.length == 0) {
                        for (var j = 0; j < data.length; j++) {

                            rss.rss_url[i].last_feed.push({
                                title: data[j].title[0],
                                link: data[j].link[0],
                                description: data[j].description[0].toString().replace(/<(?:[^<>]*?\salt="([^"]*)")?[^<>]*>/g, '$1').replace('\n', ' ').substring(0, 100)
                            });

                            var embedJobs = {
                                color: 0x0099ff,
                                title: rss.rss_url[i].name,
                                fields: [
                                    {
                                        name: data[j].title[0],
                                        value: data[j].description[0].toString().replace(/<(?:[^<>]*?\salt="([^"]*)")?[^<>]*>/g, '$1').replace('\n', ' ').substring(0, 100) + ` - ${ data[j].link[0] }`
                                    }
                                ],
                                timestamp: new Date().toISOString(),
                                footer: {
                                    text: 'Upwork Bot',
                                    icon_url: 'https://yt3.googleusercontent.com/Rt0a-mNaBF7D9fzrf0sHhbJr0PZT0nftaII_lWzWJ1Oqnj20ovwsKEMmlQfq-H1pm8kgFBwDDag=s900-c-k-c0x00ffffff-no-rj',
                                },
                            }

                            var channel = discord.channels.cache.get(rss.rss_channel);
                            channel.send({ embeds: [embedJobs] });
                        }
                    } else {
                        var check = false;
                        var records = [];
                        data.forEach((element) => {
                            var finder = rss.rss_url[i].last_feed.find(o => o.link === element.link[0]);
                            if (finder == null) {
                                check = true;

                                var embedJobs = {
                                    color: 0x0099ff,
                                    title: rss.rss_url[i].name,
                                    fields: [
                                        {
                                            name: element.title[0],
                                            value: element.description[0].toString().replace(/<(?:[^<>]*?\salt="([^"]*)")?[^<>]*>/g, '$1').replace('\n', ' ').substring(0, 100) + ` - ${ element.link[0] }`
                                        }
                                    ],
                                    timestamp: new Date().toISOString(),
                                    footer: {
                                        text: 'Upwork Bot',
                                        icon_url: 'https://yt3.googleusercontent.com/Rt0a-mNaBF7D9fzrf0sHhbJr0PZT0nftaII_lWzWJ1Oqnj20ovwsKEMmlQfq-H1pm8kgFBwDDag=s900-c-k-c0x00ffffff-no-rj',
                                    },
                                }
    
                                var channel = discord.channels.cache.get(rss.rss_channel);
                                channel.send({ embeds: [embedJobs] });
                            }

                            records.push({
                                title: element.title[0],
                                description: element.description[0],
                                link: element.link[0]
                            })
                        });

                        if (check == true) {
                            rss.rss_url[i].last_feed = records;
                        }
                    }
                }
            }
        }

        await fs.writeFile('./assets/setup.json', JSON.stringify(rss, null, 2), 'utf8');

        resolve('[#] Generating New Jobs Success')
    } catch (err) {
        resolve('[!] Generating New Jobs Error')
    }
});

module.exports = {
    generateURL,
    generateXML,
    convertXMLtoJSON,
    settingUp,
    channelNotifications
}

// (async () => {
//     var hehe = await generateXML('https://www.upwork.com/ab/feed/jobs/rss?q=data+scraping&proposals=0-4&verified_payment_only=1&sort=recency&paging=0%3B10&api_params=1&securityToken=d3be0a318e8be17e5d3634085f447146882ecb123bb15731085cec48fb1fe38d436ef74454fabeb1e753426459580e7e471d87e2d140a32ba1e659ae7b5bfe71&userUid=1678435651088986112&orgUid=1678435651088986113');
//     hehe = await convertXMLtoJSON(hehe.data);
//     console.log(hehe)
// })();