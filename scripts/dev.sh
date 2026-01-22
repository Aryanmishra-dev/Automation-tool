#!/bin/bash

echo "🚀 Starting development servers..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Run ./scripts/setup.sh first"
    exit 1
fi

# Start development servers using turbo
pnpm dev
