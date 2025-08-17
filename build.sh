#!/bin/bash
set -e

echo "Building DealLens Web App..."

# Navigate to web app directory
cd apps/web

# Install dependencies (skip scripts to avoid conflicts)
npm install --ignore-scripts

# Build the application
npm run build

echo "Build completed successfully!"
