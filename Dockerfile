FROM node:20-bookworm
WORKDIR /app
COPY dist /app/dist
COPY package.json /app
RUN npm install
EXPOSE 8091
ENTRYPOINT ["sh", "-c", "node /app/dist/main"]
