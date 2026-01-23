# 1. ビルドステージ
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# ソースコードをコピー
COPY . .

# Next.jsアプリをビルド
RUN npm run build

# 2. プロダクションステージ
FROM node:20-alpine

WORKDIR /usr/src/app

# ビルドステージからビルド済みファイルとnode_modulesをコピー
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
