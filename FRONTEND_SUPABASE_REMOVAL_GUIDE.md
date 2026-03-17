# Frontend Supabase Removal - Remaining Files Guide

## ✅ Already Updated (4 files)
- ✅ `src/api/mobileApi.js` - Backend API client
- ✅ `src/database/databaseApi.js` - Database abstraction layer
- ✅ `src/hooks/useStudentProfile.js` - No more Supabase
- ✅ `src/hooks/useTeacherDashboard.js` - No more Supabase
- ✅ `src/scenes/LoginScreen.js` - Uses databaseApi for profiles

## ⏳ Still Need Updates (20 files)

### **Pattern to Follow**

```javascript
// BEFORE (OLD - Remove This)
import { supabase } from '../../supabase';
import { getTeacherProfile, getTeacherBookings } from '../database/database';

const data = await supabase.from('teacher_profiles').select('*').single();

// AFTER (NEW - Use This)
import databaseApi from '../database/databaseApi';

const response = await databaseApi.getTeacherProfile(teacherId);
const data = response;
```

---

## 📋 All Remaining Files

### **CRITICAL - Update First**

#### 1. **`src/scenes/Student/StudentCheckout.js`**
```javascript
// Remove:
const { data: charges } = await supabase.from('admin_charges').select('*')

// Replace with:
const charges = await databaseApi.getAdminCharges(teacherId);
```

#### 2. **`src/scenes/Teacher/TeacherAvailability.js`**
```javascript
// Remove:
const { data } = await supabase.from('teacher_availability_schedule').select('*')

// Replace with:
const availability = await databaseApi.getTeacherWeeklyAvailability(teacherId);
```

#### 3. **`src/scenes/TeacherDashboard.js`**
Already uses hooks - should work as-is, but verify no direct Supabase calls

#### 4. **`src/scenes/StudentDashboard.js`**
Already uses hooks - should work as-is, but verify no direct Supabase calls

---

### **HIGH PRIORITY - Update Next**

#### 5. **`src/scenes/Teacher/BankAccountSettings.js`**
```javascript
// Remove:
const { data: bankDetails } = await supabase.from('bank_accounts')

// Replace with:
const profile = await databaseApi.getProfile(userId);
// Bank details would be in profile
```

#### 6. **`src/scenes/Teacher/WithdrawalRequest.js`**
```javascript
// Remove:
await supabase.from('withdrawal_requests').insert(...)

// Replace with:
await databaseApi.requestWithdrawal(teacherId, amount, bankDetails);
```

#### 7. **`src/scenes/Teacher/ScheduleLecture.js`**
```javascript
// Remove:
const { data: teacher } = await supabase.from('teacher_profiles')

// Replace with:
const teacher = await databaseApi.getTeacherProfile(teacherId);
```

#### 8. **`src/scenes/Teacher/TeacherEarnings.js`**
```javascript
// Remove:
const { data: earnings } = await supabase.from('teacher_earnings')

// Replace with:
const earnings = await databaseApi.getTeacherEarnings(teacherId);
```

#### 9. **`src/scenes/Teacher/EditTeacherProfile.js`**
```javascript
// Remove:
const { data } = await supabase.from('teacher_profiles').select('*')
await supabase.from('teacher_profiles').update(...)

// Replace with:
const profile = await databaseApi.getProfile(userId);
await databaseApi.updateProfile(userId, updates);
```

#### 10. **`src/scenes/Student/EditStudentProfile.js`**
```javascript
// Remove:
const { data } = await supabase.from('student_profiles').select('*')
await supabase.from('student_profiles').update(...)

// Replace with:
const profile = await databaseApi.getProfile(userId);
await databaseApi.updateProfile(userId, updates);
```

---

### **MEDIUM PRIORITY**

#### 11. **`src/scenes/SignupScreen.js`**
Uses Supabase auth - keep for authentication, but use databaseApi for profile creation

#### 12. **`src/scenes/NotificationsScreen.js`**
```javascript
// Remove:
const { data: notifications } = await supabase.from('notifications')

// Replace with:
const response = await databaseApi.getNotifications(userId);
```

#### 13. **`src/scenes/ProfessionSelectScreen.js`**
Check for Supabase calls and replace with databaseApi equivalents

#### 14. **`src/scenes/RootNavigator.js`**
Check for Supabase calls, especially auth checks

#### 15. **`src/scenes/join/index.js`**
```javascript
// Remove:
const { data: teacher } = await supabase.from('teacher_profiles')

// Replace with:
const teacher = await databaseApi.getTeacherProfile(teacherId);
```

#### 16. **`src/scenes/meeting/index.js`**
Check for Supabase calls related to meetings

---

### **LOW PRIORITY - Admin & Special**

