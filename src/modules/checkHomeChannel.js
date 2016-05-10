module.exports = (teamspeak, config) => {
    var homeChannelTimes = {};
    var maxHomeChannelTimes = config.maxSeconds / 2;
    (function checkHomeChannel() {
        teamspeak.send('clientlist', {
            '-times': true,
            '-away': true,
        }, (err, response) => {
            if (!response) {
                response = [];
                console.log('hit');
            } else if (!Array.isArray(response)) {
                response = response.data;
            }

            var newHomeChannelTimes = {};
            for (let i in response) {
                var client = response[i];
                if (client.client_type === 0) {
                    if (client.cid === config.homeChannelId) {
                        var homeChannelTime = homeChannelTimes[client.client_database_id] ?
                            homeChannelTimes[client.client_database_id] + 1 : 1;
                        if (homeChannelTime > maxHomeChannelTimes) {
                            teamspeak.send('sendtextmessage', {
                                targetmode: 1,
                                target: client.clid,
                                msg: config.pokeMessage,
                            });
                            teamspeak.send('clientmove', {
                                clid: client.clid,
                                cid: config.destinationChannelId,
                            });
                        } else {
                            newHomeChannelTimes[client.client_database_id] = homeChannelTime;
                        }
                    }
                }
            }

            homeChannelTimes = newHomeChannelTimes;
            setTimeout(() => {
                checkHomeChannel();
            }, 2000);
        });
    })();
};
