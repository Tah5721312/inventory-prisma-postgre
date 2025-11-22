import { prisma } from '@/lib/database';
import { Item, User, MainCategory, SubCategory, ItemType, Rank, Floor, InventoryMovement, MovementType } from '@/lib/types';
import type { Prisma } from '@prisma/client';

/**
 * جلب جميع الأصناف مع إمكانية الفلترة
 */
export async function getAllItems(filters?: {
  catId?: number;
  subCatId?: number;
  itemTypeId?: number;
  userId?: number | null;
  deptId?: number;
  serial?: string;
  itemName?: string;
  ip?: string;
  compName?: string;
}) {
  const where: any = {};

  if (filters?.catId) {
    where.subCategory = { mainCategory: { catId: filters.catId } };
  }
  if (filters?.subCatId) {
    where.subCatId = filters.subCatId;
  }
  if (filters?.itemTypeId) {
    where.itemTypeId = filters.itemTypeId;
  }
  // Handle userId filter - null means warehouse (no user assigned)
  if (filters?.userId !== undefined) {
    if (filters.userId === null) {
      // Filter for warehouse items (userId is null)
      where.userId = null;
    } else if (filters.userId === 0 || filters.userId === -1) {
      // Also treat 0 and -1 as warehouse
      where.userId = null;
    } else {
      // Filter for specific user
      where.userId = filters.userId;
    }
  }
  if (filters?.deptId) {
    where.deptId = filters.deptId;
  }
  if (filters?.serial) {
    where.serial = { contains: filters.serial, mode: 'insensitive' };
  }
  if (filters?.itemName) {
    where.itemName = { contains: filters.itemName, mode: 'insensitive' };
  }
  if (filters?.ip) {
    where.ip = { contains: filters.ip };
  }
  if (filters?.compName) {
    where.compName = { contains: filters.compName, mode: 'insensitive' };
  }

  const items = await prisma.item.findMany({
    where,
    include: {
      user: {
        select: {
          userId: true,
          fullName: true,
        },
      },
      department: {
        select: {
          deptId: true,
          deptName: true,
        },
      },
      floor: {
        select: {
          floorId: true,
          floorName: true,
        },
      },
      subCategory: {
        select: {
          subCatId: true,
          subCatName: true,
          mainCategory: {
            select: {
              catId: true,
              catName: true,
            },
          },
        },
      },
      itemType: {
        select: {
          itemTypeId: true,
          itemTypeName: true,
        },
      },
    },
    orderBy: {
      itemName: 'asc',
    },
  });

  // Transform to match the expected Item interface
  // Convert null to undefined to match Item interface (which uses ?: for optional fields)
  return items.map((item: Prisma.ItemGetPayload<{
    include: {
      user: { select: { userId: true; fullName: true } };
      department: { select: { deptId: true; deptName: true } };
      floor: { select: { floorId: true; floorName: true } };
      subCategory: { select: { subCatId: true; subCatName: true; mainCategory: { select: { catId: true; catName: true } } } };
      itemType: { select: { itemTypeId: true; itemTypeName: true } };
    };
  }>) => ({
    ITEM_ID: item.itemId,
    ITEM_NAME: item.itemName,
    SERIAL: item.serial ?? undefined,
    KIND: item.kind ?? undefined,
    SITUATION: item.situation ?? undefined,
    PROPERTIES: item.properties ?? undefined,
    HDD: item.hdd ?? undefined,
    RAM: item.ram ?? undefined,
    IP: item.ip ?? undefined,
    COMP_NAME: item.compName ?? undefined,
    LOCK_NUM: item.lockNum ?? undefined,
    QUANTITY: item.quantity ?? undefined,
    MIN_QUANTITY: item.minQuantity ?? undefined,
    UNIT: item.unit ?? undefined,
    USER_ID: item.userId ?? undefined,
    ASSIGNED_USER: item.user?.fullName ?? undefined,
    DEPT_ID: item.deptId ?? undefined,
    DEPT_NAME: item.department?.deptName ?? undefined,
    FLOOR_ID: item.floorId ?? undefined,
    FLOOR_NAME: item.floor?.floorName ?? undefined,
    SUB_CAT_ID: item.subCatId ?? undefined,
    SUB_CAT_NAME: item.subCategory?.subCatName ?? undefined,
    CAT_ID: item.subCategory?.mainCategory?.catId ?? undefined,
    MAIN_CATEGORY_NAME: item.subCategory?.mainCategory?.catName ?? undefined,
    ITEM_TYPE_ID: item.itemTypeId ?? undefined,
    ITEM_TYPE_NAME: item.itemType?.itemTypeName ?? undefined,
    CREATED_AT: item.createdAt,
    UPDATED_AT: item.updatedAt,
  }));
}

/**
 * جلب صنف by ID
 */
