# 開発環境用Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# OpenSSLをインストール（Prisma用）
RUN apk add --no-cache openssl

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

EXPOSE 3000 5555

# デフォルトコマンド（docker-compose.ymlでオーバーライドされる）
CMD ["npm", "run", "dev"]
