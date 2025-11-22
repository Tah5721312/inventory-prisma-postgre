'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, Filter, BarChart3, ArrowUpDown, ArrowUp, ArrowDown, FileText, History, Package, RefreshCcw, MoveRight } from 'lucide-react';
import Link from 'next/link';
import { escapeHtml } from '@/lib/security';
import { Can } from '@/components/Can';
import { utils, writeFileXLSX } from 'xlsx';
import { DOMAIN } from '@/lib/constants';

interface Item {
  ITEM_ID: number;
  ITEM_NAME: string;
  SERIAL?: string;
  KIND?: string;
  SITUATION?: string;
  PROPERTIES?: string;
  HDD?: string;
  RAM?: string;
  IP?: string;
  COMP_NAME?: string;
  LOCK_NUM?: number;
  QUANTITY?: number;
  MIN_QUANTITY?: number;
  UNIT?: string;
  USER_ID?: number;
  ASSIGNED_USER?: string;
  DEPT_ID?: number;
  DEPT_NAME?: string;
  FLOOR_ID?: number;
  FLOOR_NAME?: string;
  SUB_CAT_ID?: number;
  SUB_CAT_NAME?: string;
  CAT_ID?: number;
  MAIN_CATEGORY_NAME?: string;
  ITEM_TYPE_ID?: number;
  ITEM_TYPE_NAME?: string;
}

interface MovementType {
  MOVEMENT_TYPE_ID: number;
  TYPE_NAME: string;
  TYPE_CODE: string;
  EFFECT: number;
  DESCRIPTION?: string;
}

interface InventoryMovement {
  MOVEMENT_ID: number;
  ITEM_ID: number;
  ITEM_NAME?: string;
  MOVEMENT_TYPE_ID: number;
  MOVEMENT_TYPE?: string;
  TYPE_CODE?: string;
  QUANTITY: number;
  PREVIOUS_QTY?: number;
  NEW_QTY?: number;
  MOVEMENT_DATE?: string;
  USER_ID: number;
  USER_NAME?: string;
  USER_FULL_NAME?: string;
  FROM_DEPT?: string;
  TO_DEPT?: string;
  FROM_FLOOR?: string;
  TO_FLOOR?: string;
  REFERENCE_NO?: string;
  NOTES?: string;
  CREATED_AT: string;
}

interface Category {
  CAT_ID: number;
  CAT_NAME: string;
}

interface SubCategory {
  SUB_CAT_ID: number;
  SUB_CAT_NAME: string;
  CAT_ID: number;
}

interface User {
  USER_ID: number;
  USER_NAME: string;
}

interface ItemType {
  ITEM_TYPE_ID: number;
  ITEM_TYPE_NAME: string;
  SUB_CAT_ID?: number;
}

interface Department {
  DEPT_ID: number;
  DEPT_NAME: string;
}

