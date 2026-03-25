#!/bin/bash
set -e

echo "==> Current directory: $(pwd)"
echo "==> Listing files:"
ls -la

# COMPLETE CLEAN BUILD - remove all caches
echo "==> Cleaning all caches..."
rm -rf FrontEnd/node_modules
rm -rf FrontEnd/.vite
rm -rf FrontEnd/dist
rm -f FrontEnd/.env

# Create fresh .env with empty API URL
echo "==> Creating fresh .env..."
echo "VITE_API_URL=" > FrontEnd/.env
cat FrontEnd/.env

echo "==> Installing FrontEnd dependencies..."
cd FrontEnd
npm install

echo "==> Building FrontEnd..."
npm run build

echo "==> Listing dist contents:"
ls -la dist/

echo "==> Copying dist to BackEnd/public..."
rm -rf ../BackEnd/public
cp -r dist ../BackEnd/public

echo "==> Verifying copy:"
ls -la ../BackEnd/public/

echo "==> Installing BackEnd dependencies..."
cd ../BackEnd
npm install

echo "==> Build complete!"
echo "==> Public folder contents:"
ls -la public/
