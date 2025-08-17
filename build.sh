#!/bin/bash
set -e

echo "Building DealLens Web App..."

# Navigate to web app directory
cd apps/web

# Install dependencies
npm install

# Build the application
npm run build

echo "Build completed successfully!"
