const prerender = require('prerender');
const server = prerender({
    chromeLocation: '/usr/bin/google-chrome',
    chromeFlags: [
        '--headless',
        '--disable-gpu',
        '--remote-debugging-port=9222',
        '--hide-scrollbars',
        '--blink-settings=imagesEnabled=false',
        '--no-sandbox',
        '--disable-dev-shm-usage',
    ],
    waitAfterLastRequest: 500,
    port: process.env.PORT,
});
server.start();
