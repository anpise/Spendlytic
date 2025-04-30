# Use official Node.js LTS image
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Accept build argument for backend URL
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"] 