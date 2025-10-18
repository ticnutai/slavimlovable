# 🧹 מדריך ניקוי קבצים זמניים

## 🎯 למה צריך ניקוי?

במהלך הפיתוח נוצרים המון קבצים זמניים:
- **npm cache** - מטמון של חבילות
- **node_modules/.vite** - מטמון של Vite
- **playwright-report** - דוחות בדיקות
- **test-results** - תוצאות בדיקות
- **dist** - קבצי build
- **קבצי .log** - לוגים שונים

כל אלה תופסים מקום ולא תמיד נחוצים.

## 🚀 איך להריץ ניקוי?

### אפשרות 1 - ניקוי מהיר (Node.js):
```bash
npm run clean
```

### אפשרות 2 - ניקוי מלא (PowerShell):
```bash
npm run clean:full
```

או ישירות:
```powershell
pwsh -File scripts/cleanup.ps1
```

## 📋 מה נמחק בניקוי?

### תיקיות:
- ✅ `node_modules/.vite` - מטמון Vite (יווצר מחדש אוטומטית)
- ✅ `node_modules/.cache` - מטמון כללי
- ✅ `.cache` - מטמון נוסף
- ✅ `dist` - קבצי build (אפשר לבנות מחדש)
- ✅ `playwright-report` - דוחות בדיקות (אפשר ליצור מחדש)
- ✅ `test-results` - תוצאות בדיקות (אפשר ליצור מחדש)
- ✅ `.playwright` - מטמון Playwright

### קבצים:
- ✅ כל קבצי `.log`
- ✅ `test-results.json`
- ✅ `test-results.xml`

### מטמון npm:
- ✅ ניקוי מלא של npm cache

## ⚠️ מה לא נמחק?

הסקריפט **לא** מוחק:
- ❌ `node_modules` - החבילות עצמן (רק המטמון שלהן)
- ❌ `src` - קוד המקור
- ❌ קבצי תצורה (`.env`, `package.json`, וכו')
- ❌ `supabase` - נתוני המסד
- ❌ קבצי Git

## 💾 כמה מקום זה חוסך?

תלוי בפרויקט, אבל בדרך כלל:
- **playwright-report**: 50-200 MB
- **test-results**: 100-500 MB
- **npm cache**: 100-1000 MB
- **מטמון Vite**: 10-50 MB

**סה"כ: עד 1.7 GB!** 🎉

## 🔄 מתי להריץ ניקוי?

### הרץ ניקוי כאשר:
1. ✅ נגמר לך מקום בדיסק
2. ✅ יש בעיות build מוזרות
3. ✅ Vite לא מזהה שינויים
4. ✅ אחרי סיום פיתוח לפני commit
5. ✅ פעם בשבוע/חודש (תחזוקה)

### אל תריץ ניקוי כאשר:
1. ❌ השרת רץ (עצור אותו קודם)
2. ❌ בדיקות רצות
3. ❌ בתהליך build

## 🛠️ ניקוי ידני נוסף

### למחוק את כל node_modules (זהיר!):
```bash
Remove-Item -Path "node_modules" -Recurse -Force
npm install
```

### לנקות רק מטמון npm:
```bash
npm cache clean --force
```

### לנקות רק מטמון Vite:
```bash
Remove-Item -Path "node_modules/.vite" -Recurse -Force
```

## 📊 סטטיסטיקות

הסקריפט מציג:
- 📏 **גודל לפני** הניקוי
- 📏 **גודל אחרי** הניקוי
- 💾 **כמה נחסך**

דוגמה:
```
════════════════════════════════════════
📊 סיכום הניקוי
════════════════════════════════════════
גודל לפני:  1024.50 MB
גודל אחרי:  524.30 MB
נחסך:      500.20 MB
════════════════════════════════════════
```

## ⚡ ניקוי אוטומטי

אפשר להוסיף ניקוי אוטומטי לסקריפטים:

```json
{
  "scripts": {
    "prebuild": "npm run clean",
    "pretest": "npm run clean"
  }
}
```

זה ירוץ אוטומטית לפני build או test.

## 🔧 פתרון בעיות

### אם הניקוי נכשל:
1. סגור את VS Code
2. עצור את כל תהליכי Node
3. הרץ כ-Administrator
4. נסה שוב

### אם עדיין יש בעיות מקום:
```bash
# בדוק גודל תיקיות
Get-ChildItem | ForEach-Object {
  $size = (Get-ChildItem $_.FullName -Recurse -ErrorAction SilentlyContinue | 
    Measure-Object -Property Length -Sum).Sum / 1MB
  [PSCustomObject]@{
    Name = $_.Name
    Size = "$([math]::Round($size, 2)) MB"
  }
} | Sort-Object Size -Descending
```

## 📝 טיפים

1. **הרץ ניקוי לפני commit גדול** - יותר מהיר להעלות
2. **הרץ ניקוי אם Vite מתנהג מוזר** - פותר הרבה בעיות
3. **הרץ ניקוי פעם בשבוע** - שומר על הפרויקט נקי
4. **בדוק מה נמחק** - תמיד טוב לדעת

## ✨ סיכום

ניקוי קבצים זמניים זה:
- ✅ **בטוח** - לא מוחק קוד או הגדרות חשובות
- ✅ **מהיר** - לוקח כמה שניות
- ✅ **יעיל** - חוסך מאות MB
- ✅ **פשוט** - פקודה אחת

**הרץ `npm run clean` כל פעם שצריך מקום!** 🚀
