FROM node:20-bookworm
WORKDIR /app
COPY dist/* /app
EXPOSE 8091
ENTRYPOINT ["sh", "-c", "node /app/main"]
