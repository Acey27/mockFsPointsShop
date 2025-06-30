#!/bin/bash

# Points Shop API Test Script

echo "🧪 Points Shop API Test Suite"
echo "============================="

API_BASE="http://localhost:3001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=${4:-200}
    local description=$5
    local auth_token=${6:-""}
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "Endpoint: $method $endpoint"
    
    headers="-H 'Content-Type: application/json'"
    if [ ! -z "$auth_token" ]; then
        headers="$headers -H 'Authorization: Bearer $auth_token'"
    fi
    
    if [ "$method" = "GET" ]; then
        response=$(eval curl -s -w "HTTPSTATUS:%{http_code}" $headers "$API_BASE$endpoint")
    else
        response=$(eval curl -s -w "HTTPSTATUS:%{http_code}" -X $method $headers -d "'$data'" "$API_BASE$endpoint")
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
    body=$(echo $response | sed -E 's/HTTPSTATUS:[0-9]{3}$//')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $http_code)"
        echo "Response: $body"
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $http_code)"
        echo "Response: $body"
    fi
}

# Check if server is running
echo -e "\n🔍 Checking if server is running..."
if curl -s "$API_BASE/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not running. Please start with: cd server && npm run dev${NC}"
    exit 1
fi

# Test user registration
echo -e "\n📝 Testing User Registration..."
register_data='{"email":"test@example.com","password":"password123","name":"Test User","department":"Engineering"}'
test_endpoint "POST" "/api/auth/register" "$register_data" 201 "Register new user"

# Extract token from registration response
echo -e "\n🔑 Extracting auth token..."
register_response=$(curl -s -X POST -H 'Content-Type: application/json' -d "$register_data" "$API_BASE/api/auth/register")
token=$(echo $register_response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$token" ]; then
    echo -e "${GREEN}✓ Token extracted${NC}"
else
    echo -e "${YELLOW}⚠ Using login to get token...${NC}"
    # Try login if registration failed (user might already exist)
    login_data='{"email":"test@example.com","password":"password123"}'
    login_response=$(curl -s -X POST -H 'Content-Type: application/json' -d "$login_data" "$API_BASE/api/auth/login")
    token=$(echo $login_response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$token" ]; then
    echo -e "${RED}✗ Could not get auth token. Cannot continue with authenticated tests.${NC}"
    exit 1
fi

echo "Token: ${token:0:20}..."

# Test authenticated endpoints
echo -e "\n🔒 Testing Authenticated Endpoints..."

test_endpoint "GET" "/api/points/balance" "" 200 "Get points balance" "$token"
test_endpoint "GET" "/api/users/profile" "" 200 "Get user profile" "$token"
test_endpoint "GET" "/api/shop/products" "" 200 "Get shop products" "$token"
test_endpoint "GET" "/api/points/transactions" "" 200 "Get transactions" "$token"
test_endpoint "GET" "/api/users" "" 200 "Get users list" "$token"

# Test mood tracking
echo -e "\n😊 Testing Mood Tracking..."
mood_data='{"mood":"good","comment":"Feeling great today!"}'
test_endpoint "POST" "/api/mood" "$mood_data" 200 "Log mood entry" "$token"
test_endpoint "GET" "/api/mood/history" "" 200 "Get mood history" "$token"
test_endpoint "GET" "/api/mood/insights" "" 200 "Get mood insights" "$token"

echo -e "\n🎉 API Test Suite Complete!"
echo -e "Check the results above to see which endpoints are working correctly."