interface Floor {
  FLOOR_ID: number;
  FLOOR_NAME: string;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<Partial<Item>>({});
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalItem, setStockModalItem] = useState<Item | null>(null);
  const [stockMovements, setStockMovements] = useState<InventoryMovement[]>([]);
  const [movementTypes, setMovementTypes] = useState<MovementType[]>([]);
  const [stockHistoryLoading, setStockHistoryLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState<{ 
    movementTypeId: string; 
    quantity: string; 
    unit: string;
    referenceNo: string;
    notes: string;
    fromDeptId: string;
    toDeptId: string;
    fromFloorId: string;
    toFloorId: string;
  }>({
    movementTypeId: '',
    quantity: '',
    unit: '',
    referenceNo: '',
    notes: '',
    fromDeptId: '',
    toDeptId: '',
    fromFloorId: '',
    toFloorId: '',
  });
  
  // Lookup data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [filteredItemTypes, setFilteredItemTypes] = useState<ItemType[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<SubCategory[]>([]);
  const [filteredUsersByDept, setFilteredUsersByDept] = useState<User[]>([]);
  
  const [filters, setFilters] = useState<{
    catId: string;
    subCatId: string;
    itemTypeId: string;
    deptId: string;
    userId: string;
    serial: string;
    itemName: string;
    ip: string;
    compName: string;
  }>({
    catId: '',
    subCatId: '',
    itemTypeId: '',
    deptId: '',
    userId: '',
    serial: '',
    itemName: '',
    ip: '',
    compName: '',
  });

  // Sort state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchItems();
    fetchLookupData();
    fetchMovementTypes();
  }, []);

  const fetchMovementTypes = async () => {
    try {
      const response = await fetch(`${DOMAIN}/api/movement-types`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setMovementTypes(result.data);
        // تعيين النوع الافتراضي (إدخال مخزون - ID = 1)
        if (result.data.length > 0) {
          const defaultType = result.data.find((t: MovementType) => t.TYPE_CODE === 'IN') || result.data[0];
          setStockForm((prev) => ({ ...prev, movementTypeId: String(defaultType.MOVEMENT_TYPE_ID) }));
        }
      }
    } catch (error) {
      console.error('❌ Error fetching movement types:', error);
    }
  };

  useEffect(() => {
    if (formData.CAT_ID) {
      setFilteredSubCategories(
        subCategories.filter(sub => sub.CAT_ID === formData.CAT_ID)
      );
    } else {
      setFilteredSubCategories(subCategories);
    }
  }, [formData.CAT_ID, subCategories]);

  useEffect(() => {
    if (formData.SUB_CAT_ID) {
      setFilteredItemTypes(itemTypes.filter(t => t.SUB_CAT_ID === formData.SUB_CAT_ID));
    } else {
      setFilteredItemTypes(itemTypes);
    }
  }, [formData.SUB_CAT_ID, itemTypes]);

  // Update filtered subcategories based on filter category
  useEffect(() => {
    if (filters.catId) {
      setFilteredSubCategories(
        subCategories.filter(sub => sub.CAT_ID === Number(filters.catId))
      );
    } else {
      setFilteredSubCategories(subCategories);
    }
  }, [filters.catId, subCategories]);

  // Update filtered item types based on filter subcategory
  useEffect(() => {
    if (filters.subCatId) {
      setFilteredItemTypes(itemTypes.filter(t => t.SUB_CAT_ID === Number(filters.subCatId)));
    } else if (filters.catId) {
      // If only category is selected, show item types for that category's subcategories
      const catSubIds = subCategories
        .filter(sub => sub.CAT_ID === Number(filters.catId))
        .map(sub => sub.SUB_CAT_ID);
      setFilteredItemTypes(itemTypes.filter(t => t.SUB_CAT_ID && catSubIds.includes(t.SUB_CAT_ID)));
    } else {
      setFilteredItemTypes(itemTypes);
    }
  }, [filters.subCatId, filters.catId, itemTypes, subCategories]);

  // Filter users by department
  useEffect(() => {
    if (filters.deptId) {
      // This will need to be handled on the backend or by fetching users with department filter
      // For now, we'll keep all users but you might want to add a filter on the users API
      setFilteredUsersByDept(users);
    } else {
      setFilteredUsersByDept(users);
    }
  }, [filters.deptId, users]);

  useEffect(() => {
    if (!stockModalItem) return;
    const updated = items.find((item) => item.ITEM_ID === stockModalItem.ITEM_ID);
    if (updated && updated !== stockModalItem) {
      setStockModalItem(updated);
    }
  }, [items, stockModalItem]);

  const fetchLookupData = async () => {
    try {
      const [catsRes, subsRes, usersRes, typesRes, deptsRes, floorsRes] = await Promise.all([
        fetch(`${DOMAIN}/api/main-categories`),
        fetch(`${DOMAIN}/api/sub-categories`),
        fetch(`${DOMAIN}/api/users`),
        fetch(`${DOMAIN}/api/item-types`),
        fetch(`${DOMAIN}/api/departments`),
        fetch(`${DOMAIN}/api/floors`),
      ]);

      const [catsData, subsData, usersData, typesData, deptsData, floorsData] = await Promise.all([
        catsRes.json(),
        subsRes.json(),
        usersRes.json(),
        typesRes.json(),
        deptsRes.json(),
        floorsRes.json(),
      ]);

      // Helper function to safely extract array from response
      const getArrayFromResponse = (data: any, fallback: any[] = [], dataType = 'data'): any[] => {
        if (!data) {
          console.warn(`⚠️ ${dataType}: No data received`);
          return fallback;
        }
        if (data.success === false) {
          console.warn(`⚠️ ${dataType}: API returned success: false`, data.error);
          return fallback; // Handle error responses
        }
        if (Array.isArray(data)) {
          console.log(`✅ ${dataType}: Data is already an array`, data.length);
          return data;
        }
        if (Array.isArray(data.data)) {
          console.log(`✅ ${dataType}: Found data in data.data`, data.data.length);
          return data.data;
        }
        if (Array.isArray(data.users)) {
          console.log(`✅ ${dataType}: Found data in data.users`, data.users.length);
          return data.users;
        }
        console.warn(`⚠️ ${dataType}: Could not find array in response`, data);
        return fallback;
      };

      // Handle categories
      const categoriesArray = getArrayFromResponse(catsData);
      setCategories(categoriesArray.map((c: any) => ({ 
        CAT_ID: Number(c.CAT_ID), 
        CAT_NAME: c.CAT_NAME 
      })));

      // Handle sub-categories
      const subCategoriesArray = getArrayFromResponse(subsData);
      setSubCategories(subCategoriesArray.map((s: any) => ({ 
        SUB_CAT_ID: Number(s.SUB_CAT_ID), 
        SUB_CAT_NAME: s.SUB_CAT_NAME, 
        CAT_ID: Number(s.CAT_ID) 
      })));

      // Handle users (special case: returns { users: [...] })
      const usersArray = getArrayFromResponse(usersData);
      setUsers(usersArray.map((u: any) => ({ 
        USER_ID: Number(u.USER_ID), 
        USER_NAME: u.FULL_NAME || u.USER_NAME || u.USERNAME 
      })));

      // Handle item types
      const itemTypesArray = getArrayFromResponse(typesData);
      setItemTypes(itemTypesArray.map((t: any) => ({ 
        ITEM_TYPE_ID: Number(t.ITEM_TYPE_ID), 
        ITEM_TYPE_NAME: t.ITEM_TYPE_NAME, 
        SUB_CAT_ID: t.SUB_CAT_ID ? Number(t.SUB_CAT_ID) : undefined 
      })));

      // Handle departments
      console.log('📦 Departments response:', deptsData);
      const departmentsArray = getArrayFromResponse(deptsData, [], 'Departments');
      console.log('📦 Departments array:', departmentsArray);
      const mappedDepartments = departmentsArray.map((d: any) => ({ 
        DEPT_ID: Number(d.DEPT_ID), 
        DEPT_NAME: d.DEPT_NAME || 'Unknown'
      }));
      console.log('📦 Mapped departments:', mappedDepartments, `(${mappedDepartments.length} items)`);
      setDepartments(mappedDepartments);

      // Handle floors
      console.log('🏢 Floors response:', floorsData);
      const floorsArray = getArrayFromResponse(floorsData, [], 'Floors');
      console.log('🏢 Floors array:', floorsArray);
      const mappedFloors = floorsArray.map((f: any) => ({ 
        FLOOR_ID: Number(f.FLOOR_ID), 
        FLOOR_NAME: f.FLOOR_NAME || 'Unknown'
      }));
      console.log('🏢 Mapped floors:', mappedFloors, `(${mappedFloors.length} items)`);
      setFloors(mappedFloors);

    } catch (error) {
      console.error('❌ Error fetching lookup data:', error);
    }
  };

  const getQuantityStatus = (quantity?: number, minQuantity?: number) => {
    if (quantity === undefined || quantity === null) {
      return {
        label: 'غير محدد',
        emoji: '❔',
        className: 'bg-slate-100 text-slate-600 border border-slate-200',
      };
    }
    if (quantity <= 0) {
      return {
        label: '❌ منتهي',
        emoji: '❌',
        className: 'bg-red-100 text-red-700 border border-red-200',
      };
    }
    // استخدام MIN_QUANTITY إذا كان محدداً
    if (minQuantity !== undefined && minQuantity !== null && minQuantity > 0) {
      if (quantity <= minQuantity) {
        return {
          label: '⚠️ قليل',
          emoji: '⚠️',
          className: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
        };
      }
      return {
        label: '✅ متاح',
        emoji: '✅',
        className: 'bg-green-100 text-green-700 border border-green-200',
      };
    }
    // استخدام القيم الافتراضية إذا لم يكن MIN_QUANTITY محدداً
    if (quantity < 10) {
      return {
        label: '⚠️ قليل',
        emoji: '⚠️',
        className: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      };
    }
    return {
      label: '✅ متاح',
      emoji: '✅',
      className: 'bg-green-100 text-green-700 border border-green-200',
    };
  };

  const fetchItems = async (customFilters?: typeof filters) => {
    try {
      setLoading(true);
      const activeFilters = customFilters || filters;
      const queryParams = new URLSearchParams();
      if (activeFilters.catId) queryParams.append('catId', activeFilters.catId);
      if (activeFilters.subCatId) queryParams.append('subCatId', activeFilters.subCatId);
      if (activeFilters.itemTypeId) queryParams.append('itemTypeId', activeFilters.itemTypeId);
      if (activeFilters.deptId) queryParams.append('deptId', activeFilters.deptId);
      if (activeFilters.userId) {
        if (activeFilters.userId === 'warehouse') {
          queryParams.append('userId', 'warehouse');
        } else {
          queryParams.append('userId', activeFilters.userId);
        }
      }
      if (activeFilters.serial) queryParams.append('serial', activeFilters.serial);
      if (activeFilters.itemName) queryParams.append('itemName', activeFilters.itemName);
      if (activeFilters.ip) queryParams.append('ip', activeFilters.ip);
      if (activeFilters.compName) queryParams.append('compName', activeFilters.compName);

      const response = await fetch(`${DOMAIN}/api/items?${queryParams}`);
      const result = await response.json();
      
      console.log('📥 API Response:', result);

      // ✅ إصلاح: التعامل مع الـ response بشكل صحيح
      if (result.success && Array.isArray(result.data)) {
        setItems(result.data);
        // لا نعرض خطأ إذا كانت المصفوفة فارغة - فقط نضع البيانات الفارغة
      } else if (Array.isArray(result)) {
        // في حالة كان الـ response array مباشر
        setItems(result);
      } else if (result.success === false && result.error) {
        // ✅ إذا كان هناك خطأ حقيقي من السيرفر، نعرض رسالة خطأ
        // لكن إذا كانت الاستجابة ناجحة والمصفوفة فارغة، نعتبرها "لا يوجد بيانات"
        const errorMsg = typeof result.error === 'string' ? result.error : '';
        // فقط نضع المصفوفة فارغة، لا نعرض alert
        setItems([]);
      } else if (result.error && !result.success) {
        // خطأ حقيقي
        setItems([]);
      } else {
        // استجابة غير متوقعة - نضع المصفوفة فارغة
        setItems([]);
      }
    } catch (error) {
      // في حالة catch، نضع المصفوفة فارغة بدون إظهار alert
      // سيتم عرض "لا توجد أصناف" تلقائياً إذا كانت المصفوفة فارغة
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovementsData = async (itemId: number) => {
    setStockHistoryLoading(true);
    try {
      const response = await fetch(`${DOMAIN}/api/stock-movements?itemId=${itemId}`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setStockMovements(result.data);
      } else {
        setStockMovements([]);
      }
    } catch (error) {
      console.error('❌ Error fetching stock movements:', error);
      setStockMovements([]);
    } finally {
      setStockHistoryLoading(false);
    }
  };

  const openStockModal = (item: Item) => {
    setStockModalItem(item);
    setShowStockModal(true);
    // تعيين النوع الافتراضي
    const defaultType = movementTypes.find((t) => t.TYPE_CODE === 'IN') || movementTypes[0];
    setStockForm({
      movementTypeId: defaultType ? String(defaultType.MOVEMENT_TYPE_ID) : '',
      quantity: '',
      unit: item.UNIT || '',
      referenceNo: '',
      notes: '',
      fromDeptId: '',
      toDeptId: '',
      fromFloorId: '',
      toFloorId: '',
    });
    setStockError(null);
    fetchStockMovementsData(item.ITEM_ID);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setStockModalItem(null);
    setStockMovements([]);
    setStockError(null);
  };

  const handleStockSubmit = async () => {
    if (!stockModalItem) return;

    if (!stockForm.movementTypeId) {
      setStockError('يجب اختيار نوع الحركة');
      return;
    }

    const qtyNumber = Number(stockForm.quantity);
    if (Number.isNaN(qtyNumber) || qtyNumber <= 0) {
      setStockError('الكمية يجب أن تكون أكبر من صفر');
      return;
    }

    setStockLoading(true);
    setStockError(null);

    try {
      const response = await fetch(`${DOMAIN}/api/stock-movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: stockModalItem.ITEM_ID,
          movementTypeId: Number(stockForm.movementTypeId),
          unit: stockForm.unit?.trim() || stockModalItem?.UNIT || 'قطعة',
          quantity: qtyNumber,
          referenceNo: stockForm.referenceNo?.trim() || null,
          notes: stockForm.notes?.trim() || null,
          fromDeptId: stockForm.fromDeptId ? Number(stockForm.fromDeptId) : null,
          toDeptId: stockForm.toDeptId ? Number(stockForm.toDeptId) : null,
          fromFloorId: stockForm.fromFloorId ? Number(stockForm.fromFloorId) : null,
          toFloorId: stockForm.toFloorId ? Number(stockForm.toFloorId) : null,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'فشل تنفيذ الحركة');
      }

      // إعادة تعيين النموذج
      const defaultType = movementTypes.find((t) => t.TYPE_CODE === 'IN') || movementTypes[0];
      setStockForm({
        movementTypeId: defaultType ? String(defaultType.MOVEMENT_TYPE_ID) : '',
        quantity: '',
        unit: stockModalItem?.UNIT || '',
        referenceNo: '',
        notes: '',
        fromDeptId: '',
        toDeptId: '',
        fromFloorId: '',
        toFloorId: '',
      });
      await fetchStockMovementsData(stockModalItem.ITEM_ID);
      await fetchItems();
      // تحديث بيانات الصنف في الـ modal
      const updatedItem = await fetch(`${DOMAIN}/api/items?id=${stockModalItem.ITEM_ID}`).then(r => r.json());
      if (updatedItem.success && updatedItem.data) {
        setStockModalItem(updatedItem.data);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'فشل تنفيذ الحركة';
      setStockError(errMsg);
    } finally {
      setStockLoading(false);
    }
  };

  const handleDeleteMovement = async (movementId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحركة؟ سيتم إعادة الكمية للقيمة السابقة.')) {
      return;
    }

    if (!stockModalItem) return;

    setStockLoading(true);
    setStockError(null);

    try {
      const response = await fetch(`${DOMAIN}/api/stock-movements?movementId=${movementId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'فشل حذف الحركة');
      }

      // تحديث قائمة الحركات
      await fetchStockMovementsData(stockModalItem.ITEM_ID);
      // تحديث قائمة الأصناف
      await fetchItems();
      // تحديث بيانات الصنف في الـ modal
      const updatedItem = await fetch(`${DOMAIN}/api/items?id=${stockModalItem.ITEM_ID}`).then(r => r.json());
      if (updatedItem.success && updatedItem.data) {
        setStockModalItem(updatedItem.data);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'فشل حذف الحركة';
      setStockError(errMsg);
    } finally {
      setStockLoading(false);
    }
  };

  const filteredItems = items.filter((item) =>
    item.ITEM_NAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.SERIAL?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ASSIGNED_USER?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort function
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, start with ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Apply sorting to filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: string | undefined;
    let bValue: string | undefined;

    switch (sortColumn) {
      case 'ITEM_NAME':
        aValue = a.ITEM_NAME?.toLowerCase() || '';
        bValue = b.ITEM_NAME?.toLowerCase() || '';
        break;
      case 'MAIN_CATEGORY_NAME':
        aValue = a.MAIN_CATEGORY_NAME?.toLowerCase() || '';
        bValue = b.MAIN_CATEGORY_NAME?.toLowerCase() || '';
        break;
      case 'SUB_CAT_NAME':
        aValue = a.SUB_CAT_NAME?.toLowerCase() || '';
        bValue = b.SUB_CAT_NAME?.toLowerCase() || '';
        break;
      case 'ITEM_TYPE_NAME':
        aValue = a.ITEM_TYPE_NAME?.toLowerCase() || '';
        bValue = b.ITEM_TYPE_NAME?.toLowerCase() || '';
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const openModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      // If USER_ID is null or undefined, don't set it so the warehouse option is selected
      const formDataForItem = { ...item };
      if (formDataForItem.USER_ID === null || formDataForItem.USER_ID === undefined) {
        formDataForItem.USER_ID = undefined;
      }
      setFormData(formDataForItem);
    } else {
      setEditingItem(null);
      setFormData({ QUANTITY: 0 });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.ITEM_NAME) {
      alert('اسم الصنف مطلوب');
      return;
    }
    
    if (!formData.SUB_CAT_ID) {
      alert('التصنيف الفرعي مطلوب');
      return;
    }

    const payload: any = { ...formData };
    const numericKeys = [
      'ITEM_TYPE_ID', 'CAT_ID', 'SUB_CAT_ID', 
      'LOCK_NUM', 'DEPT_ID', 'FLOOR_ID', 'QUANTITY',
    ];
    
    // Handle numeric keys (except USER_ID which needs special handling)
    numericKeys.forEach((k) => {
      const v = payload[k];
      if (v === '' || v === undefined || v === null) {
        delete payload[k];
      } else {
        const n = Number(v);
        if (Number.isNaN(n) || n === 0) {
          delete payload[k];
        } else {
          payload[k] = n;
        }
      }
    });

    // Handle USER_ID separately - allow null for warehouse items
    if (payload.USER_ID === '' || payload.USER_ID === undefined || payload.USER_ID === null) {
      // If USER_ID is empty, set it to null (for warehouse items)
      payload.USER_ID = null;
    } else {
      const userId = Number(payload.USER_ID);
      if (Number.isNaN(userId) || userId === 0) {
        payload.USER_ID = null;
      } else {
        payload.USER_ID = userId;
      }
    }

    const readOnlyKeys = [
      'ITEM_TYPE_NAME', 'ASSIGNED_USER', 'DEPT_NAME', 'FLOOR_NAME',
      'SUB_CAT_NAME', 'MAIN_CATEGORY_NAME', 'CREATED_AT', 'UPDATED_AT',
    ];
    readOnlyKeys.forEach((k) => delete payload[k]);

    if (editingItem) {
      delete payload.QUANTITY;
    }

    console.log('📤 Sending payload:', payload);

    try {
      if (editingItem) {
        const response = await fetch(`${DOMAIN}/api/items`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, ITEM_ID: editingItem.ITEM_ID }),
        });

        const result = await response.json();
        if (!result.success) {
          // ✅ عرض رسالة خطأ آمنة (لا نعرض details لتجنب Information Disclosure)
          const errorMsg = typeof result.error === 'string' ? result.error : 'فشل التحديث';
          throw new Error(errorMsg);
        }
      } else {
        const response = await fetch(`${DOMAIN}/api/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!result.success) {
          // ✅ عرض رسالة خطأ آمنة (لا نعرض details لتجنب Information Disclosure)
          const errorMsg = typeof result.error === 'string' ? result.error : 'فشل الإضافة';
          throw new Error(errorMsg);
        }
      }

      setShowModal(false);
      await fetchItems();
      alert(editingItem ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Error saving item:', errMsg);
      alert(errMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;

    try {
      const response = await fetch(`${DOMAIN}/api/items?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'فشل الحذف');
      }

      await fetchItems();
      alert('تم الحذف بنجاح');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('فشل في حذف الصنف');
    }
  };

  const handleExportItemsExcel = () => {
    if (sortedItems.length === 0) return;

    const rows = sortedItems.map((item, index) => ({
      '#': index + 1,
      'اسم الصنف': item.ITEM_NAME || '',
      'التصنيف الرئيسي': item.MAIN_CATEGORY_NAME || '',
      'التصنيف الفرعي': item.SUB_CAT_NAME || '',
      'نوع الصنف': item.ITEM_TYPE_NAME || '',
      'المستخدم': item.ASSIGNED_USER || 'المخزن',
      'القسم': item.DEPT_NAME || '',
      'الطابق': item.FLOOR_NAME || '',
      'رقم السيريال': item.SERIAL || '',
      'نوع الأصل': item.KIND || '',
      'الحالة': item.SITUATION || '',
      'اسم الجهاز': item.COMP_NAME || '',
      'IP': item.IP || '',
      'رقم القفل': item.LOCK_NUM ?? '',
      'الكمية': item.QUANTITY ?? 0,
    }));

    const worksheet = utils.json_to_sheet(rows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Items');

    const today = new Date().toISOString().split('T')[0];
    writeFileXLSX(workbook, `inventory-items-${today}.xlsx`);
  };

  const handleExportItemsPDF = () => {
    if (sortedItems.length === 0) return;

    // الحصول على URL الصورة (آمن - window.location.origin لا يمكن تلاعبه)
    // ✅ window.location.origin آمن لأنه لا يحتوي على أحرف خطيرة في HTML attributes
    const logoUrl = window.location.origin + '/EDARA_LOGO.png';
    
    // تحويل الأرقام إلى الأرقام العربية
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const toArabicNum = (num: number): string => {
      return num.toString().replace(/\d/g, (digit) => arabicNumbers[parseInt(digit)]);
    };

    // تنظيم البيانات بشكل هرمي
    const groupedByMainCategory = new Map<string, Map<string, Map<string, Item[]>>>();

    // تجميع البيانات
    sortedItems.forEach(item => {
      const mainCat = item.MAIN_CATEGORY_NAME || 'غير محدد';
      const subCat = item.SUB_CAT_NAME || 'غير محدد';
      const itemType = item.ITEM_TYPE_NAME || 'غير محدد';

      if (!groupedByMainCategory.has(mainCat)) {
        groupedByMainCategory.set(mainCat, new Map());
      }
      const mainCatMap = groupedByMainCategory.get(mainCat)!;

      if (!mainCatMap.has(subCat)) {
        mainCatMap.set(subCat, new Map());
      }
      const subCatMap = mainCatMap.get(subCat)!;

      if (!subCatMap.has(itemType)) {
        subCatMap.set(itemType, []);
      }
      subCatMap.get(itemType)!.push(item);
    });

    // إنشاء صفوف الجدول مع rowspan
    let tableRows = '';
    groupedByMainCategory.forEach((subCatMap, mainCat) => {
      // حساب إجمالي عدد الصفوف لهذا الصنف الرئيسي
      let mainCatRowspan = 0;
      subCatMap.forEach(itemTypeMap => {
        itemTypeMap.forEach(items => {
          mainCatRowspan += items.length;
        });
      });

      let isFirstMainRow = true;
      subCatMap.forEach((itemTypeMap, subCat) => {
        // حساب إجمالي عدد الصفوف لهذا الصنف الفرعي
        let subCatRowspan = 0;
        itemTypeMap.forEach(items => {
          subCatRowspan += items.length;
        });

        let isFirstSubRow = true;
        itemTypeMap.forEach((items, itemType) => {
          const itemTypeRowspan = items.length;
          let isFirstItemTypeRow = true;

          items.forEach((item, itemIndex) => {
            tableRows += '<tr>';
            
            // الصنف الرئيسي - فقط في الصف الأول (escape HTML لتجنب XSS)
            if (isFirstMainRow && isFirstSubRow && isFirstItemTypeRow) {
              tableRows += `<td rowspan="${mainCatRowspan}" style="border: 2px solid #000; padding: 6px 8px; text-align: center; font-size: 11px; font-weight: bold; vertical-align: top;">${escapeHtml(mainCat)}</td>`;
              isFirstMainRow = false;
            }
            
            // الصنف الفرعي - فقط في الصف الأول (escape HTML لتجنب XSS)
            if (isFirstSubRow && isFirstItemTypeRow) {
              tableRows += `<td rowspan="${subCatRowspan}" style="border: 2px solid #000; padding: 6px 8px; text-align: center; font-size: 11px; font-weight: bold; vertical-align: top;">${escapeHtml(subCat)}</td>`;
              isFirstSubRow = false;
            }
            
            // نوع الصنف - فقط في الصف الأول من هذا النوع (escape HTML لتجنب XSS)
            if (isFirstItemTypeRow) {
              tableRows += `<td rowspan="${itemTypeRowspan}" style="border: 2px solid #000; padding: 6px 8px; text-align: center; font-size: 11px; vertical-align: top;">${escapeHtml(itemType)}</td>`;
              isFirstItemTypeRow = false;
            }
            
            // اسم الصنف (escape HTML لتجنب XSS)
            tableRows += `<td style="border: 2px solid #000; padding: 6px 8px; text-align: center; font-size: 11px;">${escapeHtml(item.ITEM_NAME || '-')}</td>`;
            
            // السريال (escape HTML لتجنب XSS)
            tableRows += `<td style="border: 2px solid #000; padding: 6px 8px; text-align: center; font-size: 11px; font-family: monospace;">${escapeHtml(item.SERIAL || '-')}</td>`;
            
            // مكان التواجد (القسم + الطابق) (escape HTML لتجنب XSS)
            const location = [item.DEPT_NAME, item.FLOOR_NAME].filter(Boolean).map(escapeHtml).join(' / ') || '-';
            tableRows += `<td style="border: 2px solid #000; padding: 6px 8px; text-align: center; font-size: 11px;">${location}</td>`;
            
            tableRows += '</tr>';
          });
        });
      });
    });

    // إنشاء HTML للPDF
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تقرير الأصناف</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', sans-serif;
              background: #f5f5f5;
              padding: 10px;
            }
            .page {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              border: 3px solid #000;
              padding: 15px;
              min-height: auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 15px;
            }
            .logo {
              width: 60px;
              height: 60px;
              border: 2px solid #000;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              background: #f0f0f0;
              flex-shrink: 0;
              order: 2;
              overflow: hidden;
            }
            .logo img {
              width: 100%;
              height: 100%;
              object-fit: contain;
              padding: 3px;
            }
            .header-content {
              text-align: right;
              order: 1;
            }
            .header-text {
              font-size: 11px;
              line-height: 1.5;
              margin-bottom: 2px;
            }
            .title {
              font-size: 13px;
              font-weight: 900;
              margin: 12px 0;
              text-align: center;
              border: 2px solid #000;
              padding: 6px;
              background: #f9f9f9;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 11px;
            }
            th {
              border: 2px solid #000;
              padding: 8px;
              text-align: center;
              font-size: 11px;
              background-color: #d3d3d3;
              font-weight: bold;
            }
            td {
              border: 2px solid #000;
              padding: 6px 8px;
              text-align: center;
              font-size: 11px;
            }
            @media print {
              @page {
                size: A4 landscape;
                margin: 0.8cm;
              }
              body {
                background: white;
                padding: 0;
              }
              .page {
                border: none;
                box-shadow: none;
                padding: 12px;
              }
              .header {
                margin-bottom: 10px;
              }
              .title {
                margin: 8px 0;
                padding: 5px;
                font-size: 12px;
              }
              table {
                margin: 10px 0;
                font-size: 10px;
              }
              th, td {
                padding: 5px 6px;
                font-size: 9px;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <!-- Header -->
            <div class="header">
              <div class="logo">
                <img src="${logoUrl}" alt="شعار" onerror="this.style.display='none'; this.nextElementSibling ? this.nextElementSibling.textContent = '[شعار]' : this.parentElement.appendChild(document.createTextNode('[شعار]'));" />
              </div>
              <div class="header-content">
                <div class="header-text">tah57</div>
               
              </div>
            </div>
            
            <!-- Title -->
            <div class="title">
              تقرير الأصناف
            </div>
            
            <!-- Table -->
            <table>
              <thead>
                <tr>
                  <th>الصنف الرئيسي</th>
                  <th>الصنف الفرعي</th>
                  <th>نوع الصنف</th>
                  <th>اسم الصنف</th>
                  <th>السريال</th>
                  <th>مكان التواجد</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    // فتح صفحة جديدة مع المحتوى
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // الانتظار قليلاً ثم فتح نافذة الطباعة
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-3 sm:p-4 md:p-6 lg:p-8" dir="rtl">
      <div className=" mx-auto space-y-4 sm:space-y-6">
        {/* Header - Modern */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-6 lg:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Plus size={24} className="text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">إدارة الأصناف</h1>
              </div>
              <p className="text-blue-100 text-sm sm:text-base ml-14 sm:ml-0">عرض وإدارة جميع الأصناف والأجهزة في النظام</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/statistics"
                className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap backdrop-blur-sm border border-white/30"
              >
                <BarChart3 size={20} />
                <span>الإحصائيات</span>
              </Link>
              <button
                onClick={() => openModal()}
                className="flex items-center justify-center gap-2 bg-white text-blue-600 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap"
              >
                <Plus size={20} />
                <span>إضافة صنف جديد</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filters - Modern */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
              <input
                type="text"
                placeholder="🔍 ابحث عن صنف، رقم سيريال، أو مستخدم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white text-sm sm:text-base"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 border-2 rounded-xl font-semibold transition-all duration-200 ${
                showFilters
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              <Filter size={18} />
              <span className="whitespace-nowrap">فلاتر</span>
              {showFilters && <span className="ml-1 text-xs">✓</span>}
            </button>
          </div>

          {showFilters && (
            <div className="mt-5 pt-5 border-t-2 border-slate-100 space-y-4 animate-in slide-in-from-top duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* التصنيف الرئيسي */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">التصنيف الرئيسي</label>
                  <div className="relative">
                    <select
                      value={filters.catId}
                      onChange={(e) => setFilters({ ...filters, catId: e.target.value, subCatId: '', itemTypeId: '' })}
                      className="w-full pr-10 pl-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-slate-50 focus:bg-white cursor-pointer appearance-none whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '12px' }}
                    >
                      <option value="">جميع التصنيفات</option>
                      {categories.map(cat => (
                        <option key={cat.CAT_ID} value={cat.CAT_ID}>
                          {cat.CAT_NAME}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* التصنيف الفرعي */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">التصنيف الفرعي</label>
                  <div className="relative">
                    <select
                      value={filters.subCatId}
                      onChange={(e) => setFilters({ ...filters, subCatId: e.target.value, itemTypeId: '' })}
                      className="w-full pr-10 pl-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-slate-50 focus:bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed appearance-none whitespace-nowrap overflow-hidden text-ellipsis"
                      disabled={!filters.catId}
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '12px' }}
                    >
                      <option value="">جميع التصنيفات</option>
                      {filteredSubCategories.map(sub => (
                        <option key={sub.SUB_CAT_ID} value={sub.SUB_CAT_ID}>
                          {sub.SUB_CAT_NAME}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* نوع الصنف */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">نوع الصنف</label>
                  <div className="relative">
                    <select
                      value={filters.itemTypeId}
                      onChange={(e) => setFilters({ ...filters, itemTypeId: e.target.value })}
                      className="w-full pr-10 pl-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-slate-50 focus:bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed appearance-none whitespace-nowrap overflow-hidden text-ellipsis"
                      disabled={!filters.subCatId && !filters.catId}
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '12px' }}
                    >
                      <option value="">جميع الأنواع</option>
                      {filteredItemTypes.map(type => (
                        <option key={type.ITEM_TYPE_ID} value={type.ITEM_TYPE_ID}>
                          {type.ITEM_TYPE_NAME}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* القسم */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">القسم</label>
                  <div className="relative">
                    <select
                      value={filters.deptId}
                      onChange={(e) => setFilters({ ...filters, deptId: e.target.value, userId: '' })}
                      className="w-full pr-10 pl-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-slate-50 focus:bg-white cursor-pointer appearance-none whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '12px' }}
                    >
                      <option value="">جميع الأقسام</option>
                      {departments.map(dept => (
                        <option key={dept.DEPT_ID} value={dept.DEPT_ID}>
                          {dept.DEPT_NAME}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* المستخدم */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">المستخدم</label>
                  <div className="relative">
                    <select
                      value={filters.userId}
                      onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                      className="w-full pr-10 pl-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-slate-50 focus:bg-white cursor-pointer appearance-none whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '12px' }}
                    >
                      <option value="">جميع المستخدمين</option>
                      <option value="warehouse">📦 المخزن</option>
                      {filteredUsersByDept.map(user => (
                        <option key={user.USER_ID} value={user.USER_ID}>
                          {user.USER_NAME}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* رقم السيريال */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">رقم السيريال</label>
                  <input
                    type="text"
                    placeholder="أدخل رقم السيريال"
                    value={filters.serial}
                    onChange={(e) => setFilters({ ...filters, serial: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                {/* اسم الصنف */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">اسم الصنف</label>
                  <input
                    type="text"
                    placeholder="أدخل اسم الصنف"
                    value={filters.itemName}
                    onChange={(e) => setFilters({ ...filters, itemName: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>

                {/* IP Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">عنوان IP</label>
                  <input
                    type="text"
                    placeholder="مثال: 192.168.1.1"
                    value={filters.ip}
                    onChange={(e) => setFilters({ ...filters, ip: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-slate-50 focus:bg-white font-mono text-sm"
                  />
                </div>

                {/* اسم الجهاز */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">اسم الجهاز</label>
                  <input
                    type="text"
                    placeholder="أدخل اسم الكمبيوتر/الجهاز"
                    value={filters.compName}
                    onChange={(e) => setFilters({ ...filters, compName: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => {
                    const emptyFilters = {
                      catId: '',
                      subCatId: '',
                      itemTypeId: '',
                      deptId: '',
                      userId: '',
                      serial: '',
                      itemName: '',
                      ip: '',
                      compName: '',
                    };
                    setFilters(emptyFilters);
                    fetchItems(emptyFilters);
                  }}
                  className="px-5 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
                >
                  مسح جميع الفلاتر
                </button>
                <button
                  onClick={() => fetchItems()}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  تطبيق الفلاتر
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Items Display - Modern & Responsive */}
        {loading ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/50 p-12 sm:p-16 text-center">
            <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 text-lg font-medium">جاري تحميل البيانات...</p>
            <p className="text-slate-400 text-sm mt-2">يرجى الانتظار</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/50 p-12 sm:p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Search size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-700 text-xl font-semibold mb-2">لا توجد أصناف</p>
            <p className="text-slate-500 text-sm mb-6">جرب إضافة صنف جديد أو تعديل الفلاتر</p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              إضافة صنف جديد
            </button>
          </div>
        ) : (
          <>

          {/* PDF Export Button - Only shown if user has reports read permission */}
            <Can do="read" on="Reports">
              <div className="flex justify-end gap-3 mb-4 print:hidden">
                <button
                  onClick={handleExportItemsPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
                  title="تصدير التقرير بصيغة PDF"
                >
                  <FileText size={18} />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleExportItemsExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-semibold shadow-md hover:shadow-lg"
                  title="تصدير الجدول الحالي إلى ملف Excel"
                >
                  <FileText size={18} />
                  <span>Excel</span>
                </button>
              </div>
            </Can> 

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/50 overflow-hidden w-full">
  <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
    <table className="w-full min-w-[1400px]" style={{ tableLayout: 'fixed', width: '100%' }}>
      <colgroup>
        <col style={{ width: '14%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '7%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '9%' }} />
        <col style={{ width: '9%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '9%' }} />
        <col style={{ width: '7%' }} />
        <col style={{ width: '8%' }} />
      </colgroup>
      <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 sticky top-0 z-10">
        <tr>
          <th 
            className="px-3 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100/50 transition-colors select-none relative group"
            onClick={() => handleSort('ITEM_NAME')}
            title="انقر للترتيب"
          >
            <div className="flex items-center justify-end gap-1.5">
              <span>اسم الصنف</span>
              {sortColumn === 'ITEM_NAME' ? (
                sortDirection === 'asc' ? (
                  <ArrowUp size={14} className="text-blue-600" strokeWidth={2.5} />
                ) : (
                  <ArrowDown size={14} className="text-blue-600" strokeWidth={2.5} />
                )
              ) : (
                <ArrowUpDown size={14} className="text-slate-500 opacity-70 group-hover:text-blue-600 group-hover:opacity-100 transition-colors" />
              )}
            </div>
          </th>
          <th 
            className="px-3 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100/50 transition-colors select-none relative group"
            onClick={() => handleSort('MAIN_CATEGORY_NAME')}
            title="انقر للترتيب"
          >
            <div className="flex items-center justify-end gap-1.5">
              <span>الرئيسي</span>
              {sortColumn === 'MAIN_CATEGORY_NAME' ? (
                sortDirection === 'asc' ? (
                  <ArrowUp size={14} className="text-blue-600" strokeWidth={2.5} />
                ) : (
                  <ArrowDown size={14} className="text-blue-600" strokeWidth={2.5} />
                )
              ) : (
                <ArrowUpDown size={14} className="text-slate-500 opacity-70 group-hover:text-blue-600 group-hover:opacity-100 transition-colors" />
              )}
            </div>
          </th>
          <th 
            className="px-3 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100/50 transition-colors select-none relative group"
            onClick={() => handleSort('SUB_CAT_NAME')}
            title="انقر للترتيب"
          >
            <div className="flex items-center justify-end gap-1.5">
              <span>الفرعي</span>
              {sortColumn === 'SUB_CAT_NAME' ? (
                sortDirection === 'asc' ? (
                  <ArrowUp size={14} className="text-blue-600" strokeWidth={2.5} />
                ) : (
                  <ArrowDown size={14} className="text-blue-600" strokeWidth={2.5} />
                )
              ) : (
                <ArrowUpDown size={14} className="text-slate-500 opacity-70 group-hover:text-blue-600 group-hover:opacity-100 transition-colors" />
              )}
            </div>
          </th>
          <th 
            className="px-3 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100/50 transition-colors select-none relative group"
            onClick={() => handleSort('ITEM_TYPE_NAME')}
            title="انقر للترتيب"
          >
            <div className="flex items-center justify-end gap-1.5">
              <span>نوع الصنف</span>
              {sortColumn === 'ITEM_TYPE_NAME' ? (
                sortDirection === 'asc' ? (
                  <ArrowUp size={14} className="text-blue-600" strokeWidth={2.5} />
                ) : (
                  <ArrowDown size={14} className="text-blue-600" strokeWidth={2.5} />
                )
              ) : (
                <ArrowUpDown size={14} className="text-slate-500 opacity-70 group-hover:text-blue-600 group-hover:opacity-100 transition-colors" />
              )}
            </div>
          </th>
          <th className="px-3 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">النوع</th>
          <th className="px-3 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">السيريال</th>
          <th className="px-3 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">المستخدم</th>
          <th className="px-3 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">القسم</th>
          <th className="px-3 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">الحالة</th>
          <th className="px-3 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">اسم الجهاز</th>
          <th className="px-3 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">IP</th>
          <th className="px-3 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">الكمية</th>
          <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">الإجراءات</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {sortedItems.map((item) => {
          const quantityStatus = getQuantityStatus(item.QUANTITY, item.MIN_QUANTITY);
          return (
            <tr key={item.ITEM_ID} className="hover:bg-blue-50/50 transition-colors duration-150 group">
              <td className="px-3 py-3 align-top">
                <div 
                  className="text-sm font-semibold text-slate-900 break-words whitespace-normal" 
                  title={item.ITEM_NAME}
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                >
                  {item.ITEM_NAME || <span className="text-slate-400">-</span>}
                </div>
              </td>
              <td className="px-3 py-3 text-sm text-slate-600 break-words whitespace-normal align-top" title={item.MAIN_CATEGORY_NAME || ''} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {item.MAIN_CATEGORY_NAME || <span className="text-slate-400">-</span>}
              </td>
              <td className="px-3 py-3 text-sm text-slate-600 break-words whitespace-normal align-top" title={item.SUB_CAT_NAME || ''} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {item.SUB_CAT_NAME || <span className="text-slate-400">-</span>}
              </td>
              <td className="px-3 py-3 align-top">
                {item.ITEM_TYPE_NAME ? (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 break-words whitespace-normal" title={item.ITEM_TYPE_NAME} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {item.ITEM_TYPE_NAME}
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm">-</span>
                )}
              </td>
              <td className="px-3 py-3 align-top">
                {item.KIND ? (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 break-words whitespace-normal" title={item.KIND} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {item.KIND}
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm">-</span>
                )}
              </td>
              <td className="px-3 py-3 text-sm text-slate-600 font-mono break-words whitespace-normal align-top" title={item.SERIAL || ''} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {item.SERIAL || <span className="text-slate-400">-</span>}
              </td>
              <td className="px-3 py-3 align-top">
                {item.ASSIGNED_USER ? (
                  <span className="inline-flex items-center gap-1 text-sm text-slate-700 break-words whitespace-normal" title={item.ASSIGNED_USER} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    <span>👤</span>
                    <span>{item.ASSIGNED_USER}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                    <span>📦</span>
                    <span>المخزن</span>
                  </span>
                )}
              </td>
              <td className="px-3 py-3 text-sm text-slate-600 break-words whitespace-normal align-top" title={item.DEPT_NAME || ''} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {item.DEPT_NAME || <span className="text-slate-400">-</span>}
              </td>
              <td className="px-3 py-3 align-top">
                {item.SITUATION ? (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold break-words whitespace-normal ${
                    item.SITUATION === 'صالح' ? 'bg-green-100 text-green-700 border border-green-200' :
                    item.SITUATION === 'عاطل' ? 'bg-red-100 text-red-700 border border-red-200' :
                    item.SITUATION === 'تحت الإصلاح' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                    item.SITUATION === 'ورشة' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                    item.SITUATION === 'كهنة' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`} title={item.SITUATION} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {item.SITUATION === 'صالح' && '🟢'}
                    {item.SITUATION === 'عاطل' && '🔴'}
                    {item.SITUATION === 'تحت الإصلاح' && '🟡'}
                    {item.SITUATION === 'ورشة' && '🔧'}
                    {item.SITUATION === 'كهنة' && '🛠️'}
                    <span>{item.SITUATION}</span>
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm">-</span>
                )}
              </td>
              <td className="px-3 py-3 text-sm text-slate-600 break-words whitespace-normal align-top" title={item.COMP_NAME || ''} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {item.COMP_NAME || <span className="text-slate-400">-</span>}
              </td>
              <td className="px-3 py-3 text-sm text-slate-600 font-mono break-words whitespace-normal align-top" title={item.IP || ''} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {item.IP || <span className="text-slate-400">-</span>}
              </td>
              <td className="px-3 py-3 align-top">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-slate-900">{item.QUANTITY ?? 0}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border ${quantityStatus.className}`}
                  >
                    {quantityStatus.label}
                  </span>
                </div>
              </td>
              <td className="px-3 py-3 align-top">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => openStockModal(item)}
                    className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="حركات المخزون"
                  >
                    <History size={14} />
                  </button>
                  <button
                    onClick={() => openModal(item)}
                    className="p-1.5 bg-amber-50 text-amber-600 rounded hover:bg-amber-100 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="تعديل"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.ITEM_ID)}
                    className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortedItems.map((item) => {
                const quantityStatus = getQuantityStatus(item.QUANTITY);
                return (
                <div key={item.ITEM_ID} className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-5 hover:shadow-xl transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="text-base font-bold text-slate-900 mb-1 line-clamp-2 break-words" 
                        title={item.ITEM_NAME}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word'
                        }}
                      >
                        {item.ITEM_NAME}
                      </h3>
                      {item.ITEM_TYPE_NAME && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                          {item.ITEM_TYPE_NAME}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openStockModal(item)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                        title="حركات المخزون"
                      >
                        <History size={18} />
                      </button>
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all"
                        title="تعديل"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.ITEM_ID)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2.5">
                    {item.MAIN_CATEGORY_NAME && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-24">التصنيف الرئيسي:</span>
                        <span className="text-slate-900">{item.MAIN_CATEGORY_NAME}</span>
                      </div>
                    )}
                    {item.SUB_CAT_NAME && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-24">التصنيف الفرعي:</span>
                        <span className="text-slate-900">{item.SUB_CAT_NAME}</span>
                      </div>
                    )}
                    {item.ITEM_TYPE_NAME && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-24">نوع الصنف:</span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                          {item.ITEM_TYPE_NAME}
                        </span>
                      </div>
                    )}
                    {item.KIND && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-24">النوع:</span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.KIND}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="font-medium w-24">الكمية:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.QUANTITY ?? 0}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${quantityStatus.className}`}>
                          {quantityStatus.label}
                        </span>
                      </div>
                    </div>
                    {item.SERIAL && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-24">السيريال:</span>
                        <span className="font-mono text-slate-900">{item.SERIAL}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-slate-600 w-24">المستخدم:</span>
                      {item.ASSIGNED_USER ? (
                        <span className="inline-flex items-center gap-1 text-slate-900">
                          <span>👤</span>
                          {item.ASSIGNED_USER}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                          <span>📦</span>
                          المخزن
                        </span>
                      )}
                    </div>
                    {item.DEPT_NAME && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-24">القسم:</span>
                        <span>{item.DEPT_NAME}</span>
                      </div>
                    )}
                    {item.FLOOR_NAME && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-24">الطابق:</span>
                        <span>{item.FLOOR_NAME}</span>
                      </div>
                    )}
                    {item.SITUATION && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-600 w-24">الحالة:</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          item.SITUATION === 'صالح' ? 'bg-green-100 text-green-700 border border-green-200' :
                          item.SITUATION === 'عاطل' ? 'bg-red-100 text-red-700 border border-red-200' :
                          item.SITUATION === 'تحت الإصلاح' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                          item.SITUATION === 'ورشة' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                          item.SITUATION === 'كهنة' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {item.SITUATION === 'صالح' && '🟢'}
                          {item.SITUATION === 'عاطل' && '🔴'}
                          {item.SITUATION === 'تحت الإصلاح' && '🟡'}
                          {item.SITUATION === 'ورشة' && '🔧'}
                          {item.SITUATION === 'كهنة' && '🛠️'}
                          {item.SITUATION}
                        </span>
                      </div>
                    )}
                    {item.COMP_NAME && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-24">اسم الجهاز:</span>
                        <span className="text-slate-900">{item.COMP_NAME}</span>
                      </div>
                    )}
                    {item.IP && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-24">IP:</span>
                        <span className="font-mono text-slate-900">{item.IP}</span>
                      </div>
                    )}
                    {item.LOCK_NUM && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-24">رقم القفل:</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          🔒 {item.LOCK_NUM}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          </>
        )}

        {/* Modal - Modern & Responsive */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 z-50 transition-opacity duration-300"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
              }
            }}
          >
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
              {/* Header with Gradient */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center shadow-lg z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Save size={20} className="text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {editingItem ? 'تعديل الصنف' : 'إضافة صنف جديد'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:rotate-90"
                  aria-label="إغلاق"
                >
                  <X size={22} className="text-white" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 sm:p-6 lg:p-8">
                  {/* Basic Information Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b-2 border-blue-100">
                      المعلومات الأساسية
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2.5">
                          <span className="text-red-500">*</span>
                          اسم الصنف
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.ITEM_NAME || ''}
                          onChange={(e) => setFormData({ ...formData, ITEM_NAME: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="أدخل اسم الصنف"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          التصنيف الرئيسي
                        </label>
                        <select
                          value={formData.CAT_ID || ''}
                          onChange={(e) => {
                            setFormData({ 
                              ...formData, 
                              CAT_ID: Number(e.target.value),
                              SUB_CAT_ID: undefined,
                              ITEM_TYPE_ID: undefined
                            });
                          }}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer"
                        >
                          <option value="">اختر التصنيف الرئيسي</option>
                          {categories.map(cat => (
                            <option key={cat.CAT_ID} value={cat.CAT_ID}>
                              {cat.CAT_NAME}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2.5">
                          <span className="text-red-500">*</span>
                          التصنيف الفرعي
                        </label>
                        <select
                          value={formData.SUB_CAT_ID || ''}
                          onChange={(e) => setFormData({ ...formData, SUB_CAT_ID: Number(e.target.value), ITEM_TYPE_ID: undefined })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!formData.CAT_ID}
                        >
                          <option value="">اختر التصنيف الفرعي</option>
                          {filteredSubCategories.map(sub => (
                            <option key={sub.SUB_CAT_ID} value={sub.SUB_CAT_ID}>
                              {sub.SUB_CAT_NAME}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          نوع الصنف
                        </label>
                        <select
                          value={formData.ITEM_TYPE_ID || ''}
                          onChange={(e) => setFormData({ ...formData, ITEM_TYPE_ID: Number(e.target.value) })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer"
                        >
                          <option value="">اختر نوع الصنف</option>
                          {filteredItemTypes.map(type => (
                            <option key={type.ITEM_TYPE_ID} value={type.ITEM_TYPE_ID}>
                              {type.ITEM_TYPE_NAME}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          الكمية في المخزون
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={
                            formData.QUANTITY === undefined || formData.QUANTITY === null
                              ? ''
                              : formData.QUANTITY
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              QUANTITY: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                          disabled={Boolean(editingItem)}
                          className={`w-full px-10 py-3 border-2 rounded-xl focus:ring-4 transition-all duration-200 ${
                            editingItem
                              ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                              : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500/20 focus:bg-white'
                          }`}
                          placeholder="0"
                        />
                        {editingItem ? (
                          <p className="text-xs text-slate-400 mt-1">
                            استخدم زر حركات المخزون لتعديل الكمية الحالية ({formData.QUANTITY ?? 0})
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1">يمكنك تحديد الكمية الابتدائية للصنف</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          الحد الأدنى للكمية
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={
                            formData.MIN_QUANTITY === undefined || formData.MIN_QUANTITY === null
                              ? ''
                              : formData.MIN_QUANTITY
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              MIN_QUANTITY: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="0"
                        />
                        <p className="text-xs text-slate-400 mt-1">سيتم التنبيه عند وصول الكمية لهذا الحد</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          وحدة القياس
                        </label>
                        <input
                          type="text"
                          value={formData.UNIT || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              UNIT: e.target.value || undefined,
                            })
                          }
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="قطعة"
                        />
                        <p className="text-xs text-slate-400 mt-1">مثال: قطعة، كرتونة، وحدة، إلخ</p>
                      </div>

                    </div>
                  </div>

                  {/* Assignment Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b-2 border-blue-100">
                      التخصيص والموقع
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          المستخدم
                        </label>
                        <select
                          value={formData.USER_ID !== undefined && formData.USER_ID !== null ? formData.USER_ID : 'warehouse'}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'warehouse') {
                              setFormData({ ...formData, USER_ID: undefined });
                            } else if (value === '') {
                              setFormData({ ...formData, USER_ID: undefined });
                            } else {
                              setFormData({ ...formData, USER_ID: Number(value) });
                            }
                          }}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer"
                        >
                          <option value="warehouse">📦 المخزن (لا يوجد مستخدم)</option>
                          {users.map(user => (
                            <option key={user.USER_ID} value={user.USER_ID}>
                              👤 {user.USER_NAME}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          القسم {departments.length > 0 && <span className="text-slate-500 text-xs">({departments.length})</span>}
                        </label>
                        <select
                          value={formData.DEPT_ID || ''}
                          onChange={(e) => setFormData({ ...formData, DEPT_ID: Number(e.target.value) })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer"
                        >
                          <option value="">اختر القسم</option>
                          {departments.length === 0 ? (
                            <option value="" disabled>لا توجد أقسام</option>
                          ) : (
                            departments.map(dept => (
                              <option key={dept.DEPT_ID} value={dept.DEPT_ID}>
                                {dept.DEPT_NAME}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          الطابق {floors.length > 0 && <span className="text-slate-500 text-xs">({floors.length})</span>}
                        </label>
                        <select
                          value={formData.FLOOR_ID || ''}
                          onChange={(e) => setFormData({ ...formData, FLOOR_ID: Number(e.target.value) })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer"
                        >
                          <option value="">اختر الطابق</option>
                          {floors.length === 0 ? (
                            <option value="" disabled>لا توجد طوابق</option>
                          ) : (
                            floors.map(floor => (
                              <option key={floor.FLOOR_ID} value={floor.FLOOR_ID}>
                                {floor.FLOOR_NAME}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          رقم القفل
                        </label>
                        <input
                          type="number"
                          value={formData.LOCK_NUM || ''}
                          onChange={(e) => setFormData({ ...formData, LOCK_NUM: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="أدخل رقم القفل"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b-2 border-blue-100">
                      التفاصيل والمعلومات
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          رقم السيريال
                        </label>
                        <input
                          type="text"
                          value={formData.SERIAL || ''}
                          onChange={(e) => setFormData({ ...formData, SERIAL: e.target.value })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="أدخل رقم السيريال"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          النوع
                        </label>
                        <select
                          value={formData.KIND || ''}
                          onChange={(e) => setFormData({ ...formData, KIND: e.target.value })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer"
                        >
                          <option value="">اختر النوع</option>
                          <option value="عهدة">عهدة</option>
                          <option value="مشتريات">مشتريات</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          الحالة
                        </label>
                        <select
                          value={formData.SITUATION || ''}
                          onChange={(e) => setFormData({ ...formData, SITUATION: e.target.value })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer"
                        >
                          <option value="">اختر الحالة</option>
                          <option value="صالح">🟢 صالح</option>
                          <option value="عاطل">🔴 عاطل</option>
                          <option value="تحت الإصلاح">🟡 تحت الإصلاح</option>
                          <option value="ورشة">🔧 ورشة</option>
                          <option value="كهنة">🛠️ كهنة</option>
                        </select>
                      </div>
          

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          IP Address
                        </label>
                        <input
                          type="text"
                          value={formData.IP || ''}
                          onChange={(e) => setFormData({ ...formData, IP: e.target.value })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="مثال: 192.168.1.1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          اسم الكمبيوتر
                        </label>
                        <input
                          type="text"
                          value={formData.COMP_NAME || ''}
                          onChange={(e) => setFormData({ ...formData, COMP_NAME: e.target.value })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="أدخل اسم الكمبيوتر"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          القرص الصلب (HDD)
                        </label>
                        <input
                          type="text"
                          value={formData.HDD || ''}
                          onChange={(e) => setFormData({ ...formData, HDD: e.target.value })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="مثال: 500GB, 1TB"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          الذاكرة العشوائية (RAM)
                        </label>
                        <input
                          type="text"
                          value={formData.RAM || ''}
                          onChange={(e) => setFormData({ ...formData, RAM: e.target.value })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="مثال: 4GB, 8GB, 16GB"
                        />
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with Actions */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Save size={20} />
                    <span>{editingItem ? 'تحديث الصنف' : 'إضافة الصنف'}</span>
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 sm:flex-initial sm:w-auto px-6 py-3.5 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
       
       )}

        {showStockModal && stockModalItem && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeStockModal();
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-emerald-600 to-sky-600 text-white px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white/80">حركات المخزون</p>
                  <h3 className="text-xl font-bold mt-1">{stockModalItem.ITEM_NAME}</h3>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-lg font-semibold flex items-center gap-1">
                      <Package size={18} />
                      {stockModalItem.QUANTITY ?? 0} {stockModalItem.UNIT || 'قطعة'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getQuantityStatus(stockModalItem.QUANTITY, stockModalItem.MIN_QUANTITY).className}`}>
                      {getQuantityStatus(stockModalItem.QUANTITY, stockModalItem.MIN_QUANTITY).label}
                    </span>
                    {stockModalItem.MIN_QUANTITY !== undefined && stockModalItem.MIN_QUANTITY > 0 && (
                      <span className="text-xs text-white/80">
                        (الحد الأدنى: {stockModalItem.MIN_QUANTITY})
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeStockModal}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="إغلاق"
                >
                  <X size={22} className="text-white" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-slate-800">تسجيل حركة جديدة</h4>
                      <button
                        onClick={() => fetchStockMovementsData(stockModalItem.ITEM_ID)}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                        title="تحديث السجل"
                      >
                        <RefreshCcw size={14} />
                        تحديث
                      </button>
                    </div>

                    {stockError && (
                      <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        {stockError}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">نوع الحركة *</label>
                        <select
                          value={stockForm.movementTypeId}
                          onChange={(e) => setStockForm((prev) => ({ ...prev, movementTypeId: e.target.value }))}
                          className="w-full px-8 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white cursor-pointer"
                        >
                          <option value="">اختر نوع الحركة</option>
                          {movementTypes.map((type) => (
                            <option key={type.MOVEMENT_TYPE_ID} value={type.MOVEMENT_TYPE_ID}>
                              {type.TYPE_NAME} ({type.TYPE_CODE})
                              {type.DESCRIPTION && ` - ${type.DESCRIPTION}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">الكمية *</label>
                        <input
                          type="number"
                          min={1}
                          step="1"
                          value={stockForm.quantity}
                          onChange={(e) => setStockForm((prev) => ({ ...prev, quantity: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                          placeholder="أدخل الكمية"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          الوحدة: <span className="font-semibold text-slate-700">{stockModalItem?.UNIT || 'قطعة'}</span>
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2"> نوع الكمية </label>
                        <input
                          type="text"
                          value={stockForm.unit}
                          onChange={(e) => setStockForm((prev) => ({ ...prev, unit: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                          placeholder="قطعة، كرتونة، وحدة"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">رقم المرجع</label>
                        <input
                          type="text"
                          value={stockForm.referenceNo}
                          onChange={(e) => setStockForm((prev) => ({ ...prev, referenceNo: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                          placeholder="مثال: PO-2024-001, REQ-2024-001"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">من قسم</label>
                          <select
                            value={stockForm.fromDeptId}
                            onChange={(e) => setStockForm((prev) => ({ ...prev, fromDeptId: e.target.value }))}
                            className="w-full px-6 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white cursor-pointer text-sm"
                          >
                            <option value="">اختر القسم</option>
                            {departments.map((dept) => (
                              <option key={dept.DEPT_ID} value={dept.DEPT_ID}>
                                {dept.DEPT_NAME}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">إلى قسم</label>
                          <select
                            value={stockForm.toDeptId}
                            onChange={(e) => setStockForm((prev) => ({ ...prev, toDeptId: e.target.value }))}
                            className="w-full px-6 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white cursor-pointer text-sm"
                          >
                            <option value="">اختر القسم</option>
                            {departments.map((dept) => (
                              <option key={dept.DEPT_ID} value={dept.DEPT_ID}>
                                {dept.DEPT_NAME}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">من طابق</label>
                          <select
                            value={stockForm.fromFloorId}
                            onChange={(e) => setStockForm((prev) => ({ ...prev, fromFloorId: e.target.value }))}
                            className="w-full px-6 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white cursor-pointer text-sm"
                          >
                            <option value="">اختر الطابق</option>
                            {floors.map((floor) => (
                              <option key={floor.FLOOR_ID} value={floor.FLOOR_ID}>
                                {floor.FLOOR_NAME}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">إلى طابق</label>
                          <select
                            value={stockForm.toFloorId}
                            onChange={(e) => setStockForm((prev) => ({ ...prev, toFloorId: e.target.value }))}
                            className="w-full px-6 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white cursor-pointer text-sm"
                          >
                            <option value="">اختر الطابق</option>
                            {floors.map((floor) => (
                              <option key={floor.FLOOR_ID} value={floor.FLOOR_ID}>
                                {floor.FLOOR_NAME}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">ملاحظات</label>
                        <textarea
                          value={stockForm.notes}
                          onChange={(e) => setStockForm((prev) => ({ ...prev, notes: e.target.value }))}
                          className="w-full min-h-[90px] px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all resize-none"
                          placeholder="سبب الحركة، القسم المستلم، رقم الفاتورة..."
                        />
                      </div>

                      <button
                        onClick={handleStockSubmit}
                        disabled={stockLoading}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-60"
                      >
                        {stockLoading ? (
                          <>
                            <span className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            جاري التنفيذ...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            حفظ الحركة
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-slate-800">سجل آخر الحركات</h4>
                      <span className="text-xs text-slate-500">
                        إجمالي السجل: {stockMovements.length} حركة
                      </span>
                    </div>

                    {stockHistoryLoading ? (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                        <div className="h-10 w-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3" />
                        جاري تحميل السجل...
                      </div>
                    ) : stockMovements.length === 0 ? (
                      <div className="text-center py-10 text-slate-500">
                        لا توجد حركات مسجلة بعد
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {stockMovements.map((movement) => {
                          const movementType = movementTypes.find(t => t.MOVEMENT_TYPE_ID === movement.MOVEMENT_TYPE_ID);
                          const isIncrease = movementType?.EFFECT === 1;
                          const isDecrease = movementType?.EFFECT === -1;
                          const isAdjustment = movementType?.TYPE_CODE === 'ADJUSTMENT';
                          return (
                          <div
                            key={movement.MOVEMENT_ID}
                            className="border border-slate-200 rounded-xl p-3 hover:border-blue-200 transition-colors relative"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    isIncrease
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                      : isDecrease
                                      ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                      : 'bg-blue-50 text-blue-700 border border-blue-100'
                                  }`}
                                >
                                  {movement.MOVEMENT_TYPE || movement.TYPE_CODE || 'غير محدد'}
                                </span>
                                <span className="text-sm font-bold text-slate-900">
                                  {movement.QUANTITY} {stockModalItem?.UNIT || 'قطعة'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                  {movement.MOVEMENT_DATE || movement.CREATED_AT
                                    ? new Date(movement.MOVEMENT_DATE || movement.CREATED_AT).toLocaleString('ar-EG')
                                    : ''}
                                </span>
                                <button
                                  onClick={() => handleDeleteMovement(movement.MOVEMENT_ID)}
                                  disabled={stockLoading}
                                  className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="حذف الحركة"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 mb-2">
                              {movement.PREVIOUS_QTY ?? 0} → {movement.NEW_QTY ?? 0}
                            </div>
                            {movement.REFERENCE_NO && (
                              <div className="text-xs text-slate-600 mb-1">
                                <span className="font-semibold">رقم المرجع:</span> {movement.REFERENCE_NO}
                              </div>
                            )}
                            {(movement.FROM_DEPT || movement.TO_DEPT) && (
                              <div className="text-xs text-slate-600 mb-1">
                                {movement.FROM_DEPT && <span>من: {movement.FROM_DEPT}</span>}
                                {movement.FROM_DEPT && movement.TO_DEPT && <span> → </span>}
                                {movement.TO_DEPT && <span>إلى: {movement.TO_DEPT}</span>}
                              </div>
                            )}
                            {(movement.FROM_FLOOR || movement.TO_FLOOR) && (
                              <div className="text-xs text-slate-600 mb-1">
                                {movement.FROM_FLOOR && <span>من طابق: {movement.FROM_FLOOR}</span>}
                                {movement.FROM_FLOOR && movement.TO_FLOOR && <span> → </span>}
                                {movement.TO_FLOOR && <span>إلى طابق: {movement.TO_FLOOR}</span>}
                              </div>
                            )}
                            {movement.NOTES && (
                              <p className="text-sm text-slate-700 mb-2">{movement.NOTES}</p>
                            )}
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              بواسطة: {movement.USER_FULL_NAME || movement.USER_NAME || movement.USER_ID}
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        
          </div>
        )}
      </div>
    </div>
  );
}