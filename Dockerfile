FROM node:17

WORKDIR /srv

COPY ./package.json .
COPY ./index.js .
COPY entrypoint.sh .

RUN apt-get update && apt-get install -y net-tools iproute2 ca-certificates wget gnupg --no-install-recommends &&\
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list &&\
    apt-get update &&\
    apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf --no-install-recommends &&\
    rm -rf /var/lib/apt/lists/* /var/cache/apt/* &&\
    npm install pm2 -g &&\
    npm install &&\
    chmod +x entrypoint.sh 

CMD ["./entrypoint.sh"]

EXPOSE $PORT