#!/bin/bash

# Cloudflare Deployment Script for FPL Manager
# This script helps deploy your application to Cloudflare

echo "🚀 Starting Cloudflare deployment for FPL Manager..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please login first:"
    echo "wrangler login"
    exit 1
fi

echo "✅ Wrangler CLI found and user is logged in"

# Build the client
echo "📦 Building client application..."
npm run build:client

if [ $? -ne 0 ]; then
    echo "❌ Client build failed"
    exit 1
fi

echo "✅ Client build completed"

# Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."
wrangler pages deploy dist/public --project-name=fpl-manager

if [ $? -ne 0 ]; then
    echo "❌ Pages deployment failed"
    exit 1
fi

echo "✅ Pages deployment completed"

# Deploy the Worker
echo "⚡ Deploying Cloudflare Worker..."
wrangler deploy

if [ $? -ne 0 ]; then
    echo "❌ Worker deployment failed"
    exit 1
fi

echo "✅ Worker deployment completed"

echo "🎉 Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Set up your custom domain: fpl.clementadegbenro.com"
echo "2. Configure environment variables in Cloudflare Pages"
echo "3. Set up secrets in Cloudflare Workers"
echo "4. Update Firebase project to allow your custom domain"
echo ""
echo "Your application should be available at your custom domain once DNS is configured."
