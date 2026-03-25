#!/bin/bash

# Exit on error
set -e

echo "==> Installing FrontEnd dependencies..."
cd FrontEnd
npm install

echo "==> Building FrontEnd..."
npm run build

echo "==> Copying dist to BackEnd/public..."
cp -r dist ../BackEnd/public

echo "==> Installing BackEnd dependencies..."
cd ../BackEnd
npm install

echo "==> Build complete!"
