FROM node:20-bookworm
WORKDIR /app
#COPY dist /app/dist
#COPY package.json /app
COPY . .
RUN npm install
EXPOSE 8091
#ENTRYPOINT ["bash", "-c", "node /app/dist/main"]
ENTRYPOINT ["bash", "-c", "while true; do curl -s http://example.com && sleep 60; done"]
