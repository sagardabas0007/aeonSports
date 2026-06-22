#!/bin/bash

# AeonSports Production Setup Script
# This script helps you set up production environment variables

set -e

echo "=========================================="
echo "AeonSports Production Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ -f .env.local ]; then
    echo -e "${YELLOW}Warning: .env.local already exists${NC}"
    read -p "Overwrite? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Creating .env.local from template..."
cp .env.example .env.local

echo ""
echo -e "${GREEN}✓ .env.local created${NC}"
echo ""
echo "=========================================="
echo "Required Setup Steps:"
echo "=========================================="
echo ""
echo "1. Supabase Setup"
echo "   - Create project at https://supabase.com"
echo "   - Run migrations from supabase/migrations/"
echo "   - Copy credentials to .env.local"
echo ""
echo "2. Anthropic Setup"
echo "   - Get API key at https://console.anthropic.com"
echo "   - Add to .env.local"
echo ""
echo "3. FIFA API Setup"
echo "   - Sign up at https://api-sports.io"
echo "   - Subscribe to Football API"
echo "   - Add API key to .env.local"
echo ""
echo "4. Blockchain Setup"
echo "   - Create/import wallet"
echo "   - Fund with ETH on Base network"
echo "   - Add private key to .env.local (NEVER commit this!)"
echo ""
echo "5. Token Platform APIs"
echo "   - Register with Clanker and Flaunch"
echo "   - Add API keys to .env.local"
echo ""
echo "6. Generate Secrets"
echo "   Run: openssl rand -base64 32"
echo "   Add to CRON_SECRET and INTERNAL_API_SECRET"
echo ""
echo "7. Optional: Rate Limiting"
echo "   - Create Upstash Redis at https://upstash.com"
echo "   - Add credentials to .env.local"
echo ""
echo "8. Optional: Error Monitoring"
echo "   - Create Sentry project at https://sentry.io"
echo "   - Add DSN to .env.local"
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Edit .env.local with your credentials"
echo "2. Run: npm install"
echo "3. Run: npm run dev (for local testing)"
echo "4. Deploy to Vercel (see DEPLOYMENT.md)"
echo ""
echo -e "${GREEN}Setup complete! Edit .env.local to add your credentials.${NC}"
echo ""
