FROM node:20-slim

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Buat folder tokens bersih setiap build
RUN mkdir -p /app/tokens

COPY package*.json ./
RUN npm install

COPY . .

# Hapus token lama saat container start
RUN rm -rf /app/tokens/*

CMD ["node", "bot.js"]
