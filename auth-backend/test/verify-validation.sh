#!/bin/bash

URL="http://localhost:3000/clients"

echo "1. Testing invalid input (missing name)..."
RESPONSE=$(curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -d '{"redirectUris": ["http://localhost:8080/callback"]}')
echo "Response: $RESPONSE"

if [[ $RESPONSE == *"name should not be empty"* ]]; then
  echo "✅ Validation passed: Name is required"
else
  echo "❌ Validation failed"
fi

echo -e "\n2. Testing invalid input (invalid URL)..."
RESPONSE=$(curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "redirectUris": ["not-a-url"]}')
echo "Response: $RESPONSE"

if [[ $RESPONSE == *"redirectUris must be a URL address"* ]]; then
  echo "✅ Validation passed: URL validation working"
else
  echo "❌ Validation failed"
fi

echo -e "\n3. Testing valid input..."
RESPONSE=$(curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -d '{"name": "Valid Client", "redirectUris": ["http://example.com/callback"]}')
echo "Response: $RESPONSE"

if [[ $RESPONSE == *"id"* ]]; then
  echo "✅ Valid input accepted"
else
  echo "❌ Valid input failed"
fi

echo -e "\n4. Testing whitelist (extra fields)..."
RESPONSE=$(curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -d '{"name": "Extra Field Client", "redirectUris": ["http://example.com"], "extra": "should be stripped"}')
echo "Response: $RESPONSE"

if [[ $RESPONSE != *"extra"* && $RESPONSE == *"id"* ]]; then
  echo "✅ Whitelist working: Extra field stripped"
else
  echo "❌ Whitelist failed: Extra field present or request failed"
fi
