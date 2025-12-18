#!/bin/bash
# Quick check script - run this anytime to see progress

echo "📊 Quick Comparison: Local vs Supabase"
echo ""

cd /Users/borislavbojkov/dev/bridge
npx tsx scripts/check-data-step2.ts 2>&1 | grep -E "(Table|✅|⚠️|❌|Local|Supabase|--)" | head -25

