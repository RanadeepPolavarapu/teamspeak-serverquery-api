import net from 'net';
import events from 'events';
import util from 'util';
import LineInputStream from 'line-input-stream';

import TS_SERVERQUERY_COMMANDS from './commands';

const TS3_SQ_SERVER_HOST = process.env.TS3_SQ_SERVER_HOST || 'localhost';
const TS3_SQ_SERVER_PORT = process.env.TS3_SQ_SERVER_PORT || 10011;

const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

export default class TeamSpeakSQClient {
    constructor(host, port) {
        events.EventEmitter.call(this);

        const self = this;
        self.host = host || TS3_SQ_SERVER_HOST;
        self.port = port || TS3_SQ_SERVER_PORT;
        self.status = -2;
        self.socket = null;
        self.reader = null;
        self.queue = [];
        self.executing = null;

        self.initCmds();

        self.connect();

        return self;
    }

    connect() {
        var self = this;

        self.socket = net.connect(self.port, self.host);

        self.socket.on('error', err => {
            self.emit('error', err);
        });

        self.socket.on('close', () => {
            self.emit('close', self.queue);
        });

        self.socket.on('end', () => {
            self.emit('end', self.queue);
        });

        self._onConnect();

        return self;
    }

    _onConnect() {
        var self = this;

        self.socket.on('connect', () => {
            self.reader = LineInputStream(self.socket);

            self.reader.on('line', data => {
                var readerDataStr = data.trim();

                if (self.status < 0) {
                    self.status++;
                    if (self.status === 0) {
                        self.advanceQueue();
                    }

                    return;
                }

                self._onData(readerDataStr);
            });

            self.emit('connect');
        });

        return self;
    }

    disconnect() {
        var self = this;

        self.socket.end();

        return self;
    }

    subscribe() {
        var self = this;
        var args = Array.prototype.slice.call(arguments);

        return self.api.serverNotifyRegister.apply(self, args);
    }

    unsubscribe() {
        var self = this;
        var args = Array.prototype.slice.call(arguments);
        x = 4;

        return self.api.serverNotifyUnregister.apply(self, args);
    }

    send() {
        var self = this;
        var args = Array.prototype.slice.call(arguments);
        var options = [];
        var params = {};
        var callback = undefined;
        var cmd = args.shift();

        args.forEach(argValue => {
            if (util.isArray(argValue)) {
                options = argValue;
            } else if (typeof argValue === 'function') {
                callback = argValue;
            } else if (typeof argValue === 'string') {
                options.push(argValue);
            } else {
                params = argValue;
            }
        });

        var toSend = escape(cmd);

        options.forEach(opt => {
            toSend += ' -' + escape(opt);
        });

        for (var key in params) {
            var value = params[key];

            if (util.isArray(value)) {
                for (var i in value) {
                    value[i] = escape(key.toString()) + '=' + escape(value.toString());
                }

                toSend += ' ' + value.join('|');
            } else {
                toSend += ' ' + escape(key.toString()) + '=' + escape(value.toString());
            }
        }

        self.queue.push({
            cmd: cmd,
            options: options,
            parameters: params,
            text: toSend,
            cb: callback,
        });

        if (self.status === 0) {
            self.advanceQueue();
        }

        return self;
    }

    advanceQueue() {
        var self = this;

        if (!self.executing && self.queue.length >= 1) {
            self.executing = self.queue.shift();
            self.socket.write(self.executing.test + '\n');
        }

        return self;
    }

    pending() {
        return this.queue.slice(0);
    }

    clearPending() {
        var self = this;
        var queue = self.queue;

        self.queue = [];

        return queue;
    }
}

util.inherits(TeamSpeakSQClient, events.EventEmitter);
var TS = new TeamSpeakSQClient('localhost', 10011);
