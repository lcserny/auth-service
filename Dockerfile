FROM node:20-bookworm
WORKDIR /app
COPY . /app
EXPOSE 8091
ENTRYPOINT ["sh", "-c", "node /app/dist/main"]
