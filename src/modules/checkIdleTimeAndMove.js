import ModuleUtils from '../util/moduleUtils';

module.exports = (teamspeak, config) => {
    if (!config.moduleEnabled) {
        return;
    }

    (function checkIdleTimeAndMove() {
        teamspeak.send('clientlist', {
            '-times': true,
            '-groups': true,
        }, (err, response) => {
            if (!response) {
                response = [];
            } else if (!Array.isArray(response)) {
                response = response.data;
            }

            for (let i in response) {
                const client = response[i];
                if (client.client_type === 0) {
                    const clientIdleTime = client.client_idle_time / 1000;

                    const clientServerGroupsArray = client.client_servergroups
                        .toString().split(',').map(n => Number(n));

                    if (
                        (!ModuleUtils.arrayHasIntersects(clientServerGroupsArray,
                            config.ignoreServerGroupIds)) &&
                        (client.cid != config.destinationChannelId) &&
                        (clientIdleTime > config.maxIdleTimeInSeconds)
                    ) {
                        const formattedIdleTextMessageBody = config.idleTextMessageBody.replace(
                            '${IDLE_TIME_IN_SECONDS}', config.maxIdleTimeInSeconds
                        );

                        (config.messageMode === 'textmessage') ?
                        teamspeak.send('sendtextmessage', {
                            targetmode: 1,
                            target: client.clid,
                            msg: formattedIdleTextMessageBody,
                        }) : teamspeak.send('clientpoke', {
                            clid: client.clid,
                            msg: formattedIdleTextMessageBody,
                        });

                        teamspeak.send('clientmove', {
                            clid: client.clid,
                            cid: config.destinationChannelId,
                        });
                    }
                }
            }

            setTimeout(() => {
                checkIdleTimeAndMove();
            }, 10000);
        });
    })();
};
