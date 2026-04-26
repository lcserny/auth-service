FROM docker.io/library/node:20-alpine
RUN apk add --no-cache bash
RUN mkdir -p /app && chown -R node:node /app
WORKDIR /app
COPY --chown=node:node dist /app/dist
COPY --chown=node:node package.json /app
USER node
RUN npm install
ENTRYPOINT ["bash", "-c", "node /app/dist/main"]
