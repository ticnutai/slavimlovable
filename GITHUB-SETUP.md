# 🚀 הוראות חיבור ל-GitHub

## שלב 1: צור Repository ב-GitHub

הדף נפתח אוטומטית בדפדפן. מלא את הפרטים:

### הגדרות מומלצות:
```
Repository name: slavimlovable
Description: Task Management System with Kanban, Spreadsheet & Workflow views
             Built with React, TypeScript, Vite & Supabase

☑️ Private (או Public - לפי בחירתך)
☐ Add a README file (כבר יש לנו)
☐ Add .gitignore (כבר יש לנו)
☐ Choose a license (אופציונלי)
```

לחץ: **Create repository**

---

## שלב 2: העתק את ה-URL

אחרי שנוצר ה-Repository, תראה מסך עם הוראות.
**העתק את ה-URL** שמופיע למעלה (אחד מהאלה):

### HTTPS (מומלץ):
```
https://github.com/YOUR_USERNAME/slavimlovable.git
```

### SSH (אם הגדרת SSH keys):
```
git@github.com:YOUR_USERNAME/slavimlovable.git
```

---

## שלב 3: הרץ את הפקודות

חזור ל-VS Code Terminal והרץ:

### אם השם שלך ב-GitHub הוא `username`:
```bash
git remote add origin https://github.com/username/slavimlovable.git
git branch -M main
git push -u origin main
```

**החלף `username` בשם המשתמש שלך ב-GitHub!**

---

## דוגמה מלאה:

אם השם שלך ב-GitHub הוא `johndoe`:

```bash
# הוסף remote
git remote add origin https://github.com/johndoe/slavimlovable.git

# שנה שם ל-main
git branch -M main

# דחוף לגיטהאב
git push -u origin main
```

---

## ⚠️ שים לב!

1. **שם משתמש**: החלף `username` בשם המשתמש האמיתי שלך
2. **אימות**: GitHub עשוי לבקש ממך להתחבר
3. **Token**: אם נדרש, צור Personal Access Token:
   - Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token
   - בחר: `repo` (Full control of private repositories)
   - העתק את ה-Token ושמור אותו (לא תוכל לראות אותו שוב!)

---

## ✅ אחרי ה-Push

1. רענן את דף GitHub
2. תראה את כל הקוד שלך!
3. כולל את הדוח: `QUALITY-REPORT-HE.md`

---

## 💡 פקודות שימושיות

```bash
# בדוק אם Remote הוגדר
git remote -v

# הסר Remote (אם טעית)
git remote remove origin

# שנה URL של Remote
git remote set-url origin <NEW_URL>

# בדוק סטטוס
git status

# Push שינויים חדשים
git add .
git commit -m "הודעה"
git push
```

---

**צריך עזרה? יש לך את כל ההוראות כאן! 🚀**
