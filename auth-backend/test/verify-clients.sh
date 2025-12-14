#!/bin/bash

# Base URL
URL="http://localhost:3000/clients"

echo "1. Creating a new client..."
RESPONSE=$(curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Client", "redirectUris": ["http://localhost:8080/callback"]}')
echo "Response: $RESPONSE"

ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Created Client ID: $ID"

if [ -z "$ID" ]; then
  echo "Failed to create client. Exiting."
  exit 1
fi

echo -e "\n2. Getting all clients..."
curl -s $URL | grep "Test Client"
echo ""

echo -e "\n3. Getting client details (backend)..."
curl -s "$URL/$ID"
echo ""

echo -e "\n4. Getting public client details..."
curl -s "$URL/public/$ID"
echo ""

echo -e "\n5. Updating client..."
curl -s -X PATCH "$URL/$ID" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Client"}'
echo ""

echo -e "\n6. Verifying update..."
curl -s "$URL/$ID" | grep "Updated Client"
echo ""

echo -e "\n7. Deleting client..."
curl -s -X DELETE "$URL/$ID"
echo ""

echo -e "\n8. Verifying deletion..."
curl -s "$URL/$ID"
echo ""
