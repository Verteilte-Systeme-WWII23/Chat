# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app/

# Copy package.json and package-lock.json (if present) to the working directory
# This step is done separately to leverage Docker's layer caching.
# If only your application code changes, npm install won't be re-run.
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Define the command to run your application
CMD ["npm", "start"]