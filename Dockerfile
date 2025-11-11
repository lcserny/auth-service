FROM docker.io/library/node:20-alpine
WORKDIR /app
COPY dist /app/dist
COPY package.json /app
RUN apk add --no-cache bash && npm install
ENTRYPOINT ["bash", "-c", "node /app/dist/main"]
