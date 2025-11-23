#!/bin/bash

echo "=== ORDER EXECUTION ENGINE TEST SUITE ==="
echo

# --------------------------------------------------------------------
# 1. HEALTH CHECK (should be 404 but server must respond)
# --------------------------------------------------------------------
echo "1. Checking server response on / ..."
curl -I http://localhost:3000/ 2>/dev/null
echo
echo "✔ Server is responding."
echo

# --------------------------------------------------------------------
# 2. STATIC CLIENT CHECK
# --------------------------------------------------------------------
echo "2. Checking static client page..."
curl -I http://localhost:3000/static/client.html 2>/dev/null
echo

echo "✔ Static client is served."
echo

# --------------------------------------------------------------------
# 3. Submit an order (POST /api/orders/execute)
# --------------------------------------------------------------------
echo "3. Submitting mock order..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{"tokenIn":"SOL","tokenOut":"USDC","amountIn":5}')

echo "Response:"
echo "$RESPONSE"
echo

ORDER_ID=$(echo "$RESPONSE" | grep -oE '"orderId":"[a-f0-9]+' | cut -d':' -f2 | tr -d '"')

if [ -z "$ORDER_ID" ]; then
  echo "❌ Could not extract orderId. Test failed."
  exit 1
fi

echo "✔ Extracted orderId: $ORDER_ID"
echo

# --------------------------------------------------------------------
# 4. WebSocket connection test
# --------------------------------------------------------------------
echo "4. Testing WebSocket upgrade…"
echo "Opening WebSocket for 8 seconds:"
echo

# Using wscat to capture messages
wscat -c ws://localhost:3000/api/orders/upgrade/$ORDER_ID &
PID=$!

# Let WS listen for 8 seconds
sleep 8

# Kill wscat
kill $PID >/dev/null 2>&1

echo
echo "✔ WebSocket test finished."
echo "=== TEST SUITE COMPLETE ==="
