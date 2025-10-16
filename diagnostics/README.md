# 🔍 מערכת אבחון אוטומטית לחיבור Supabase

מערכת אבחון חכמה בעברית שבודקת את החיבור ל-Supabase בשני שלבים ומפיקה דוחות מפורטים.

## 📋 סקירה כללית

המערכת בודקת אוטומטית:

### שלב 1: בדיקת חיבור Supabase בסיסי
- ✅ משתני סביבה (URL, Keys)
- ✅ יצירת Supabase client
- ✅ חיבור רשת לשרת
- ✅ גישה לטבלאות
- ✅ מערכת אימות (Auth)

**אם נכשל:** מפיק דוח מפורט עם המלצות לתיקון

**אם הצליח:** ממשיך לשלב 2

### שלב 2: בדיקת אינטגרציה עם HTML
- ✅ טעינת Supabase SDK מ-CDN
- ✅ חיבור ישיר מדפדפן
- ✅ בדיקת Auth מהדפדפן
- ✅ ממשק גרפי עם תוצאות בזמן אמת

**מטרה:** לזהות אם הבעיה היא ב-Supabase או ב-Frontend

---

## 🚀 שימוש מהיר

### הרצת כל האבחון (מומלץ)
```powershell
npm run diagnose
```

זה יריץ את שני השלבים ויפיק דוח מסכם מלא.

### הרצת שלב בודד

#### שלב 1 בלבד - בדיקת Supabase
```powershell
npm run diagnose:supabase
```

#### שלב 2 בלבד - יצירת HTML לבדיקה
```powershell
npm run diagnose:html
```

---

## 📁 מבנה הקבצים

```
diagnostics/
├── run-diagnosis.js              # סקריפט ראשי - מריץ את כל האבחון
├── test-supabase-connection.js  # שלב 1: בדיקת חיבור Node.js
├── test-html-simple.html         # תבנית HTML לשלב 2
├── generate-html-test.js         # יוצר HTML עם משתנים אמיתיים
├── test-html-generated.html      # (נוצר אוטומטית) HTML מוכן לבדיקה
├── reports/                      # תיקיית דוחות
│   ├── supabase-test-*.json      # דוחות JSON של שלב 1
│   ├── supabase-test-*.txt       # דוחות קריאים של שלב 1
│   ├── full-diagnosis-*.json     # דוח מסכם מלא JSON
│   └── full-diagnosis-*.txt      # דוח מסכם מלא קריא
└── README.md                     # המדריך הזה
```

---

## 📊 קריאת הדוחות

### דוח שלב 1 (Supabase Connection)
```
✅ הצליחו: X
❌ נכשלו: Y
⚠️  אזהרות: Z
📊 סה"כ: N

פירוט בדיקות:
1. ✅ VITE_SUPABASE_URL
   סטטוס: PASS
   הודעה: URL תקין: https://...

2. ❌ חיבור רשת
   סטטוס: FAIL
   הודעה: נכשל להתחבר - בעיית רשת
   פרטים: { error: "..." }
```

### דוח מסכם (Full Diagnosis)
```
סיכום שלבים:
  שלב 1: בדיקת חיבור Supabase
    ✅ הצליחו: 5
    ❌ נכשלו: 0
    ⚠️  אזהרות: 1
  
  שלב 2: בדיקת HTML
    סטטוס: manual_check_required

המלצות לפעולה:
  1. 🔴 [CRITICAL] משתנה סביבה חסר
     פעולה: הוסף VITE_SUPABASE_URL לקובץ .env
     דוגמה: VITE_SUPABASE_URL=https://...
```

---

## 🔧 הגדרת הפרויקט

### דרישות
- Node.js 18+
- npm
- קובץ `.env` עם משתני Supabase

### משתני סביבה נדרשים
הוסף ל-`.env`:
```properties
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (אופציונלי)
```

### התקנה
```powershell
npm install
```

---

## 🎯 תרחישי שימוש

### תרחיש 1: האפליקציה לא עולה
```powershell
npm run diagnose
```
המערכת תזהה אם הבעיה היא:
- ❌ משתני סביבה חסרים/שגויים
- ❌ חיבור רשת ל-Supabase
- ❌ מפתחות API לא תקינים
- ❌ הפרויקט לא פעיל ב-Supabase

### תרחיש 2: שגיאות אימות (Auth)
```powershell
npm run diagnose:supabase
```
בדוק את הבדיקה "מערכת אימות" בדוח.

### תרחיש 3: בעיות רק בדפדפן
```powershell
npm run diagnose:html
```
פתח את `test-html-generated.html` בדפדפן ובדוק את הקונסול.

### תרחיש 4: בדיקה ידנית מפורטת
1. הרץ שלב 1:
   ```powershell
   npm run diagnose:supabase
   ```
2. פתח דוח ב-`diagnostics/reports/supabase-test-*.txt`
3. אם הצליח, הרץ שלב 2:
   ```powershell
   npm run diagnose:html
   ```
4. פתח `diagnostics/test-html-generated.html` בדפדפן

---

## 🐛 פתרון בעיות נפוצות

### "Missing VITE_SUPABASE_URL"
**פתרון:** הוסף את המשתנה לקובץ `.env`:
```properties
VITE_SUPABASE_URL=https://obypfqfghztvaefxnpgb.supabase.co
```

### "net::ERR_CONNECTION_REFUSED"
**גורם אפשרי:**
- אין חיבור אינטרנט
- ה-URL שגוי
- הפרויקט הושהה/נמחק ב-Supabase

**פתרון:**
1. בדוק חיבור אינטרנט
2. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
3. וודא שהפרויקט פעיל

### "JWT expired" / "Invalid API key"
**פתרון:**
1. היכנס ל-[Project Settings > API](https://app.supabase.com/project/_/settings/api)
2. העתק מפתח חדש (anon/public)
3. החלף ב-`.env`

### HTML לא מציג תוצאות
**פתרון:**
1. וודא שהרצת `npm run diagnose:html`
2. פתח את `test-html-generated.html` (לא את `test-html-simple.html`)
3. בדוק קונסול בדפדפן (F12)

---

## 📈 הרחבות עתידיות

רעיונות לשיפור:
- [ ] בדיקות Storage (העלאת/הורדת קבצים)
- [ ] בדיקות Edge Functions
- [ ] בדיקות Realtime
- [ ] בדיקות RLS (Row Level Security)
- [ ] אינטגרציה עם CI/CD
- [ ] התראות אוטומטיות (email/slack)

---

## 💡 טיפים

1. **הרץ תקופתית:** הרץ את האבחון אחרי כל שינוי בהגדרות Supabase
2. **שמור דוחות:** הדוחות נשמרים עם timestamp - שמור אותם להשוואה
3. **CI/CD:** הוסף `npm run diagnose` ל-CI pipeline
4. **מעקב:** בדוק את תיקיית `reports/` לניתוח מגמות

---

## 🆘 תמיכה

אם נתקעת:
1. בדוק את הדוח המפורט ב-`reports/`
2. חפש את השגיאה ב-[Supabase Docs](https://supabase.com/docs)
3. פתח issue עם הדוח המלא

---

## 📜 רישיון

MIT - חופשי לשימוש ושינוי

---

**נוצר על ידי מערכת אבחון אוטומטית** ✨
