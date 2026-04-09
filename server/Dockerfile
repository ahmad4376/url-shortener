# Step 1: Use official Node.js image as base
FROM node:20-alpine

# Step 2: Set working directory inside container
WORKDIR /app

# Step 3: Copy package files first
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install --production

# Step 5: Copy rest of the code
COPY . .

# Step 6: Expose the port
EXPOSE 5000

# Step 7: Start the server
CMD ["node", "src/index.js"]