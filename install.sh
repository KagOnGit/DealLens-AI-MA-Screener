#!/bin/bash
set -e

echo "Installing dependencies for DealLens Web App..."

# Install root dependencies first
npm install

# Install web app dependencies
cd apps/web
npm install

echo "Dependencies installed successfully!"