export async function getItemById(id: number) {
  const item = await prisma.item.findUnique({
    where: { itemId: id },
    include: {
      user: {
        select: {
          userId: true,
          fullName: true,
        },
      },
      department: {
        select: {
          deptId: true,
          deptName: true,
        },
      },
      floor: {
        select: {
          floorId: true,
          floorName: true,
        },
      },
      subCategory: {
        select: {
          subCatId: true,
          subCatName: true,
          mainCategory: {
            select: {
              catId: true,
              catName: true,
            },
          },
        },
      },
      itemType: {
        select: {
          itemTypeId: true,
          itemTypeName: true,
        },
      },
    },
  });

  if (!item) return null;

  return {
    ITEM_ID: item.itemId,
    ITEM_NAME: item.itemName,
    SERIAL: item.serial,
    KIND: item.kind,
    SITUATION: item.situation,
    PROPERTIES: item.properties,
    HDD: item.hdd,
    RAM: item.ram,
    IP: item.ip,
    COMP_NAME: item.compName,
    LOCK_NUM: item.lockNum,
    QUANTITY: item.quantity,
    MIN_QUANTITY: item.minQuantity,
    UNIT: item.unit,
    USER_ID: item.userId,
    ASSIGNED_USER: item.user?.fullName,
    DEPT_ID: item.deptId,
    DEPT_NAME: item.department?.deptName,
    FLOOR_ID: item.floorId,
    FLOOR_NAME: item.floor?.floorName,
    SUB_CAT_ID: item.subCatId,
    SUB_CAT_NAME: item.subCategory?.subCatName,
    CAT_ID: item.subCategory?.mainCategory?.catId,
    MAIN_CATEGORY_NAME: item.subCategory?.mainCategory?.catName,
    ITEM_TYPE_ID: item.itemTypeId,
    ITEM_TYPE_NAME: item.itemType?.itemTypeName,
    CREATED_AT: item.createdAt,
    UPDATED_AT: item.updatedAt,
  };
}

/**
 * إضافة صنف جديد
 */
export async function createItem(item: Omit<Item, 'ITEM_ID' | 'CREATED_AT' | 'UPDATED_AT' | 'ASSIGNED_USER' | 'DEPT_NAME' | 'FLOOR_NAME' | 'SUB_CAT_NAME' | 'MAIN_CATEGORY_NAME' | 'ITEM_TYPE_NAME' | 'CAT_ID'>) {
  const newItem = await prisma.item.create({
    data: {
      itemName: item.ITEM_NAME,
      subCatId: item.SUB_CAT_ID || null,
      itemTypeId: item.ITEM_TYPE_ID || null,
      lockNum: item.LOCK_NUM || null,
      serial: item.SERIAL || null,
      kind: item.KIND || null,
      situation: item.SITUATION || null,
      properties: item.PROPERTIES || null,
      hdd: item.HDD || null,
      ram: item.RAM || null,
      ip: item.IP || null,
      compName: item.COMP_NAME || null,
      userId: item.USER_ID !== undefined ? item.USER_ID : null,
      deptId: item.DEPT_ID || null,
      floorId: item.FLOOR_ID || null,
      quantity: item.QUANTITY ?? 0,
      minQuantity: item.MIN_QUANTITY ?? 0,
      unit: item.UNIT || 'قطعة',
    },
  });

  return newItem.itemId;
}

/**
 * تحديث صنف
 */
export async function updateItem(id: number, item: Partial<Omit<Item, 'ITEM_ID' | 'CREATED_AT' | 'UPDATED_AT' | 'ASSIGNED_USER' | 'DEPT_NAME' | 'FLOOR_NAME' | 'SUB_CAT_NAME' | 'MAIN_CATEGORY_NAME' | 'ITEM_TYPE_NAME' | 'CAT_ID'>>) {
  const updateData: any = {};

  const fieldMap: Record<string, string> = {
    ITEM_NAME: 'itemName',
    SERIAL: 'serial',
    KIND: 'kind',
    SITUATION: 'situation',
    PROPERTIES: 'properties',
    HDD: 'hdd',
    RAM: 'ram',
    IP: 'ip',
    COMP_NAME: 'compName',
    LOCK_NUM: 'lockNum',
    USER_ID: 'userId',
    DEPT_ID: 'deptId',
    FLOOR_ID: 'floorId',
    SUB_CAT_ID: 'subCatId',
    ITEM_TYPE_ID: 'itemTypeId',
    QUANTITY: 'quantity',
    MIN_QUANTITY: 'minQuantity',
    UNIT: 'unit',
  };

  Object.entries(item).forEach(([key, value]) => {
    if (fieldMap[key] && value !== undefined) {
      updateData[fieldMap[key]] = value === null ? null : value;
    }
  });

  if (Object.keys(updateData).length === 0) {
    return 0;
  }

  await prisma.item.update({
    where: { itemId: id },
    data: updateData,
  });

  return 1;
}

/**
 * حذف صنف
 */
export async function deleteItem(id: number) {
  await prisma.item.delete({
    where: { itemId: id },
  });
  return 1;
}

export async function getMovementTypes() {
  const types = await prisma.movementType.findMany({
    where: { isActive: true },
    orderBy: { movementTypeId: 'asc' },
  });

  return types.map((type) => ({
    MOVEMENT_TYPE_ID: type.movementTypeId,
    TYPE_NAME: type.typeName,
    TYPE_CODE: type.typeCode,
    EFFECT: type.effect,
    DESCRIPTION: type.description,
    IS_ACTIVE: type.isActive ? 1 : 0,
  }));
}

