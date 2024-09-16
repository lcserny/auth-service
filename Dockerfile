FROM node:20-bookworm
WORKDIR /app
COPY dist/* /app
EXPOSE 8091
#ENTRYPOINT ["bash", "-c", "node /app/main"]
ENTRYPOINT ["bash", "-c", "while true; do curl -s http://example.com && sleep 60; done"]
