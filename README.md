# teamspeak-serverquery-api
A TeamSpeak 3 [ServerQuery](http://media.teamspeak.com/ts3_literature/TeamSpeak%203%20Server%20Query%20Manual.pdf) API and module based bot.

**VERSION**: [1.0.1](https://github.com/RanadeepPolavarapu/teamspeak-serverquery-api/releases/latest)

Versioning adheres to [Semantic Versioning](http://semver.org) standard. Tested and working under Node.js **v4+**.  

## Installation

This project will not be published to `npm`.

Get the project: `git clone https://github.com/RanadeepPolavarapu/teamspeak-serverquery-api/`  

Install [pm2](http://pm2.keymetrics.io/): `npm install pm2 -g`

Run `start-pm2.sh` script. The `pm2` monitor will watch for any file changes and auto restart the daemon, remove `--watch` flag if not needed. See releases to find the latest release. You can do a `git pull` from master branch if you wish to use active development versions.

## Modules

### Default Modules

| Module        | Description           | Source  | Config |
| ------------- |-------------|-----|-----|
| Check Home (Default) Channel      | Auto moves the user from the default channel after a specified *n* seconds. | [checkHomeChannel.js](/src/modules/checkHomeChannel.js) | [Config lines 8-15](/tsModuleBot.config.dist.json#L8-15) |
| Idle Time Checker      | Auto moves the user to a specified channel by *cid* after being idle for a specified *n* seconds.      |   [checkIdleTimeAndMove.js](/src/modules/checkIdleTimeAndMove.js) | [Config lines 16-22](/tsModuleBot.config.dist.json#L16-22) |

### Custom Modules

Custom modules can be written by simply writing a `.js` file in the [modules folder](/src/modules). The config specific to this module is added under the `modules` key in [config JSON file](/tsModuleBot.config.dist.json)

## License
The MIT License (MIT)

Copyright (c) 2016 RanadeepPolavarapu \<RanadeepPolavarapu@users.noreply.github.com\>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
