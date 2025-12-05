#!/bin/bash

echo "🧹 Cleaning all subscriptions..."
curl -X DELETE https://inmodash-back-production.up.railway.app/api/subscriptions/clean-all
echo ""
echo "✅ Done!"
