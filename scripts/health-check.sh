#!/bin/bash

# AeonSports Health Check Script
# Usage: ./scripts/health-check.sh [APP_URL]

APP_URL="${1:-http://localhost:3000}"

echo "=========================================="
echo "AeonSports Health Check"
echo "=========================================="
echo "Testing: $APP_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check homepage
echo -n "Homepage... "
if curl -sf "$APP_URL" > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Check admin stats API
echo -n "Admin Stats API... "
if curl -sf "$APP_URL/api/admin/stats" > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Check admin dashboard
echo -n "Admin Dashboard... "
if curl -sf "$APP_URL/admin" > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Check sitemap
echo -n "Sitemap... "
if curl -sf "$APP_URL/sitemap.xml" > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Check robots.txt
echo -n "Robots.txt... "
if curl -sf "$APP_URL/robots.txt" > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo ""
echo "=========================================="
echo "Health Check Complete"
echo "=========================================="
