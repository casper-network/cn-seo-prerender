FROM node:17

RUN apt-get update && apt-get install -y ca-certificates wget gnupg --no-install-recommends

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

COPY ./package.json /srv
COPY ./index.js /srv

WORKDIR /srv
RUN npm install pm2 -g
RUN npm install

CMD ["cd", /srv"]
CMD ["pm2-runtime", "index.js"]

EXPOSE 1234