import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء إدخال البيانات الأولية...');

  // ===============================================
  // 1. إدخال الأدوار
  // ===============================================
  console.log('📝 إدخال الأدوار...');
  const roles = [
    { name: 'SUPER_ADMIN', description: 'مدير النظام الرئيسي - صلاحيات كاملة على جميع الوحدات' },
    { name: 'ADMIN', description: 'مدير النظام - صلاحيات إدارية شاملة' },
    { name: 'INVENTORY_MANAGER', description: 'مدير المخزون - إدارة الأصناف والتصنيفات والأقسام' },
    { name: 'INVENTORY_USER', description: 'موظف المخزون - عرض وتحديث الأصناف المسؤولة عنها' },
    { name: 'VIEWER', description: 'مستعرض - عرض البيانات والإحصائيات فقط' },
    { name: 'USER', description: 'مستخدم عادي - عرض الأصناف المخصصة له فقط' },
  ];

  const createdRoles: Record<string, number> = {};
  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    createdRoles[role.name] = created.roleId;
  }

  // ===============================================
  // 2. إدخال أنواع الحركات
  // ===============================================
  console.log('📝 إدخال أنواع الحركات...');
  const movementTypes = [
    { typeName: 'إدخال مخزون', typeCode: 'IN', effect: 1, description: 'إضافة كمية جديدة للمخزن' },
    { typeName: 'إخراج مخزون', typeCode: 'OUT', effect: -1, description: 'صرف كمية من المخزن' },
    { typeName: 'مرتجع', typeCode: 'RETURN', effect: 1, description: 'إرجاع كمية للمخزن' },
    { typeName: 'تالف', typeCode: 'DAMAGED', effect: -1, description: 'كمية تالفة تم استبعادها' },
    { typeName: 'جرد', typeCode: 'ADJUSTMENT', effect: 0, description: 'تعديل الكمية بناءً على الجرد الفعلي' },
    { typeName: 'نقل بين أقسام', typeCode: 'TRANSFER', effect: 0, description: 'نقل كمية من قسم لآخر' },
  ];

  for (const mt of movementTypes) {
    await prisma.movementType.upsert({
      where: { typeCode: mt.typeCode },
      update: {},
      create: mt,
    });
  }

  // ===============================================
  // 3. إدخال الأقسام
  // ===============================================
  console.log('📝 إدخال الأقسام...');
  const departments = [
    'قسم تكنولوجيا المعلومات',
    'قسم الموارد البشرية',
    'قسم المالية',
    'تقنية المعلومات',
    'المالية',
    'الموارد البشرية',
    'التسويق',
    'العمليات',
    'خدمة العملاء',
  ];

  const createdDepartments: Record<string, number> = {};
  for (const deptName of departments) {
    const created = await prisma.department.upsert({
      where: { deptName },
      update: {},
      create: { deptName },
    });
    createdDepartments[deptName] = created.deptId;
  }

  // ===============================================
  // 4. إدخال الطوابق
  // ===============================================
  console.log('📝 إدخال الطوابق...');
  const floors = [
    'الطابق الأرضي',
    'الطابق الأول',
    'الطابق الثاني',
    'الطابق الثالث',
  ];

  const createdFloors: Record<string, number> = {};
  for (const floorName of floors) {
    const created = await prisma.floor.upsert({
      where: { floorName },
      update: {},
      create: { floorName },
    });
    createdFloors[floorName] = created.floorId;
  }

  // ===============================================
  // 5. إدخال الرتب
  // ===============================================
  console.log('📝 إدخال الرتب...');
  const ranks = [
    'مدير عام',
    'مدير إدارة',
    'رئيس قسم',
    'موظف أول',
    'موظف',
  ];

  const createdRanks: Record<string, number> = {};
  for (const rankName of ranks) {
    const created = await prisma.rank.upsert({
      where: { rankName },
      update: {},
      create: { rankName },
    });
    createdRanks[rankName] = created.rankId;
  }

  // ===============================================
  // 6. إدخال التصنيفات الرئيسية
  // ===============================================
  console.log('📝 إدخال التصنيفات الرئيسية...');
  const mainCategories = [
    { catName: 'أجهزة حاسوب', description: 'أجهزة حاسوب وملحقاتها' },
    { catName: 'أثاث مكتبي', description: 'أثاث وتجهيزات المكاتب' },
    { catName: 'الشبكات', description: 'معدات الشبكات والاتصالات' },
  ];

  const createdMainCategories: Record<string, number> = {};
  for (const cat of mainCategories) {
    const created = await prisma.mainCategory.upsert({
      where: { catName: cat.catName },
      update: {},
      create: cat,
    });
    createdMainCategories[cat.catName] = created.catId;
  }

  // ===============================================
  // 7. إدخال التصنيفات الفرعية
  // ===============================================
  console.log('📝 إدخال التصنيفات الفرعية...');
  const subCategories = [
    { subCatName: 'حاسوب محمول', catName: 'أجهزة حاسوب' },
    { subCatName: 'حاسوب مكتبي', catName: 'أجهزة حاسوب' },
    { subCatName: 'مكاتب', catName: 'أثاث مكتبي' },
  ];

  const createdSubCategories: Record<string, number> = {};
  for (const subCat of subCategories) {
    const catId = createdMainCategories[subCat.catName];
    const created = await prisma.subCategory.upsert({
      where: {
        subCatName_catId: {
          subCatName: subCat.subCatName,
          catId: catId,
        },
      },
      update: {},
      create: {
        subCatName: subCat.subCatName,
        catId: catId,
      },
    });
    createdSubCategories[subCat.subCatName] = created.subCatId;
  }

  // ===============================================
  // 8. إدخال أنواع الأصناف
  // ===============================================
  console.log('📝 إدخال أنواع الأصناف...');
  const itemTypes = [
    { itemTypeName: 'Dell Desktop', subCatName: 'حاسوب مكتبي' },
    { itemTypeName: 'HP Laptop', subCatName: 'حاسوب محمول' },
    { itemTypeName: 'Canon Printer', subCatName: 'مكاتب' },
  ];

  for (const it of itemTypes) {
    const subCatId = createdSubCategories[it.subCatName];
    await prisma.itemType.upsert({
      where: { itemTypeName: it.itemTypeName },
      update: {},
      create: {
        itemTypeName: it.itemTypeName,
        subCatId: subCatId,
      },
    });
  }

  // ===============================================
  // 9. إدخال المستخدمين
  // ===============================================
  console.log('📝 إدخال المستخدمين...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [
    {
      username: 'superadmin',
      email: 'superadmin@hospital.com',
      password: hashedPassword,
      roleName: 'SUPER_ADMIN',
      fullName: 'محمد أحمد',
      phone: '01000000001',
    },
    {
      username: 'tah',
      email: 'tah@gmail.com',
      password: hashedPassword,
      roleName: 'SUPER_ADMIN',
      fullName: 'طه محمود',
      phone: '01000000002',
    },
    {
      username: 'admin',
      email: 'admin@hospital.com',
      password: hashedPassword,
      roleName: 'ADMIN',
      fullName: 'أحمد محمد',
      phone: '01100000001',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        email: user.email,
        password: user.password,
        roleId: createdRoles[user.roleName],
        fullName: user.fullName,
        phone: user.phone,
        isActive: true,
      },
    });
  }

  // ===============================================
  // 10. إدخال صلاحيات الأدوار
  // ===============================================
  console.log('📝 إدخال صلاحيات الأدوار...');

  // SUPER_ADMIN - كل الصلاحيات
  await prisma.rolePermission.upsert({
    where: {
      roleId_subject_action_fieldName: {
        roleId: createdRoles['SUPER_ADMIN'],
        subject: 'ALL',
        action: 'MANAGE',
        fieldName: '',
      },
    },
    update: {},
    create: {
      roleId: createdRoles['SUPER_ADMIN'],
      subject: 'ALL',
      action: 'MANAGE',
      fieldName: '',
    },
  });

  // ADMIN - صلاحيات إدارية شاملة
  const adminPermissions = [
    { subject: 'ITEMS', action: 'CREATE' },
    { subject: 'ITEMS', action: 'READ' },
    { subject: 'ITEMS', action: 'UPDATE' },
    { subject: 'ITEMS', action: 'DELETE' },
    { subject: 'USERS', action: 'CREATE' },
    { subject: 'USERS', action: 'READ' },
    { subject: 'USERS', action: 'UPDATE' },
    { subject: 'USERS', action: 'DELETE' },
    { subject: 'CATEGORIES', action: 'CREATE' },
    { subject: 'CATEGORIES', action: 'READ' },
    { subject: 'CATEGORIES', action: 'UPDATE' },
    { subject: 'CATEGORIES', action: 'DELETE' },
    { subject: 'DEPARTMENTS', action: 'CREATE' },
    { subject: 'DEPARTMENTS', action: 'READ' },
    { subject: 'DEPARTMENTS', action: 'UPDATE' },
    { subject: 'DEPARTMENTS', action: 'DELETE' },
    { subject: 'RANKS', action: 'CREATE' },
    { subject: 'RANKS', action: 'READ' },
    { subject: 'RANKS', action: 'UPDATE' },
    { subject: 'RANKS', action: 'DELETE' },
    { subject: 'FLOORS', action: 'CREATE' },
    { subject: 'FLOORS', action: 'READ' },
    { subject: 'FLOORS', action: 'UPDATE' },
    { subject: 'FLOORS', action: 'DELETE' },
    { subject: 'STATISTICS', action: 'READ' },
    { subject: 'DASHBOARD', action: 'READ' },
  ];

  for (const perm of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_subject_action_fieldName: {
          roleId: createdRoles['ADMIN'],
          subject: perm.subject,
          action: perm.action,
          fieldName: '',
        },
      },
      update: {},
      create: {
        roleId: createdRoles['ADMIN'],
        subject: perm.subject,
        action: perm.action,
        fieldName: '',
      },
    });
  }

  console.log('✅ تم إدخال البيانات الأولية بنجاح!');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في إدخال البيانات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

