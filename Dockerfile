# 開発環境用Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# OpenSSLをインストール（Prisma用）
RUN apk add --no-cache openssl

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# 起動スクリプトをコピー
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000 5555

CMD ["./start.sh"]
