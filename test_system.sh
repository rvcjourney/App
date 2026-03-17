#!/bin/bash

echo "================================"
echo "🧪 FULL SYSTEM VALIDATION"
echo "================================"
echo ""

passed=0
failed=0

check() {
  local name=$1
  local condition=$2
  
  if [ "$condition" = "true" ]; then
    echo "  ✅ $name"
    ((passed++))
  else
    echo "  ❌ $name"
    ((failed++))
  fi
}

echo "📋 1. CRITICAL FILES"
echo "─────────────────────────────────"
[ -f "src/database/databaseApi.js" ] && check "databaseApi.js exists" "true" || check "databaseApi.js exists" "false"
[ -f "src/api/mobileApi.js" ] && check "mobileApi.js exists" "true" || check "mobileApi.js exists" "false"
[ -f "src/database/database.js" ] && check "database.js exists (deprecated)" "true" || check "database.js exists" "false"

echo ""
echo "📋 2. UPDATED FILES USE DATABASEAPI"
echo "─────────────────────────────────"
grep -q "import databaseApi" "src/scenes/Student/StudentCheckout.js" && check "StudentCheckout uses databaseApi" "true" || check "StudentCheckout uses databaseApi" "false"
grep -q "import databaseApi" "src/scenes/Teacher/EditTeacherProfile.js" && check "EditTeacherProfile uses databaseApi" "true" || check "EditTeacherProfile uses databaseApi" "false"
grep -q "import databaseApi" "src/scenes/Admin/AdminDashboard.js" && check "AdminDashboard uses databaseApi" "true" || check "AdminDashboard uses databaseApi" "false"

echo ""
echo "📋 3. DATABASEAPI EXPORTS REQUIRED FUNCTIONS"
echo "─────────────────────────────────"
grep -q "export const getProfile" "src/database/databaseApi.js" && check "exports getProfile" "true" || check "exports getProfile" "false"
grep -q "export const updateProfile" "src/database/databaseApi.js" && check "exports updateProfile" "true" || check "exports updateProfile" "false"
grep -q "export const getAllTeachers" "src/database/databaseApi.js" && check "exports getAllTeachers" "true" || check "exports getAllTeachers" "false"

echo ""
echo "📋 4. DATABASE.JS MARKED DEPRECATED"
echo "─────────────────────────────────"
grep -q "DEPRECATED" "src/database/database.js" && check "database.js has DEPRECATED notice" "true" || check "database.js has DEPRECATED notice" "false"

echo ""
echo "📋 5. AUTHENTICATION FILES KEEP SUPABASE.AUTH"
echo "─────────────────────────────────"
grep -q "supabase.auth" "src/scenes/LoginScreen.js" && check "LoginScreen keeps supabase.auth" "true" || check "LoginScreen keeps supabase.auth" "false"
grep -q "supabase.auth" "src/scenes/SignupScreen.js" && check "SignupScreen keeps supabase.auth" "true" || check "SignupScreen keeps supabase.auth" "false"

echo ""
echo "📋 6. ENVIRONMENT CONFIGURATION"
echo "─────────────────────────────────"
grep -q "REACT_APP_API_URL" ".env" && check ".env has REACT_APP_API_URL" "true" || check ".env has REACT_APP_API_URL" "false"
grep -q "REACT_APP_AUTH_URL" ".env" && check ".env has REACT_APP_AUTH_URL" "true" || check ".env has REACT_APP_AUTH_URL" "false"

echo ""
echo "📋 7. BACKEND SETUP"
echo "─────────────────────────────────"
[ -f "backend/package.json" ] && check "Backend package.json exists" "true" || check "Backend package.json exists" "false"
grep -q "express" "backend/package.json" && check "Backend has express" "true" || check "Backend has express" "false"
[ -f "backend/.env" ] && check "Backend .env exists" "true" || check "Backend .env exists" "false"

echo ""
echo "================================"
total=$((passed + failed))
echo "✅ Passed: $passed/$total"
echo "❌ Failed: $failed/$total"
echo "Score: $((passed * 100 / total))%"
echo "================================"
