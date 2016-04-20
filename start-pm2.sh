#!/usr/bin/env bash

echo -e "Starting TS3 Bot using ``pm2``"

pm2 start lib/main.js --name "TS3 SQ Bot" -i 1 --watch
