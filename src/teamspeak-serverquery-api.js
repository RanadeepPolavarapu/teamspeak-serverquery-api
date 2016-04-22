import net from 'net';
import events from 'events';
import util from 'util';
import LineInputStream from 'line-input-stream';

import {
    TS_SERVERQUERY_COMMANDS as TS3_SQ_COMMANDS
} from './commands';

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
        self.api = {};

        self._initCmds();

        self.connect();

        return self;
    }

    tsEscapeString(s) {
        var r = String(s);
        r = r.replace(/\\/g, '\\\\'); // Backslash
        r = r.replace(/\//g, '\\/'); // Slash
        r = r.replace(/\|/g, '\\p'); // Pipe
        r = r.replace(/\n/g, '\\n'); // Newline
        r = r.replace(/\r/g, '\\r'); // Carriage Return
        r = r.replace(/\t/g, '\\t'); // Horizontal Tab
        r = r.replace(/\v/g, '\\v'); // Vertical Tab
        r = r.replace(/\f/g, '\\f'); // Formfeed
        r = r.replace(/ /g, '\\s'); // Whitespace
        return r;
    }

    tsUnescapeString(s) {
        var r = String(s);
        r = r.replace(/\\s/g, ' '); // Whitespace
        r = r.replace(/\\p/g, '|'); // Pipe
        r = r.replace(/\\n/g, '\n'); // Newline
        r = r.replace(/\\f/g, '\f'); // Formfeed
        r = r.replace(/\\r/g, '\r'); // Carriage Return
        r = r.replace(/\\t/g, '\t'); // Horizontal Tab
        r = r.replace(/\\v/g, '\v'); // Vertical Tab
        r = r.replace(/\\\//g, '\/'); // Slash
        r = r.replace(/\\\\/g, '\\'); // Backslash
        return r;
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

    disconnect() {
        var self = this;

        self.socket.end();

        return self;
    }

    subscribe() {
        var self = this;
        var args = Array.prototype.slice.call(arguments);

        return self.api.servernotifyregister.apply(self, args);
    }

    unsubscribe() {
        var self = this;
        var args = Array.prototype.slice.call(arguments);

        return self.api.servernotifyunregister.apply(self, args);
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

        var toSend = self.tsEscapeString(cmd);

        options.forEach(opt => {
            toSend += ' -' + self.tsEscapeString(opt);
        });

        for (var key in params) {
            var value = params[key];

            if (util.isArray(value)) {
                for (var i in value) {
                    value[i] = self.tsEscapeString(key.toString()) + '=' +
                        self.tsEscapeString(value.toString());
                }

                toSend += ' ' + value.join('|');
            } else {
                toSend += ' ' + self.tsEscapeString(key.toString()) + '=' +
                    self.tsEscapeString(value.toString());
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
            self.socket.write(self.executing.text + '\n');
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

    _initCmds() {
        var self = this;

        TS3_SQ_COMMANDS.forEach(cmd => {
            self.api[cmd] = (() => {
                var args = Array.prototype.slice.call(arguments);

                args.unshift(cmd);

                return self.send.apply(self, args);
            });
        });

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

    parseResp(str) {
        var self = this;
        var resp = [];
        var records = str.split('|');

        resp = records.map(k => {
            var args = k.split(' ');
            var obj = {};

            args.forEach(v => {
                if (v.indexOf('=') > -1) {
                    var key = self.tsUnescapeString(v.substr(0, v.indexOf('=')));
                    var value = self.tsUnescapeString(v.substr(v.indexOf('=') + 1));

                    if (parseInt(value, 10) == value) {
                        value = parseInt(value, 10);
                    }

                    obj[key] = value;

                } else {
                    obj[v] = '';
                }
            });

            return obj;
        });

        if (resp.length === 0) {
            resp = null;
        } else if (resp.length === 1) {
            resp = resp.shift();
        }

        return resp;
    }

    _onData(dataStr) {
        var self = this;

        if (dataStr.indexOf('error') === 0) {
            var resp = self.parseResp(dataStr.substr(6).trim());

            if (resp.id === 0) {
                self.executing.error = null;
                if (!self.executing.resp) {
                    self.executing.resp = {
                        status: 'ok',
                        raw: dataStr,
                    };
                }
            } else {
                self.executing.error = {
                    status: 'error',
                    message: resp.msg,
                    error_id: resp.id,
                };
            }

            var req = {
                cmd: self.executing.cmd,
                options: self.executing.options,
                params: self.executing.parameters,
                raw: self.executing.text,
            };

            if (typeof self.executing.cb == 'function') {
                self.executing.cb.call(
                    self.executing,
                    self.executing.error,
                    self.executing.resp,
                    req
                );
            } else {
                self.emit(
                    self.executing.cmd,
                    self.executing.error,
                    self.executing.resp,
                    req
                );
            }

            self.executing = null;
            self.advanceQueue();
        } else if (dataStr.indexOf('notify') === 0) {
            dataStr = dataStr.substr(6);

            var eventName = dataStr.substr(0, dataStr.indexOf(' '));
            var notifyResp = self.parseResp(dataStr.substr(eventName.length + 1));

            var formattedNotifyResp = {
                status: 'ok',
                data: notifyResp,
                raw: dataStr,
            };

            self.emit('notify', eventName, formattedNotifyResp);

            self.emit('notify.' + eventName, eventName, formattedNotifyResp);
        } else if (self.executing) {
            self.executing.resp = {
                status: 'ok',
                data: self.parseResp(dataStr),
                raw: dataStr,
            };
        }

        return self;
    }
}

util.inherits(TeamSpeakSQClient, events.EventEmitter);
