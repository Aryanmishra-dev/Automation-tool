#!/bin/bash

echo "🚀 Building and starting production servers..."

# Build all applications
echo "📦 Building applications..."
pnpm build

# Run database migrations
echo "🔧 Running database migrations..."
pnpm db:migrate

# Start production servers
echo "✅ Starting production servers..."
pnpm start