export async function getInventoryMovements(filters?: {
  itemId?: number;
  movementTypeId?: number;
  limit?: number;
}) {
  const where: any = {};

  if (filters?.itemId) {
    where.itemId = filters.itemId;
  }

  if (filters?.movementTypeId) {
    where.movementTypeId = filters.movementTypeId;
  }

  const movements = await prisma.inventoryMovement.findMany({
    where,
    include: {
      item: {
        select: {
          itemId: true,
          itemName: true,
        },
      },
      movementType: {
        select: {
          movementTypeId: true,
          typeName: true,
          typeCode: true,
        },
      },
      user: {
        select: {
          userId: true,
          fullName: true,
        },
      },
      fromDepartment: {
        select: {
          deptId: true,
          deptName: true,
        },
      },
      toDepartment: {
        select: {
          deptId: true,
          deptName: true,
        },
      },
      fromFloor: {
        select: {
          floorId: true,
          floorName: true,
        },
      },
      toFloor: {
        select: {
          floorId: true,
          floorName: true,
        },
      },
    },
    orderBy: [
      { movementDate: 'desc' },
      { createdAt: 'desc' },
    ],
    take: filters?.limit ? Math.min(Math.max(filters.limit, 1), 500) : undefined,
  });

  return movements.map((movement) => ({
    MOVEMENT_ID: movement.movementId,
    ITEM_ID: movement.itemId,
    ITEM_NAME: movement.item.itemName,
    MOVEMENT_TYPE_ID: movement.movementTypeId,
    MOVEMENT_TYPE: movement.movementType.typeName,
    TYPE_CODE: movement.movementType.typeCode,
    QUANTITY: movement.quantity,
    PREVIOUS_QTY: movement.previousQty,
    NEW_QTY: movement.newQty,
    MOVEMENT_DATE: movement.movementDate,
    USER_ID: movement.userId,
    USER_NAME: movement.user.fullName,
    USER_FULL_NAME: movement.user.fullName,
    FROM_DEPT_ID: movement.fromDeptId,
    TO_DEPT_ID: movement.toDeptId,
    FROM_DEPT: movement.fromDepartment?.deptName,
    TO_DEPT: movement.toDepartment?.deptName,
    FROM_FLOOR_ID: movement.fromFloorId,
    TO_FLOOR_ID: movement.toFloorId,
    FROM_FLOOR: movement.fromFloor?.floorName,
    TO_FLOOR: movement.toFloor?.floorName,
    REFERENCE_NO: movement.referenceNo,
    NOTES: movement.notes,
    CREATED_AT: movement.createdAt,
  }));
}

export async function addInventoryMovement(params: {
  itemId: number;
  movementTypeId: number;
  unit?: string | null;
  quantity: number;
  userId: number;
  referenceNo?: string | null;
  notes?: string | null;
  fromDeptId?: number | null;
  toDeptId?: number | null;
  fromFloorId?: number | null;
  toFloorId?: number | null;
}) {
  if (!params.itemId || !params.movementTypeId || !params.quantity || !params.userId) {
    throw new Error('معرف الصنف ونوع الحركة والكمية والمستخدم مطلوبة');
  }

  if (params.quantity <= 0) {
    throw new Error('الكمية يجب أن تكون أكبر من صفر');
  }

  // تحديث UNIT للصنف إذا تم تمريره
  if (params.unit && params.unit.trim()) {
    try {
      await prisma.item.update({
        where: { itemId: params.itemId },
        data: { unit: params.unit.trim() },
      });
    } catch (error) {
      console.error('فشل تحديث UNIT للصنف:', error);
    }
  }

  // جلب الكمية الحالية ونوع الحركة
  const [item, movementType] = await Promise.all([
    prisma.item.findUnique({ where: { itemId: params.itemId } }),
    prisma.movementType.findUnique({ where: { movementTypeId: params.movementTypeId } }),
  ]);

  if (!item || !movementType) {
    throw new Error('الصنف أو نوع الحركة غير موجود');
  }

  const currentQty = item.quantity;
  let newQty: number;

  // حساب الكمية الجديدة
  if (movementType.typeCode === 'ADJUSTMENT') {
    newQty = params.quantity;
  } else {
    newQty = currentQty + (params.quantity * movementType.effect);
  }

  if (newQty < 0) {
    throw new Error('الكمية المتاحة غير كافية للصرف');
  }

  // إنشاء الحركة
  const movement = await prisma.inventoryMovement.create({
    data: {
      itemId: params.itemId,
      movementTypeId: params.movementTypeId,
      quantity: params.quantity,
      previousQty: currentQty,
      newQty: newQty,
      userId: params.userId,
      referenceNo: params.referenceNo || null,
      notes: params.notes || null,
      fromDeptId: params.fromDeptId || null,
      toDeptId: params.toDeptId || null,
      fromFloorId: params.fromFloorId || null,
      toFloorId: params.toFloorId || null,
    },
  });

  // تحديث كمية الصنف
  await prisma.item.update({
    where: { itemId: params.itemId },
    data: { quantity: newQty },
  });

  return {
    movementId: movement.movementId,
    item: await getItemById(params.itemId),
  };
}

export async function deleteInventoryMovement(movementId: number) {
  // جلب بيانات الحركة
  const movement = await prisma.inventoryMovement.findUnique({
    where: { movementId },
    include: {
      movementType: true,
    },
  });

  if (!movement) {
    throw new Error('الحركة غير موجودة');
  }

  const itemId = movement.itemId;

  // حذف الحركة
  await prisma.inventoryMovement.delete({
    where: { movementId },
  });

  // إعادة حساب الكمية من جميع الحركات المتبقية
  const remainingMovements = await prisma.inventoryMovement.findMany({
    where: { itemId },
    include: {
      movementType: true,
    },
    orderBy: [
      { movementDate: 'asc' },
      { movementId: 'asc' },
    ],
  });

  // جلب الكمية الأولية
  const firstMovement = remainingMovements[0];
  let currentQty = firstMovement ? firstMovement.previousQty || 0 : 0;

  // إذا لم تكن هناك حركات متبقية، نستخدم الكمية الحالية
  if (remainingMovements.length === 0) {
    const item = await prisma.item.findUnique({ where: { itemId } });
    currentQty = item?.quantity || 0;
  }

  // إعادة حساب الكمية
  for (const mov of remainingMovements) {
    if (mov.movementType.typeCode === 'ADJUSTMENT') {
      currentQty = mov.quantity;
    } else {
      currentQty = currentQty + (mov.quantity * mov.movementType.effect);
    }
  }

  // تحديث الكمية في جدول الأصناف
  await prisma.item.update({
    where: { itemId },
    data: { quantity: currentQty },
  });

  return getItemById(itemId);
}

/**
 * جلب جميع المستخدمين
 */
