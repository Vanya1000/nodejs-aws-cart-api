FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM alpine AS production

RUN apk add --update nodejs

WORKDIR /app

COPY --from=builder /app/dist ./dist

ENV PORT=8080

EXPOSE 8080

CMD [ "node", "./dist/main" ]