#!/bin/sh
# google-chrome-stable --headless --disable-gpu --remote-debugging-port=9222 --hide-scrollbars --blink-settings=imagesEnabled=false --no-sandbox --disable-dev-shm-usage &
#block access to AWS metadata IP before starting server
ip route add blackhole 169.254.169.254
pm2-runtime index.js
