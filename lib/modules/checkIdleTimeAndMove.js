'use strict';

var _moduleUtils = require('../util/moduleUtils');

var _moduleUtils2 = _interopRequireDefault(_moduleUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = (teamspeak, config) => {
    if (!config.moduleEnabled) {
        return;
    }

    (function checkIdleTimeAndMove() {
        teamspeak.send('clientlist', {
            '-times': true,
            '-groups': true
        }, (err, response) => {
            if (!response) {
                response = [];
            } else if (!Array.isArray(response)) {
                response = response.data;
            }

            for (let i in response) {
                var client = response[i];
                if (client.client_type === 0) {
                    var clientIdleTime = client.client_idle_time / 1000;

                    var clientServerGroupsArray = client.client_servergroups.toString().split(',').map(n => Number(n));

                    if (!_moduleUtils2.default.arrayHasIntersects(clientServerGroupsArray, config.ignoreServerGroupIds) && client.cid != config.destinationChannelId && clientIdleTime > config.maxIdleTimeInSeconds) {
                        var formattedIdleTextMessageBody = config.idleTextMessageBody.replace('${IDLE_TIME_IN_SECONDS}', config.maxIdleTimeInSeconds);
                        teamspeak.send('sendtextmessage', {
                            targetmode: 1,
                            target: client.clid,
                            msg: formattedIdleTextMessageBody
                        });

                        teamspeak.send('clientmove', {
                            clid: client.clid,
                            cid: config.destinationChannelId
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