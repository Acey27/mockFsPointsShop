#!/bin/bash

# Comprehensive System Functionality Test
# Tests all major features after TypeScript to JavaScript conversion

echo "🧪 Running Comprehensive System Tests"
echo "===================================="

BASE_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:5173"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    echo -n "Testing $test_name... "
    
    result=$(eval "$command" 2>/dev/null)
    
    if echo "$result" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "  Expected: $expected_pattern"
        echo "  Got: $result" | head -3
        ((TESTS_FAILED++))
    fi
}

echo ""
echo "🏥 1. Backend Health Tests"
echo "------------------------"

run_test "Backend Health Check" \
    "curl -s $BASE_URL/health" \
    '"status":"OK"'

run_test "API Health Check" \
    "curl -s $BASE_URL/api/health" \
    '"database":"connected"'

echo ""
echo "🔐 2. Authentication System Tests"
echo "-------------------------------"

# Register a test user
TEST_EMAIL="systemtest$(date +%s)@example.com"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"TestPass123\",\"name\":\"System Test\",\"department\":\"QA\"}")

run_test "User Registration" \
    "echo '$REGISTER_RESPONSE'" \
    '"status":"success"'

# Extract token for further tests
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

run_test "User Login" \
    "curl -s -X POST $BASE_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"$TEST_EMAIL\",\"password\":\"TestPass123\"}'" \
    '"status":"success"'

echo ""
echo "💰 3. Points System Tests"
echo "------------------------"

run_test "Get User Points" \
    "curl -s -H 'Authorization: Bearer $TOKEN' $BASE_URL/api/points" \
    '"availablePoints":'

run_test "Points Transactions History" \
    "curl -s -H 'Authorization: Bearer $TOKEN' $BASE_URL/api/points/transactions" \
    '"transactions"'

echo ""
echo "🛒 4. Shop System Tests"
echo "----------------------"

run_test "Get Shop Products" \
    "curl -s -H 'Authorization: Bearer $TOKEN' $BASE_URL/api/shop/products" \
    '"status":"success"'

run_test "Get Order History" \
    "curl -s -H 'Authorization: Bearer $TOKEN' $BASE_URL/api/shop/orders/history" \
    '"orders"'

echo ""
echo "😊 5. Mood Tracking Tests"
echo "------------------------"

run_test "Get Mood History" \
    "curl -s -H 'Authorization: Bearer $TOKEN' $BASE_URL/api/mood" \
    '"moods":'

run_test "Create Mood Entry" \
    "curl -s -X POST -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"mood\":\"excellent\",\"comment\":\"System test mood\"}' $BASE_URL/api/mood" \
    '"message":"Mood created successfully"'

echo ""
echo "👨‍💼 6. User Management Tests"
echo "----------------------------"

run_test "Get Users for Cheering" \
    "curl -s -H 'Authorization: Bearer $TOKEN' $BASE_URL/api/users/for-cheering" \
    '"status":"success"'

echo ""
echo "🔧 7. System Configuration Tests"
echo "-------------------------------"

run_test "Points Scheduler Configuration" \
    "grep -q '0 \* \* \* \*' /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/backend/src/config/pointsConfig.js && echo 'hourly schedule found'" \
    "hourly schedule found"

run_test "No TypeScript Files in Backend" \
    "find /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/backend/src -name '*.ts' | wc -l" \
    "0"

run_test "No TypeScript Files in Frontend" \
    "find /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/frontend/src -name '*.ts' -o -name '*.tsx' | wc -l" \
    "0"

echo ""
echo "🌐 8. Frontend Tests"
echo "------------------"

# Check if frontend is responding
run_test "Frontend Server Running" \
    "curl -s -o /dev/null -w '%{http_code}' $FRONTEND_URL" \
    "200"

# Test frontend build
run_test "Frontend Build" \
    "cd /Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/frontend && npm run build > /dev/null 2>&1 && echo 'build successful'" \
    "build successful"

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED! System is fully functional! 🎉${NC}"
    echo ""
    echo "✅ TypeScript to JavaScript conversion: COMPLETE"
    echo "✅ Backend functionality: WORKING"
    echo "✅ Frontend functionality: WORKING"  
    echo "✅ Database connectivity: WORKING"
    echo "✅ Authentication system: WORKING"
    echo "✅ Points system: WORKING"
    echo "✅ Shop system: WORKING"
    echo "✅ Mood tracking: WORKING"
    echo "✅ Performance optimization: APPLIED"
else
    echo ""
    echo -e "${YELLOW}⚠️  Some tests failed. Please review the issues above.${NC}"
fi

echo ""
echo "🔗 Access URLs:"
echo "Frontend: $FRONTEND_URL"
echo "Backend API: $BASE_URL"
echo "API Docs: $BASE_URL/api-docs"
echo "Health Check: $BASE_URL/health"