export async function getAllUsers() {
  const users = await prisma.user.findMany({
    include: {
      role: {
        select: {
          name: true,
        },
      },
      department: {
        select: {
          deptName: true,
        },
      },
      rank: {
        select: {
          rankName: true,
        },
      },
      floor: {
        select: {
          floorName: true,
        },
      },
    },
    orderBy: {
      fullName: 'asc',
    },
  });

  return users.map((user) => ({
    USER_ID: user.userId,
    USERNAME: user.username,
    EMAIL: user.email,
    FULL_NAME: user.fullName,
    PHONE: user.phone,
    IS_ACTIVE: user.isActive ? 1 : 0,
    ROLE_NAME: user.role.name,
    DEPT_NAME: user.department?.deptName,
    RANK_NAME: user.rank?.rankName,
    FLOOR_NAME: user.floor?.floorName,
    ROLE_ID: user.roleId,
    DEPT_ID: user.deptId,
    RANK_ID: user.rankId,
    FLOOR_ID: user.floorId,
  }));
}

export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({
    where: { userId: id },
    include: {
      role: {
        select: {
          name: true,
        },
      },
      department: {
        select: {
          deptName: true,
        },
      },
      rank: {
        select: {
          rankName: true,
        },
      },
      floor: {
        select: {
          floorName: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    USER_ID: user.userId,
    USERNAME: user.username,
    EMAIL: user.email,
    FULL_NAME: user.fullName,
    PHONE: user.phone,
    IS_ACTIVE: user.isActive ? 1 : 0,
    ROLE_NAME: user.role.name,
    DEPT_NAME: user.department?.deptName,
    RANK_NAME: user.rank?.rankName,
    FLOOR_NAME: user.floor?.floorName,
    ROLE_ID: user.roleId,
    DEPT_ID: user.deptId,
    RANK_ID: user.rankId,
    FLOOR_ID: user.floorId,
  };
}

export async function createUser(user: Omit<User, 'USER_ID' | 'ROLE_NAME' | 'DEPT_NAME' | 'RANK_NAME' | 'FLOOR_NAME'> & { PASSWORD?: string }) {
  const newUser = await prisma.user.create({
    data: {
      username: user.USERNAME,
      email: user.EMAIL,
      password: user.PASSWORD || '',
      fullName: user.FULL_NAME,
      phone: user.PHONE,
      isActive: user.IS_ACTIVE === 1,
      roleId: user.ROLE_ID!,
      deptId: user.DEPT_ID || null,
      rankId: user.RANK_ID || null,
      floorId: user.FLOOR_ID || null,
    },
  });

  return newUser.userId;
}

export async function updateUser(id: number, user: Partial<Omit<User, 'USER_ID' | 'ROLE_NAME' | 'DEPT_NAME' | 'RANK_NAME' | 'FLOOR_NAME'>>) {
  const updateData: any = {};

  const fieldMap: Record<string, string> = {
    USERNAME: 'username',
    EMAIL: 'email',
    FULL_NAME: 'fullName',
    PHONE: 'phone',
    IS_ACTIVE: 'isActive',
    ROLE_ID: 'roleId',
    DEPT_ID: 'deptId',
    RANK_ID: 'rankId',
    FLOOR_ID: 'floorId',
  };

  Object.entries(user).forEach(([key, value]) => {
    if (fieldMap[key] && value !== undefined) {
      if (key === 'IS_ACTIVE') {
        updateData[fieldMap[key]] = value === 1;
      } else {
        updateData[fieldMap[key]] = value === null ? null : value;
      }
    }
  });

  if (Object.keys(updateData).length === 0) {
    return 0;
  }

  await prisma.user.update({
    where: { userId: id },
    data: updateData,
  });

  return 1;
}

export async function deleteUser(id: number) {
  await prisma.user.delete({
    where: { userId: id },
  });
  return 1;
}

// ====================
// Sub_Categories CRUD operations
// ====================

export async function getAllSubCategories() {
  const subCategories = await prisma.subCategory.findMany({
    include: {
      mainCategory: {
        select: {
          catId: true,
          catName: true,
        },
      },
    },
    orderBy: {
      subCatName: 'asc',
    },
  });

  return subCategories.map((sc: Prisma.SubCategoryGetPayload<{
    include: { mainCategory: { select: { catId: true; catName: true } } };
  }>) => ({
    SUB_CAT_ID: sc.subCatId,
    SUB_CAT_NAME: sc.subCatName,
    CAT_ID: sc.catId,
    DESCRIPTION: sc.description,
    CAT_NAME: sc.mainCategory.catName,
  }));
}

export async function getSubCategoryById(id: number) {
  const subCategory = await prisma.subCategory.findUnique({
    where: { subCatId: id },
    include: {
      mainCategory: {
        select: {
          catId: true,
          catName: true,
        },
      },
    },
  });

  if (!subCategory) return null;

  return {
    SUB_CAT_ID: subCategory.subCatId,
    SUB_CAT_NAME: subCategory.subCatName,
    CAT_ID: subCategory.catId,
    DESCRIPTION: subCategory.description,
    CAT_NAME: subCategory.mainCategory.catName,
  };
}

export async function createSubCategory(subCategory: {
  SUB_CAT_NAME: string;
  CAT_ID: number;
  DESCRIPTION?: string;
}) {
  // التحقق من وجود تصنيف فرعي بنفس الاسم في نفس التصنيف الرئيسي
  const existing = await prisma.subCategory.findFirst({
    where: {
      subCatName: { equals: subCategory.SUB_CAT_NAME.trim(), mode: 'insensitive' },
      catId: subCategory.CAT_ID,
    },
  });

  if (existing) {
    throw new Error('يوجد تصنيف فرعي بنفس الاسم في هذا التصنيف الرئيسي بالفعل');
  }

  const newSubCategory = await prisma.subCategory.create({
    data: {
      subCatName: subCategory.SUB_CAT_NAME.trim(),
      catId: subCategory.CAT_ID,
      description: subCategory.DESCRIPTION || null,
    },
  });

  return newSubCategory.subCatId;
}

export async function updateSubCategory(id: number, subCategory: {
  SUB_CAT_NAME?: string;
  CAT_ID?: number;
  DESCRIPTION?: string;
}) {
  // الحصول على البيانات الحالية
  const current = await prisma.subCategory.findUnique({
    where: { subCatId: id },
  });

  if (!current) {
    throw new Error('التصنيف الفرعي غير موجود');
  }

  const catId = subCategory.CAT_ID ?? current.catId;

  // التحقق من وجود تصنيف فرعي آخر بنفس الاسم
  if (subCategory.SUB_CAT_NAME !== undefined) {
    const existing = await prisma.subCategory.findFirst({
      where: {
        subCatName: { equals: subCategory.SUB_CAT_NAME.trim(), mode: 'insensitive' },
        catId: catId,
        subCatId: { not: id },
      },
    });

    if (existing) {
      throw new Error('يوجد تصنيف فرعي آخر بنفس الاسم في هذا التصنيف الرئيسي بالفعل');
    }
  }

  const updateData: any = {};
  if (subCategory.SUB_CAT_NAME !== undefined) {
    updateData.subCatName = subCategory.SUB_CAT_NAME.trim();
  }
  if (subCategory.CAT_ID !== undefined) {
    updateData.catId = subCategory.CAT_ID;
  }
  if (subCategory.DESCRIPTION !== undefined) {
    updateData.description = subCategory.DESCRIPTION;
  }

  if (Object.keys(updateData).length === 0) {
    return 0;
  }

  await prisma.subCategory.update({
    where: { subCatId: id },
    data: updateData,
  });

  return 1;
}

export async function deleteSubCategory(id: number) {
  await prisma.subCategory.delete({
    where: { subCatId: id },
  });
  return 1;
}

// ====================
// Main_Categories CRUD operations
// ====================

export async function getAllMainCategories() {
  const categories = await prisma.mainCategory.findMany({
    orderBy: {
      catName: 'asc',
    },
  });

  return categories.map((cat) => ({
    CAT_ID: cat.catId,
    CAT_NAME: cat.catName,
    DESCRIPTION: cat.description,
  }));
}

export async function getMainCategoryById(id: number) {
  const category = await prisma.mainCategory.findUnique({
    where: { catId: id },
  });

  if (!category) return null;

  return {
    CAT_ID: category.catId,
    CAT_NAME: category.catName,
    DESCRIPTION: category.description,
  };
}

export async function createMainCategory(mainCategory: {
  CAT_NAME: string;
  DESCRIPTION: string;
}) {
  // التحقق من وجود تصنيف رئيسي بنفس الاسم
  const existing = await prisma.mainCategory.findFirst({
    where: {
      catName: { equals: mainCategory.CAT_NAME.trim(), mode: 'insensitive' },
    },
  });

  if (existing) {
    throw new Error('يوجد تصنيف رئيسي بنفس الاسم بالفعل');
  }

  const newCategory = await prisma.mainCategory.create({
    data: {
      catName: mainCategory.CAT_NAME.trim(),
      description: mainCategory.DESCRIPTION,
    },
  });

  return newCategory.catId;
}

export async function updateMainCategory(id: number, mainCategory: {
  CAT_NAME?: string;
  DESCRIPTION?: string;
}) {
  // التحقق من وجود تصنيف رئيسي آخر بنفس الاسم
  if (mainCategory.CAT_NAME !== undefined) {
    const existing = await prisma.mainCategory.findFirst({
      where: {
        catName: { equals: mainCategory.CAT_NAME.trim(), mode: 'insensitive' },
        catId: { not: id },
      },
    });

    if (existing) {
      throw new Error('يوجد تصنيف رئيسي آخر بنفس الاسم بالفعل');
    }
  }

  const updateData: any = {};
  if (mainCategory.CAT_NAME !== undefined) {
    updateData.catName = mainCategory.CAT_NAME.trim();
  }
  if (mainCategory.DESCRIPTION !== undefined) {
    updateData.description = mainCategory.DESCRIPTION;
  }

  if (Object.keys(updateData).length === 0) {
    return 0;
  }

  await prisma.mainCategory.update({
    where: { catId: id },
    data: updateData,
  });

  return 1;
}

export async function deleteMainCategory(id: number) {
  await prisma.mainCategory.delete({
    where: { catId: id },
  });
  return 1;
}

// ====================
// ITEM_TYPES CRUD operations
// ====================

export async function getAllItemTypes() {
  const itemTypes = await prisma.itemType.findMany({
    orderBy: {
      itemTypeName: 'asc',
    },
  });

  return itemTypes.map((it) => ({
    ITEM_TYPE_ID: it.itemTypeId,
    ITEM_TYPE_NAME: it.itemTypeName,
    SUB_CAT_ID: it.subCatId,
  }));
}

export async function getItemTypeById(id: number) {
  const itemType = await prisma.itemType.findUnique({
    where: { itemTypeId: id },
  });

  if (!itemType) return null;

  return {
    ITEM_TYPE_ID: itemType.itemTypeId,
    ITEM_TYPE_NAME: itemType.itemTypeName,
    SUB_CAT_ID: itemType.subCatId,
  };
}

export async function createItemType(itemType: {
  ITEM_TYPE_NAME: string;
  SUB_CAT_ID: number;
}) {
  // التحقق من وجود نوع صنف بنفس الاسم في نفس التصنيف الفرعي
  const existing = await prisma.itemType.findFirst({
    where: {
      itemTypeName: { equals: itemType.ITEM_TYPE_NAME.trim(), mode: 'insensitive' },
      subCatId: itemType.SUB_CAT_ID,
    },
  });

  if (existing) {
    throw new Error('يوجد نوع صنف بنفس الاسم في هذا التصنيف الفرعي بالفعل');
  }

  const newItemType = await prisma.itemType.create({
    data: {
      itemTypeName: itemType.ITEM_TYPE_NAME.trim(),
      subCatId: itemType.SUB_CAT_ID,
    },
  });

  return newItemType.itemTypeId;
}

export async function updateItemType(id: number, itemType: {
  ITEM_TYPE_NAME?: string;
  SUB_CAT_ID?: number;
}) {
  // الحصول على البيانات الحالية
  const current = await prisma.itemType.findUnique({
    where: { itemTypeId: id },
  });

  if (!current) {
    throw new Error('نوع الصنف غير موجود');
  }

  const subCatId = itemType.SUB_CAT_ID ?? current.subCatId;

  // التحقق من وجود نوع صنف آخر بنفس الاسم
  if (itemType.ITEM_TYPE_NAME !== undefined) {
    const existing = await prisma.itemType.findFirst({
      where: {
        itemTypeName: { equals: itemType.ITEM_TYPE_NAME.trim(), mode: 'insensitive' },
        subCatId: subCatId,
        itemTypeId: { not: id },
      },
    });

    if (existing) {
      throw new Error('يوجد نوع صنف آخر بنفس الاسم في هذا التصنيف الفرعي بالفعل');
    }
  }

  const updateData: any = {};
  if (itemType.ITEM_TYPE_NAME !== undefined) {
    updateData.itemTypeName = itemType.ITEM_TYPE_NAME.trim();
  }
  if (itemType.SUB_CAT_ID !== undefined) {
    updateData.subCatId = itemType.SUB_CAT_ID;
  }

  if (Object.keys(updateData).length === 0) {
    return 0;
  }

  await prisma.itemType.update({
    where: { itemTypeId: id },
    data: updateData,
  });

  return 1;
}

export async function deleteItemType(id: number) {
  await prisma.itemType.delete({
    where: { itemTypeId: id },
  });
  return 1;
}

// ====================
// Departments CRUD operations
// ====================

export async function getAllDepartments() {
  const departments = await prisma.department.findMany({
    orderBy: {
      deptName: 'asc',
    },
  });

  return departments.map((dept) => ({
    DEPT_ID: dept.deptId,
    DEPT_NAME: dept.deptName,
  }));
}

export async function getDepartmentById(id: number) {
  const department = await prisma.department.findUnique({
    where: { deptId: id },
  });

  if (!department) return null;

  return {
    DEPT_ID: department.deptId,
    DEPT_NAME: department.deptName,
  };
}

export async function createDepartment(department: { DEPT_NAME: string }) {
  // التحقق من وجود قسم بنفس الاسم
  const existing = await prisma.department.findFirst({
    where: {
      deptName: { equals: department.DEPT_NAME.trim(), mode: 'insensitive' },
    },
  });

  if (existing) {
    throw new Error('يوجد قسم بنفس الاسم بالفعل');
  }

  const newDepartment = await prisma.department.create({
    data: {
      deptName: department.DEPT_NAME.trim(),
    },
  });

  return newDepartment.deptId;
}

export async function updateDepartment(id: number, department: { DEPT_NAME?: string }) {
  if (department.DEPT_NAME !== undefined) {
    // التحقق من وجود قسم آخر بنفس الاسم
    const existing = await prisma.department.findFirst({
      where: {
        deptName: { equals: department.DEPT_NAME.trim(), mode: 'insensitive' },
        deptId: { not: id },
      },
    });

    if (existing) {
      throw new Error('يوجد قسم آخر بنفس الاسم بالفعل');
    }

    await prisma.department.update({
      where: { deptId: id },
      data: { deptName: department.DEPT_NAME.trim() },
    });

    return 1;
  }

  return 0;
}

export async function deleteDepartment(id: number) {
  await prisma.department.delete({
    where: { deptId: id },
  });
  return 1;
}

// ====================
// Ranks CRUD operations
// ====================

export async function getAllRanks() {
  const ranks = await prisma.rank.findMany({
    orderBy: {
      rankName: 'asc',
    },
  });

  return ranks.map((rank) => ({
    RANK_ID: rank.rankId,
    RANK_NAME: rank.rankName,
  }));
}

export async function getRankById(id: number) {
  const rank = await prisma.rank.findUnique({
    where: { rankId: id },
  });

  if (!rank) return null;

  return {
    RANK_ID: rank.rankId,
    RANK_NAME: rank.rankName,
  };
}

export async function createRank(rank: { RANK_NAME: string }) {
  // التحقق من وجود Rank بنفس الاسم
  const existing = await prisma.rank.findFirst({
    where: {
      rankName: { equals: rank.RANK_NAME.trim(), mode: 'insensitive' },
    },
  });

  if (existing) {
    throw new Error('يوجد رتبة بنفس الاسم بالفعل');
  }

  const newRank = await prisma.rank.create({
    data: {
      rankName: rank.RANK_NAME.trim(),
    },
  });

  return newRank.rankId;
}

export async function updateRank(id: number, rank: { RANK_NAME?: string }) {
  if (rank.RANK_NAME !== undefined) {
    // التحقق من وجود Rank آخر بنفس الاسم
    const existing = await prisma.rank.findFirst({
      where: {
        rankName: { equals: rank.RANK_NAME.trim(), mode: 'insensitive' },
        rankId: { not: id },
      },
    });

    if (existing) {
      throw new Error('يوجد رتبة أخرى بنفس الاسم بالفعل');
    }

    await prisma.rank.update({
      where: { rankId: id },
      data: { rankName: rank.RANK_NAME.trim() },
    });

    return 1;
  }

  return 0;
}

export async function deleteRank(id: number) {
  await prisma.rank.delete({
    where: { rankId: id },
  });
  return 1;
}

// ====================
// Floors CRUD operations
// ====================

export async function getAllFloors() {
  const floors = await prisma.floor.findMany({
    orderBy: {
      floorName: 'asc',
    },
  });

  return floors.map((floor) => ({
    FLOOR_ID: floor.floorId,
    FLOOR_NAME: floor.floorName,
  }));
}

export async function getFloorById(id: number) {
  const floor = await prisma.floor.findUnique({
    where: { floorId: id },
  });

  if (!floor) return null;

  return {
    FLOOR_ID: floor.floorId,
    FLOOR_NAME: floor.floorName,
  };
}

export async function createFloor(floor: { FLOOR_NAME: string }) {
  // التحقق من وجود طابق بنفس الاسم
  const existing = await prisma.floor.findFirst({
    where: {
      floorName: { equals: floor.FLOOR_NAME.trim(), mode: 'insensitive' },
    },
  });

  if (existing) {
    throw new Error('يوجد طابق بنفس الاسم بالفعل');
  }

  const newFloor = await prisma.floor.create({
    data: {
      floorName: floor.FLOOR_NAME.trim(),
    },
  });

  return newFloor.floorId;
}

export async function updateFloor(id: number, floor: { FLOOR_NAME?: string }) {
  if (floor.FLOOR_NAME !== undefined) {
    // التحقق من وجود طابق آخر بنفس الاسم
    const existing = await prisma.floor.findFirst({
      where: {
        floorName: { equals: floor.FLOOR_NAME.trim(), mode: 'insensitive' },
        floorId: { not: id },
      },
    });

    if (existing) {
      throw new Error('يوجد طابق آخر بنفس الاسم بالفعل');
    }

    await prisma.floor.update({
      where: { floorId: id },
      data: { floorName: floor.FLOOR_NAME.trim() },
    });

    return 1;
  }

  return 0;
}

export async function deleteFloor(id: number) {
  await prisma.floor.delete({
    where: { floorId: id },
  });
  return 1;
}

/**
 * جلب إحصائيات شاملة عن المشروع
 */
export async function getStatistics() {
  try {
    // إحصائيات التصنيفات الرئيسية
    const mainCategories = await prisma.mainCategory.findMany({
      include: {
        subCategories: {
          include: {
            items: true,
          },
        },
      },
      orderBy: {
        catName: 'asc',
      },
    });

    const mainCategoriesStats = mainCategories.map((cat: Prisma.MainCategoryGetPayload<{
      include: { subCategories: { include: { items: true } } };
    }>) => ({
      CAT_ID: cat.catId,
      CAT_NAME: cat.catName,
      ITEM_COUNT: cat.subCategories.reduce((sum: number, sub: Prisma.SubCategoryGetPayload<{ include: { items: true } }>) => sum + sub.items.length, 0),
    }));

    // إحصائيات التصنيفات الفرعية
    const subCategories = await prisma.subCategory.findMany({
      include: {
        mainCategory: true,
        items: true,
      },
      orderBy: [
        { mainCategory: { catName: 'asc' } },
        { subCatName: 'asc' },
      ],
    });

    const subCategoriesStats = subCategories.map((sc: Prisma.SubCategoryGetPayload<{
      include: { mainCategory: true; items: true };
    }>) => ({
      SUB_CAT_ID: sc.subCatId,
      SUB_CAT_NAME: sc.subCatName,
      MAIN_CATEGORY_NAME: sc.mainCategory.catName,
      ITEM_COUNT: sc.items.length,
    }));

    // إحصائيات أنواع الأصناف
    const itemTypes = await prisma.itemType.findMany({
      include: {
        subCategory: {
          include: {
            mainCategory: true,
          },
        },
        items: true,
      },
      orderBy: [
        { subCategory: { mainCategory: { catName: 'asc' } } },
        { subCategory: { subCatName: 'asc' } },
        { itemTypeName: 'asc' },
      ],
    });

    const itemTypesStats = itemTypes.map((it: Prisma.ItemTypeGetPayload<{
      include: { subCategory: { include: { mainCategory: true } }; items: true };
    }>) => ({
      ITEM_TYPE_ID: it.itemTypeId,
      ITEM_TYPE_NAME: it.itemTypeName,
      SUB_CAT_ID: it.subCatId,
      SUB_CAT_NAME: it.subCategory.subCatName,
      CAT_ID: it.subCategory.mainCategory.catId,
      MAIN_CATEGORY_NAME: it.subCategory.mainCategory.catName,
      ITEM_COUNT: it.items.length,
    }));

    // إحصائيات الأقسام
    const departments = await prisma.department.findMany({
      include: {
        items: true,
      },
      orderBy: {
        deptName: 'asc',
      },
    });

    const departmentsStats = departments.map((dept: Prisma.DepartmentGetPayload<{
      include: { items: true };
    }>) => ({
      DEPT_ID: dept.deptId,
      DEPT_NAME: dept.deptName,
      ITEM_COUNT: dept.items.length,
    }));

    // إحصائيات الطوابق
    const floors = await prisma.floor.findMany({
      include: {
        items: true,
      },
      orderBy: {
        floorName: 'asc',
      },
    });

    const floorsStats = floors.map((floor: Prisma.FloorGetPayload<{
      include: { items: true };
    }>) => ({
      FLOOR_ID: floor.floorId,
      FLOOR_NAME: floor.floorName,
      ITEM_COUNT: floor.items.length,
    }));

    // إحصائيات الحالة
    const situationStats = await prisma.item.groupBy({
      by: ['situation'],
      where: {
        situation: { not: null },
      },
      _count: {
        itemId: true,
      },
    });

    const situations = situationStats.map((stat: { situation: string | null; _count: { itemId: number } }) => ({
      SITUATION: stat.situation,
      ITEM_COUNT: stat._count.itemId,
    }));

    // إحصائيات النوع (KIND)
    const kindStats = await prisma.item.groupBy({
      by: ['kind'],
      where: {
        kind: { not: null },
      },
      _count: {
        itemId: true,
      },
    });

    const kinds = kindStats.map((stat: { kind: string | null; _count: { itemId: number } }) => ({
      KIND: stat.kind,
      ITEM_COUNT: stat._count.itemId,
    }));

    // إحصائيات المستخدمين
    const users = await prisma.user.findMany({
      include: {
        items: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    const usersStats = users.map((user: Prisma.UserGetPayload<{
      include: { items: true };
    }>) => ({
      USER_ID: user.userId,
      USER_NAME: user.fullName,
      ITEM_COUNT: user.items.length,
    }));

    // إحصائية المخزن (الأصناف بدون مستخدم)
    const warehouseCount = await prisma.item.count({
      where: {
        userId: null,
      },
    });

    const warehouse = {
      ITEM_COUNT: warehouseCount,
    };

    // إجمالي عدد الأصناف
    const totalItemsCount = await prisma.item.count();
    const totalItems = {
      TOTAL_COUNT: totalItemsCount,
    };

    // إحصائيات المخزون
    const allItems = await prisma.item.findMany({
      select: {
        quantity: true,
        minQuantity: true,
      },
    });

    const stockStats = {
      TOTAL_ITEMS: allItems.length,
      TOTAL_QUANTITY: allItems.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
      LOW_STOCK_COUNT: allItems.filter((item: { quantity: number; minQuantity: number | null }) => item.minQuantity !== null && item.quantity <= item.minQuantity && item.minQuantity > 0).length,
      OUT_OF_STOCK_COUNT: allItems.filter((item: { quantity: number }) => item.quantity === 0).length,
      IN_STOCK_COUNT: allItems.filter((item: { quantity: number; minQuantity: number | null }) => item.quantity > 0 && (item.minQuantity === null || item.minQuantity === 0 || item.quantity > item.minQuantity)).length,
    };

    // إحصائيات الحركات
    const movements = await prisma.inventoryMovement.findMany({
      include: {
        movementType: true,
      },
    });

    const movementsStats = {
      TOTAL_MOVEMENTS: movements.length,
      TOTAL_IN: movements.filter((m: Prisma.InventoryMovementGetPayload<{ include: { movementType: true } }>) => m.movementType.effect === 1).reduce((sum: number, m: Prisma.InventoryMovementGetPayload<{ include: { movementType: true } }>) => sum + m.quantity, 0),
      TOTAL_OUT: movements.filter((m: Prisma.InventoryMovementGetPayload<{ include: { movementType: true } }>) => m.movementType.effect === -1).reduce((sum: number, m: Prisma.InventoryMovementGetPayload<{ include: { movementType: true } }>) => sum + m.quantity, 0),
      ITEMS_WITH_MOVEMENTS: new Set(movements.map((m) => m.itemId)).size,
      USERS_WITH_MOVEMENTS: new Set(movements.map((m) => m.userId)).size,
    };

    // إحصائيات أنواع الحركات
    const movementTypes = await prisma.movementType.findMany({
      where: { isActive: true },
      include: {
        movements: true,
      },
      orderBy: {
        movementTypeId: 'asc',
      },
    });

    const movementTypesStats = movementTypes.map((mt: Prisma.MovementTypeGetPayload<{
      include: { movements: true };
    }>) => ({
      MOVEMENT_TYPE_ID: mt.movementTypeId,
      TYPE_NAME: mt.typeName,
      TYPE_CODE: mt.typeCode,
      MOVEMENT_COUNT: mt.movements.length,
      TOTAL_QUANTITY: mt.movements.reduce((sum: number, m) => sum + m.quantity, 0),
    }));

    // الأصناف القريبة من النفاد
    // Note: Prisma doesn't support field comparison directly, so we fetch and filter
    const allItemsForLowStock = await prisma.item.findMany({
      where: {
        minQuantity: { gt: 0 },
      },
      include: {
        department: true,
        floor: true,
        subCategory: true,
      },
    });

    // Filter items where quantity <= minQuantity and sort
    type ItemWithRelations = Prisma.ItemGetPayload<{
      include: { department: true; floor: true; subCategory: true };
    }>;
    const lowStockItems = allItemsForLowStock
      .filter((item: ItemWithRelations) => item.minQuantity !== null && item.quantity <= item.minQuantity)
      .sort((a: ItemWithRelations, b: ItemWithRelations) => a.quantity - b.quantity)
      .slice(0, 20);

    const lowStockItemsStats = lowStockItems.map((item: Prisma.ItemGetPayload<{
      include: { department: true; floor: true; subCategory: true };
    }>) => ({
      ITEM_ID: item.itemId,
      ITEM_NAME: item.itemName,
      QUANTITY: item.quantity,
      MIN_QUANTITY: item.minQuantity,
      UNIT: item.unit,
      SHORTAGE_QTY: item.minQuantity - item.quantity,
    }));

    return {
      mainCategories: mainCategoriesStats,
      subCategories: subCategoriesStats,
      itemTypes: itemTypesStats,
      departments: departmentsStats,
      floors: floorsStats,
      situations,
      kinds,
      users: usersStats,
      warehouse,
      totalItems,
      stockStats,
      movementsStats,
      movementTypesStats,
      lowStockItems: lowStockItemsStats,
    };
  } catch (error) {
    console.error('Error in getStatistics:', error);
    throw error;
  }
}
