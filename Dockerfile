FROM alpine:3.18.0

WORKDIR /app

RUN apk add --update curl npm imagemagick

COPY ./src ./src
COPY tsconfig.json package.json package-lock.json .env ./

RUN npm ci

EXPOSE 3000

CMD ["npm", "start"]