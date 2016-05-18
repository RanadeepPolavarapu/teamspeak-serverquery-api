import ModuleUtils from '../util/moduleUtils';

module.exports = (teamspeak, config) => {
    if (!config.moduleEnabled) {
        return;
    }

    let homeChannelTimes = {};
    const maxHomeChannelTimes = config.maxSeconds / 2;
    (function checkHomeChannel() {
        teamspeak.send('clientlist', {
            '-away': true,
            '-times': true,
            '-groups': true,
        }, (err, response) => {
            if (!response) {
                response = [];
            } else if (!Array.isArray(response)) {
                response = response.data;
            }

            const newHomeChannelTimes = {};
            for (let i in response) {
                const client = response[i];
                if (client.client_type === 0) {

                    const clientServerGroupsArray = client.client_servergroups
                        .toString().split(',').map(n => Number(n));

                    if (
                        (!ModuleUtils.arrayHasIntersects(clientServerGroupsArray,
                            config.ignoreServerGroupIds)) &&
                        (client.cid === config.homeChannelId)
                    ) {
                        const homeChannelTime = homeChannelTimes[client.client_database_id] ?
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
