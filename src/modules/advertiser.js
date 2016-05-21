import ModuleUtils from '../util/moduleUtils';

module.exports = (teamspeak, config) => {
    if (!config.moduleEnabled) {
        return;
    }

    (function advertiser() {
        teamspeak.send('sendtextmessage', {
            targetmode: config.targetMode,
            target: config.targetId,
            msg: config.message,
        }, (err, response) => {
            setTimeout(() => {
                advertiser();
            }, config.messageIntervalInSeconds * 1000);
        });
    })();
};
