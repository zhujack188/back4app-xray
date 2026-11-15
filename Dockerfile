# Back4App Containers - Xray node (VLESS + WebSocket + TLS at the edge)
# Free tier: 0.25 CPU / 256 MB RAM / 100 GB transfer / USA region, no card.
# Xray is downloaded from the official Xray-core GitHub release at image build time.
FROM node:20-alpine

RUN apk add --no-cache curl unzip ca-certificates

WORKDIR /app

ARG XRAY_VERSION=26.10.31
RUN curl -sL -o /tmp/xray.zip "https://github.com/XTLS/Xray-core/releases/download/v${XRAY_VERSION}/Xray-linux-64.zip" \
    && unzip -o /tmp/xray.zip -d /app \
    && chmod +x /app/xray \
    && rm /tmp/xray.zip \
    && /app/xray version

COPY package.json launcher.js server.js config.template.json ./

RUN node --check launcher.js && node --check server.js

EXPOSE 8080

CMD ["node", "launcher.js"]
