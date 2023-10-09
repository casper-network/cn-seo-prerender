//----------------------------------
//  Imports
//----------------------------------
import * as http from 'http';
import * as net from 'net';
import puppeteer from 'puppeteer';

//----------------------------------
//  Variables
//----------------------------------
const ACCEPTED_EXTENSIONS = ['html', 'htm'];
const SERVER_HOST = process.env.HOST || null;
const SERVER_PORT = process.env.PORT || 3000;
const LOG_LEVEL = process.env.LOG || 'error';

const LOGGER = {
  time: () => new Date().toISOString(),
  error: (msg) => {
    console.log(`${LOGGER.time()} - ERROR - ${msg}`);
  },
  info: (msg) => {
    console.log(`${LOGGER.time()} - INFO  - ${msg}`);
  },
  log: (msg) => {
    if (LOG_LEVEL === 'verbose') {
      console.log(`${LOGGER.time()} - LOG   - ${msg}`);
    }
  },
};

//---------------------------------------------------
//
//  Pupppeteer Render Service
//
//---------------------------------------------------
class RenderService {
  
  //---------------------------------------------------
  //
  // Initialization
  //
  //---------------------------------------------------
  constructor() {
    this.server = null;
    this.browser = null;
    this.createBrowser().then((browser) => {
      if (browser) {
        this.browser = browser;
        this.server = this.createServer();
      } else {
        process.exit(1);
      }
    });
  }

  //---------------------------------------------------
  //
  // Server Methods
  //
  //---------------------------------------------------
  createServer() {
    const server = http.createServer();
    server.on('request', this.handleServerRequest.bind(this));
    server.listen(SERVER_PORT, SERVER_HOST, () => {
      LOGGER.info(`Service is running on port: ${SERVER_PORT}`);
    });
    return server;
  }

  handleServerRequest(request, response) {
    const { url, origin } = this.parseRequestUrls(request);
    if (this.ignoreRequest(url) || url === '') {
      this.redirect(url, origin, response);
    } else {
      this.retrieveSite(url, response);
    }
  }

  redirect(url, origin, response) {
    if (origin) {
      const newLocation = `${origin}/${url}`;
      LOGGER.log(`Redirecting to: ${newLocation}`);
      this.sendHttpStatus(301, { 'Location': newLocation }, response);
    } else {
      LOGGER.log(`Ignoring request for: "${url}"`);
      this.sendHttpStatus(400, null, response);
    }
  }

  sendHtmlResponse(html, response) {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
    response.end(html);
  }

  sendHttpStatus(status, headers, response) {
    response.writeHead(status, headers);
    response.end();
  }

  //---------------------------------------------------
  //
  // Puppeteer Methods
  //
  //---------------------------------------------------
  async createBrowser() {
    let browser = null;
    LOGGER.info('Launching Chrome...');
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--blink-settings=imagesEnabled=false',
          '--disable-setuid-sandbox'
        ],
        ignoreDefaultArgs: ["--disable-extensions"], // Optional
        executablePath: "/usr/bin/google-chrome",
      });

      const version = await browser.version();
      LOGGER.info(`${version} started..`);
    } catch (err) {
      LOGGER.error(err.message);
    }
    return browser;
  }

  async retrieveSite(url, response) {
    let page = null;
    try {
      const browser = this.browser;
      page = await browser.newPage();
      
      await page.setCacheEnabled(false);
      await page.setJavaScriptEnabled(true);
      await page.goto(url, { timeout: 20000, waitUntil: 'networkidle0' });
      
      const html = await page.content();
      
      await page.close();
      
      LOGGER.log(`Sending HTML for: ${url}`);
      this.sendHtmlResponse(html, response);
    } catch (err) {
      LOGGER.error(`Couldn't retrieve "${url}": ${err.message}`);
      if (page) {
        await page.close();
        page = null;
      }
      this.sendHttpStatus(500, null, response);
    }
  }
    
  //----------------------------------
  //  Helpers
  //----------------------------------
  parseRequestUrls(request) {
    const url = (request.url || '').replace(/^\//,'');
    const referer = request.headers.referer;
    try {
      if (referer) {
        const refUrl = new URL(referer.replace(/^.*\/http/, 'http').replace(/\/$/, ''));
        if (!net.isIP(refUrl.hostname) && refUrl.port !== SERVER_PORT) {
          return { url, origin: refUrl.origin }
        }
      }
    } catch (err) {
      LOGGER.error(`Unable to retrieve origin from referer "${referer}": ${err.message}`);
    }
    return { url };
  }
  
  ignoreRequest(url = '') {
    const segment = (url.split('/') || []).pop();
    if (segment.indexOf('.') !== -1) {
        const ext = (segment.split('.') || []).pop();
        return !ACCEPTED_EXTENSIONS.includes(ext);
    }
    return false;
  }
}

await new RenderService();