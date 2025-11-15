#!/bin/bash

# Harthio Development Environment Setup Script
# This script helps you set up your local development environment

echo ""
echo "🚀 Harthio Development Environment Setup"
echo "========================================"
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Your existing .env.local was not modified."
        exit 0
    fi
fi

# Copy development template
echo "📋 Creating .env.local from development template..."
cp .env.development.template .env.local

if [ $? -eq 0 ]; then
    echo "✅ .env.local created successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Create a new Supabase project for development"
    echo "   2. Edit .env.local and add your development credentials:"
    echo "      - NEXT_PUBLIC_SUPABASE_URL"
    echo "      - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "      - SUPABASE_SERVICE_ROLE_KEY"
    echo "      - RESEND_API_KEY (optional for email testing)"
    echo "   3. Run 'npm run check:env' to verify your setup"
    echo "   4. Run 'npm run dev' to start development server"
    echo ""
    echo "📚 See ENVIRONMENT_SETUP.md for detailed instructions"
    echo ""
else
    echo "❌ Failed to create .env.local"
    exit 1
fi
