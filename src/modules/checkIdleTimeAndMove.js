module.exports = (teamspeak, config) => {
    (function checkIdleTimeAndMove() {
        teamspeak.send('clientlist', {
            '-uid': true,
            '-away': true,
            '-voice': true,
            '-times': true,
            '-groups': true,
            '-info': true,
            '-icon': true,
            '-country': true,
        }, (err, response) => {

            if (!response) {
                response = [];
                console.log('hit');
            } else if (!Array.isArray(response)) {
                response = response.data;
            }

            for (let i in response) {
                var client = response[i];
                if (client.client_type === 0) {
                    var clientIdleTime = client.client_idle_time / 1000;
                    if (
                        (client.cid != config.destinationChannelId) &&
                        (clientIdleTime > config.maxIdleTimeInSeconds)
                    ) {
                        var formattedIdleTextMessageBody = config.idleTextMessageBody.replace(
                            '${IDLE_TIME_IN_SECONDS}', config.maxIdleTimeInSeconds
                        );
                        teamspeak.send('sendtextmessage', {
                            targetmode: 1,
                            target: client.clid,
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
