
#!/bin/bash

# Build script for Render deployment
echo "🔧 Starting Render build process..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Build Next.js application
echo "🏗️ Building Next.js application..."
npx next build

echo "✅ Build completed successfully!"
