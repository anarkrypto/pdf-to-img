FROM alpine:3.18.0

WORKDIR /app

RUN apk add --update curl npm

COPY ./src ./src
COPY tsconfig.json package.json package-lock.json ./

RUN echo S3_BUCKET_NAME="$S3_BUCKET_NAME" > .env
RUN echo S3_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID" >> .env
RUN echo S3_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY" >> .env
RUN echo RABBITMQ_URL="$RABBITMQ_URL" >> .env

RUN npm ci

EXPOSE 3000

CMD ["npm", "start"]