#### 17. **`src/scenes/Admin/AdminDashboard.js`**
Check for Supabase calls - replace with databaseApi if needed

#### 18. **`src/scenes/SuperAdminDashboard.js`**
Check for Supabase calls - replace with databaseApi if needed

#### 19. **`src/database/database.js`**
**MARK AS DEPRECATED**
- Add comment at top: `// DEPRECATED - Use databaseApi.js instead`
- Keep for reference only

---

## 🚀 **Quick Update Template**

Use this template for each file:

```javascript
// 1. ADD AT TOP
import databaseApi from '../database/databaseApi';

// 2. FIND AND REPLACE all patterns like:
// await supabase.from('table_name').select(...)
// WITH:
// await databaseApi.getTableName(...)

// 3. FIND AND REPLACE patterns like:
// await supabase.from('table_name').update(...)
// WITH:
// await databaseApi.updateProfile(userId, data)

// 4. REMOVE:
// import { function1, function2 } from '../database/database'
// import { supabase } from '../../supabase'
```

---

## ✅ **Verification Checklist**

For each file after updating:
- [ ] No `import { supabase }` statements
- [ ] No `supabase.from()` calls (except auth which is OK)
- [ ] All profile/data fetching uses `databaseApi`
- [ ] No imports from `../database/database`
- [ ] Code compiles without errors
- [ ] Functions still work as before

---

## 📊 **Summary Table**

| File | Priority | Status | Pattern |
|------|----------|--------|---------|
| StudentCheckout.js | CRITICAL | ⏳ TODO | Use databaseApi.createPaymentOrder() |
| TeacherAvailability.js | CRITICAL | ⏳ TODO | Use databaseApi.getTeacherAvailability() |
| TeacherDashboard.js | CRITICAL | ✅ HOOKS | Should work via hooks |
| StudentDashboard.js | CRITICAL | ✅ HOOKS | Should work via hooks |
| EditTeacherProfile.js | HIGH | ⏳ TODO | Use databaseApi.getProfile() |
| EditStudentProfile.js | HIGH | ⏳ TODO | Use databaseApi.getProfile() |
| BankAccountSettings.js | HIGH | ⏳ TODO | Use databaseApi.getProfile() |
| WithdrawalRequest.js | HIGH | ⏳ TODO | Use databaseApi.requestWithdrawal() |
| NotificationsScreen.js | MEDIUM | ⏳ TODO | Use databaseApi.getNotifications() |
| ProfessionSelectScreen.js | MEDIUM | ⏳ TODO | Check & update |
| RootNavigator.js | MEDIUM | ⏳ TODO | Check & update |
| join/index.js | MEDIUM | ⏳ TODO | Use databaseApi |
| meeting/index.js | MEDIUM | ⏳ TODO | Use databaseApi |
| SignupScreen.js | MEDIUM | ⏳ TODO | Keep auth, use databaseApi for profiles |
| BankAccountSettings.js | LOW | ⏳ TODO | Check & update |
| AdminDashboard.js | LOW | ⏳ TODO | Check & update |
| SuperAdminDashboard.js | LOW | ⏳ TODO | Check & update |
| ScheduleLecture.js | LOW | ⏳ TODO | Use databaseApi |
| TeacherEarnings.js | LOW | ⏳ TODO | Use databaseApi |
| database.js | CLEANUP | ⏳ TODO | Mark deprecated |

---

## 🎯 **Next Steps**

1. **Run this command** to see which files still have Supabase:
   ```bash
   grep -r "supabase\." src/scenes --include="*.js" | wc -l
   ```

2. **Update Critical Files** (1-4 above) - These affect core functionality

3. **Update High Priority Files** (5-10 above) - These are frequently used

4. **Verify No Broken Imports** - Run the app and check console for errors

5. **Test All Features** - Ensure everything still works

6. **Run Final Cleanup** - Remove/deprecate database.js

---

## 💡 **Tips**

1. **Search and Replace in IDE**: Use Ctrl+H to find/replace patterns
2. **Pattern Match**: All `supabase.from('table').select()` → `databaseApi.getTable()`
3. **Test After Each File**: Update one file, test, then move to next
4. **Use Console Logs**: Add `logger.info()` calls to debug any issues
5. **Keep Track**: Check off files as you complete them

---

## 📞 **If You Get Stuck**

If a file doesn't have a clear databaseApi equivalent:
1. Check databaseApi.js to see what functions exist
2. Look at similar already-updated files for patterns
3. Create a new backend API endpoint if needed
4. Or keep the Supabase call with a comment explaining why

---

**Remember:** The goal is **NO DIRECT SUPABASE CALLS** in the frontend (except authentication). Everything goes through `databaseApi` which calls the backend!
