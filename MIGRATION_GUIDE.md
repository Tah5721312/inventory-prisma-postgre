# دليل التحويل من Oracle إلى PostgreSQL + Prisma

## ✅ ما تم إنجازه

1. ✅ إنشاء `prisma/schema.prisma` مع جميع الجداول والعلاقات
2. ✅ تحديث `package.json` لإضافة Prisma وإزالة oracledb
3. ✅ تحديث `src/lib/database.ts` لاستخدام Prisma Client
4. ✅ تحديث `src/lib/db_utils.ts` لاستخدام Prisma queries
5. ✅ إنشاء `prisma/seed.ts` للبيانات الأولية
6. ✅ تحديث `README.md` مع تعليمات PostgreSQL وPrisma

## 📋 الخطوات التالية

### 1. تثبيت الحزم

```bash
pnpm install
```

### 2. إعداد PostgreSQL

#### تثبيت PostgreSQL
- **Windows**: قم بتحميل من [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql`

#### إنشاء قاعدة البيانات

```sql
CREATE DATABASE inventory_db;
CREATE USER inventory_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;
```

### 3. إعداد متغيرات البيئة

أنشئ ملف `.env.local` في جذر المشروع:

```env
# Database Configuration (PostgreSQL)
DATABASE_URL="postgresql://inventory_user:your_password@localhost:5432/inventory_db?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000
AUTH_URL=http://localhost:3000

# Application Configuration
NODE_ENV=development
```

لإنشاء `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. إعداد Prisma

```bash
# توليد Prisma Client
pnpm db:generate

# إنشاء الجداول في قاعدة البيانات
pnpm db:push

# أو استخدام Migrations (موصى به للإنتاج)
pnpm db:migrate

# إدخال البيانات الأولية
pnpm db:seed
```

### 5. تشغيل المشروع

```bash
pnpm dev
```

## 🔄 الفروقات الرئيسية

### Oracle → PostgreSQL

1. **أنواع البيانات**:
   - `NUMBER` → `Int` أو `Decimal`
   - `VARCHAR2` → `String` مع `@db.VarChar(n)`
   - `DATE` → `DateTime`

2. **Sequences & Triggers**:
   - في Oracle: Sequences + Triggers
   - في Prisma: `@default(autoincrement())`

3. **Schema Namespace**:
   - في Oracle: `far3.TABLE_NAME`
   - في Prisma: استخدام `@@map("TABLE_NAME")` للحفاظ على أسماء الجداول

4. **Stored Procedures**:
   - تم تحويل `ADD_INVENTORY_MOVEMENT` procedure إلى منطق TypeScript في `addInventoryMovement`

### Prisma vs Oracle Queries

**قبل (Oracle)**:
```typescript
const result = await executeQuery('SELECT * FROM far3.ITEMS WHERE ITEM_ID = :id', { id });
```

**بعد (Prisma)**:
```typescript
const item = await prisma.item.findUnique({ where: { itemId: id } });
```

## ⚠️ ملاحظات مهمة

1. **أسماء الجداول**: تم الحفاظ على أسماء الجداول الأصلية باستخدام `@@map()`
2. **أسماء الأعمدة**: تم تحويلها من `UPPER_CASE` إلى `camelCase` في Prisma
3. **العلاقات**: تم تعريف جميع العلاقات (Foreign Keys) في Prisma Schema
4. **البيانات**: يمكنك استخدام `pnpm db:seed` لإدخال البيانات الأولية

## 🐛 حل المشاكل

### خطأ: Cannot find module '@prisma/client'
```bash
pnpm db:generate
```

### خطأ: Database connection failed
- تأكد من أن PostgreSQL يعمل
- تحقق من `DATABASE_URL` في `.env.local`
- تأكد من أن قاعدة البيانات موجودة

### خطأ: Table doesn't exist
```bash
pnpm db:push
# أو
pnpm db:migrate
```

## 📚 موارد إضافية

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js with Prisma](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

