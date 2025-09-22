FROM node:20-alpine

WORKDIR /app

# Set environment variable to use WASM fallback for Lightning CSS
ENV LIGHTNINGCSS_USE_WASM=true

COPY package*.json ./
RUN npm ci 

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]