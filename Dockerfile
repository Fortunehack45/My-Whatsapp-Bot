FROM node:20-bullseye-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y python3 ffmpeg curl gzip && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose healthcheck port
EXPOSE 8080

# Command to run bot
CMD ["npm", "start"]
