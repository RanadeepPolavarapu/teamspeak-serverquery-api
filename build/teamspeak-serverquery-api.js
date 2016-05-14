'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lineInputStream = require('line-input-stream');

var _lineInputStream2 = _interopRequireDefault(_lineInputStream);

var _commands = require('./commands');

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TS3_SQ_SERVER_HOST = process.env.TS3_SQ_SERVER_HOST || 'localhost';
var TS3_SQ_SERVER_PORT = process.env.TS3_SQ_SERVER_PORT || 10011;

var IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

var TeamSpeakSQClient = function () {
    function TeamSpeakSQClient(host, port) {
        _classCallCheck(this, TeamSpeakSQClient);

        _events2.default.EventEmitter.call(this);

        var self = this;
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

    _createClass(TeamSpeakSQClient, [{
        key: 'tsEscapeString',
        value: function tsEscapeString(s) {
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
    }, {
        key: 'tsUnescapeString',
        value: function tsUnescapeString(s) {
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
    }, {
        key: 'connect',
        value: function connect() {
            var self = this;

            self.socket = _net2.default.connect(self.port, self.host);

            self.socket.on('error', function (err) {
                self.emit('error', err);
            });

            self.socket.on('close', function () {
                self.emit('close', self.queue);
            });

            self.socket.on('end', function () {
                self.emit('end', self.queue);
            });

            self._onConnect();

            return self;
        }
    }, {
        key: 'disconnect',
        value: function disconnect() {
            var self = this;

            self.socket.end();

            return self;
        }
    }, {
        key: 'subscribe',
        value: function subscribe() {
            var self = this;
            var args = Array.prototype.slice.call(arguments);

            return self.api.servernotifyregister.apply(self, args);
        }
    }, {
        key: 'unsubscribe',
        value: function unsubscribe() {
            var self = this;
            var args = Array.prototype.slice.call(arguments);

            return self.api.servernotifyunregister.apply(self, args);
        }
    }, {
        key: 'send',
        value: function send() {
            var self = this;
            var args = Array.prototype.slice.call(arguments);
            var options = [];
            var params = {};
            var callback = undefined;
            var cmd = args.shift();

            args.forEach(function (argValue) {
                if (_util2.default.isArray(argValue)) {
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

            options.forEach(function (opt) {
                toSend += ' -' + self.tsEscapeString(opt);
            });

            for (var key in params) {
                var value = params[key];

                if (_util2.default.isArray(value)) {
                    for (var i in value) {
                        value[i] = self.tsEscapeString(key.toString()) + '=' + self.tsEscapeString(value.toString());
                    }

                    toSend += ' ' + value.join('|');
                } else {
                    toSend += ' ' + self.tsEscapeString(key.toString()) + '=' + self.tsEscapeString(value.toString());
                }
            }

            self.queue.push({
                cmd: cmd,
                options: options,
                parameters: params,
                text: toSend,
                cb: callback
            });

            if (self.status === 0) {
                self.advanceQueue();
            }

            return self;
        }
    }, {
        key: 'advanceQueue',
        value: function advanceQueue() {
            var self = this;

            if (!self.executing && self.queue.length >= 1) {
                self.executing = self.queue.shift();
                self.socket.write(self.executing.text + '\n');
            }

            return self;
        }
    }, {
        key: 'pending',
        value: function pending() {
            return this.queue.slice(0);
        }
    }, {
        key: 'clearPending',
        value: function clearPending() {
            var self = this;
            var queue = self.queue;

            self.queue = [];

            return queue;
        }
    }, {
        key: '_initCmds',
        value: function _initCmds() {
            var _arguments = arguments;

            var self = this;

            _commands.TS_SERVERQUERY_COMMANDS.forEach(function (cmd) {
                self.api[cmd] = function () {
                    var args = Array.prototype.slice.call(_arguments);

                    args.unshift(cmd);

                    return self.send.apply(self, args);
                };
            });

            return self;
        }
    }, {
        key: '_onConnect',
        value: function _onConnect() {
            var self = this;

            self.socket.on('connect', function () {
                self.reader = (0, _lineInputStream2.default)(self.socket);

                self.reader.on('line', function (data) {
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
    }, {
        key: 'parseResp',
        value: function parseResp(str) {
            var self = this;
            var resp = [];
            var records = str.split('|');

            resp = records.map(function (k) {
                var args = k.split(' ');
                var obj = {};

                args.forEach(function (v) {
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
    }, {
        key: '_onData',
        value: function _onData(dataStr) {
            var self = this;

            if (dataStr.indexOf('error') === 0) {
                var resp = self.parseResp(dataStr.substr(6).trim());

                if (resp.id === 0) {
                    self.executing.error = null;
                    if (!self.executing.resp) {
                        self.executing.resp = {
                            status: 'ok',
                            raw: dataStr
                        };
                    }
                } else {
                    self.executing.error = {
                        status: 'error',
                        message: resp.msg,
                        error_id: resp.id
                    };
                }

                var req = {
                    cmd: self.executing.cmd,
                    options: self.executing.options,
                    params: self.executing.parameters,
                    raw: self.executing.text
                };

                if (typeof self.executing.cb == 'function') {
                    self.executing.cb.call(self.executing, self.executing.error, self.executing.resp, req);
                } else {
                    self.emit(self.executing.cmd, self.executing.error, self.executing.resp, req);
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
                    raw: dataStr
                };

                self.emit('notify', eventName, formattedNotifyResp);

                self.emit('notify.' + eventName, eventName, formattedNotifyResp);
            } else if (self.executing) {
                self.executing.resp = {
                    status: 'ok',
                    data: self.parseResp(dataStr),
                    raw: dataStr
                };
            }

            return self;
        }
    }]);

    return TeamSpeakSQClient;
}();

exports.default = TeamSpeakSQClient;


_util2.default.inherits(TeamSpeakSQClient, _events2.default.EventEmitter);