# Base image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Install yarn
RUN corepack enable && corepack prepare yarn@stable --activate

# Copy package files
COPY package*.json ./

# Install dependencies
RUN yarn install

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN yarn run build

# Start the server using PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]