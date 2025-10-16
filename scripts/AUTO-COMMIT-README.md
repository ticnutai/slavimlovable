# 🔄 Auto-Commit למערכת ניהול פרויקטים

שמירה אוטומטית לגיט כל שעה (או לפי דרישה).

## 📋 אפשרויות שימוש

### אפשרות 1: סקריפט Node.js (מומלץ)
הרצה רציפה שתשמור כל שעה:

```bash
npm run git:auto
```

הסקריפט:
- ✅ יבדוק אם יש שינויים כל שעה
- ✅ יבצע commit אוטומטי עם חותמת זמן
- ✅ ירוץ ברקע עד שתעצור אותו (Ctrl+C)

### אפשרות 2: סקריפט PowerShell
שמירה חד-פעמית:

```bash
npm run git:commit
```

או ישירות:

```powershell
.\scripts\auto-commit.ps1
```

## ⚙️ הגדרות

### שינוי תדירות השמירה
ערוך את `scripts/auto-commit.js`:

```javascript
const INTERVAL_HOURS = 1; // שנה ל-2 לשמירה כל שעתיים, או 0.5 לכל חצי שעה
```

### הפעלת Push אוטומטי
אם אתה רוצה גם לעשות push לגיטהאב אוטומטית, הסר את ההערה מהשורות:

**ב-`auto-commit.js`:**
```javascript
// הסר // מהשורות הבאות:
// console.log('📤 Pushing to remote...');
// execSync('git push origin main', { stdio: 'inherit' });
```

**ב-`auto-commit.ps1`:**
```powershell
# הסר # מהשורה:
# git push origin main
```

## 🎯 דוגמאות שימוש

### הרצה רציפה בטרמינל נפרד
פתח טרמינל חדש והרץ:
```bash
npm run git:auto
```

השאר את הטרמינל פתוח - הסקריפט ירוץ ברקע.

### הוספה ל-Task Scheduler (Windows)
ליצירת משימה שתרוץ אוטומטית כשהמחשב נדלק:

1. פתח Task Scheduler
2. צור משימה חדשה
3. הגדר Trigger: "At startup"
4. הגדר Action: `node` עם ארגומנטים: `C:\Users\jj121\Desktop\slavimlovable\scripts\auto-commit.js`

## 📝 הודעות Commit

כל commit אוטומטי יכלול:
```
Auto-save: 2025-10-17 14:30:00
```

## ⚠️ הערות חשובות

1. **גיבוי בלבד** - זה לא מחליף commits ידניים עם הודעות משמעותיות
2. **בדוק את ה-Git Status** - וודא שיש לך `.gitignore` מוגדר נכון
3. **Push זהיר** - אל תפעיל auto-push אלא אם אתה בטוח
4. **Performance** - השמירה אוטומטית לא תשפיע על ביצועי הפיתוח

## 🛑 עצירת השירות

לעצור את השמירה האוטומטית:
- לחץ `Ctrl+C` בטרמינל שבו רץ הסקריפט

## 🔍 בדיקה

לבדוק את ההיסטוריה:
```bash
git log --oneline -10
```

לבטל commit אחרון (אם טעית):
```bash
git reset HEAD~1 --soft
```
