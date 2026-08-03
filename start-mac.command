#!/bin/bash
# EdgeAI — dubbelklicka för att bygga dagens data och öppna verktyget.
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
node build-data.js
( sleep 2 ; open http://localhost:3000 ) &
node server.js
