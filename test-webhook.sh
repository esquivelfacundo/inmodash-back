#\!/bin/bash

echo "🔍 Testing WhatsApp Webhook..."
echo ""

# Test 1: Webhook verification
echo "📞 Test 1: Webhook Verification"
RESPONSE=$(curl -s "https://inmodash-back-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=test123")
echo "Response: $RESPONSE"
echo ""

# Test 2: Health check
echo "🏥 Test 2: Server Health"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://inmodash-back-production.up.railway.app/api/health)
echo "Status Code: $STATUS"
echo ""

echo "✅ Tests completed\!"
