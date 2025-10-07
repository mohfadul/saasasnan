# 🚀 Simple Test Guide - Your New Roles

**Quick Reference** - Keep this open while testing!

---

## 🌐 **URLs**

**Frontend (Login Page)**:  
```
http://localhost:3000/login
```

**Backend API**:  
```
http://localhost:3001
```

---

## 🔐 **Test Credentials**

### **1. Doctor Account** 🩺
```
Email:    doctor@demo.com
Password: Doctor123!@#
```

### **2. Pharmacist Account** 💊
```
Email:    pharmacist@demo.com
Password: Pharmacist123!@#
```

### **3. Hospital Admin Account** 🏥
```
Email:    hospitaladmin@demo.com
Password: Hospital123!@#
```

### **4. Original Admin (Still Works)** ⚙️
```
Email:    admin@demo.com
Password: Admin123!@#
```

---

## ✅ **What To Expect**

When you login successfully:
- ✅ No error message
- ✅ Dashboard appears
- ✅ User name shows in top-right corner
- ✅ Sidebar menu is visible

**Note**: All roles currently see the **same dashboard**. This is normal!  
In Phase 2-3, each role will get their own custom dashboard.

---

## ❌ **Common Issues**

### **"Network Error"**
- Backend not running → Check backend PowerShell window
- Should see: "Nest application successfully started"

### **"Invalid credentials"**
- Users not created yet → Need to run database SQL first
- Check: `STEP-BY-STEP-SETUP.sql` in database/migrations/

### **"Cannot connect"**
- Wrong URL → Use `http://localhost:3000/login` (not :3001)
- Frontend not running → Check frontend PowerShell window

---

## 📊 **Server Status Check**

**Backend Window** should show:
```
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] INFO Application is running on: http://[::1]:3001
```

**Frontend Window** should show:
```
webpack compiled successfully
Compiled successfully!
```

---

## 💬 **After Testing, Tell Me:**

✅ **"Login works!"** → Ready for Phase 2 (Role-Based Security)  
❌ **"Got error: [message]"** → I'll help fix it  
⏸️ **"Need to setup database first"** → I'll guide you  

---

## 🎯 **Next Steps After Successful Login**

Once all 3 roles can login:

### **Phase 2: Role-Based Security** (My next task)
- Secure all 150+ API endpoints with role checks
- Implement data filtering by role
- Prevent unauthorized access

### **Phase 3: Custom Dashboards**
- Build 5 unique dashboard UIs
- Doctor sees: Hospital beds, lab reports, patient rounds
- Pharmacist sees: POS, inventory, prescriptions
- Hospital Admin sees: Everything
- Dentist sees: Appointments, dental records
- Patient sees: Their own portal

### **Phase 4-5**: Complete the role-based system

---

**🚀 Ready to test? Open `http://localhost:3000/login` and try it!**

