// app/item-types/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Plus, X, Search, Loader2, CheckCircle, AlertCircle, Package, FolderTree } from 'lucide-react';
import { DOMAIN } from '@/lib/constants';

interface SubCategory {
  SUB_CAT_ID: number;
  SUB_CAT_NAME: string;
  CAT_ID: number;
}

interface ItemType {
  ITEM_TYPE_ID: number;
  ITEM_TYPE_NAME: string;
  SUB_CAT_ID: number;
  SUB_CAT_NAME?: string;
}

export default function ItemTypesPage() {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemType, setEditingItemType] = useState<ItemType | null>(null);
  const [formData, setFormData] = useState({ ITEM_TYPE_NAME: '', SUB_CAT_ID: '' });
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const itemTypeNameInputRef = useRef<HTMLInputElement>(null);

  // جلب البيانات
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemTypesResponse, subCategoriesResponse] = await Promise.all([
        fetch(`${DOMAIN}/api/item-types`),
        fetch(`${DOMAIN}/api/sub-categories`)
      ]);
      
      const itemTypesResult = await itemTypesResponse.json();
      const subCategoriesResult = await subCategoriesResponse.json();
      
      if (itemTypesResult.success) {
        setItemTypes(itemTypesResult.data);
      }
      if (subCategoriesResult.success) {
        setSubCategories(subCategoriesResult.data);
      }
    } catch (error) {
      showNotification('error', 'فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenModal = (itemType?: ItemType) => {
    if (itemType) {
      setEditingItemType(itemType);
      setFormData({
        ITEM_TYPE_NAME: itemType.ITEM_TYPE_NAME,
        SUB_CAT_ID: itemType.SUB_CAT_ID.toString(),
      });
    } else {
      setEditingItemType(null);
      setFormData({ ITEM_TYPE_NAME: '', SUB_CAT_ID: '' });
    }
    setNotification(null);
    setIsModalOpen(true);
    // Focus input after modal opens
    setTimeout(() => {
      if (itemTypeNameInputRef.current) {
        itemTypeNameInputRef.current.focus();
        // For RTL, place cursor at the end (left side visually)
        if (itemTypeNameInputRef.current.value) {
          const length = itemTypeNameInputRef.current.value.length;
          itemTypeNameInputRef.current.setSelectionRange(length, length);
        }
      }
    }, 150);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItemType(null);
    setFormData({ ITEM_TYPE_NAME: '', SUB_CAT_ID: '' });
    setNotification(null);
  };

  const handleSubmit = async () => {
    if (!formData.ITEM_TYPE_NAME.trim() || !formData.SUB_CAT_ID) return;

    setSubmitting(true);
    try {
      const url = editingItemType
        ? `${DOMAIN}/api/item-types/${editingItemType.ITEM_TYPE_ID}`
        : `${DOMAIN}/api/item-types`;

      const body = {
        ITEM_TYPE_NAME: formData.ITEM_TYPE_NAME.trim(),
        SUB_CAT_ID: parseInt(formData.SUB_CAT_ID),
      };

      const response = await fetch(url, {
        method: editingItemType ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
 
      const result = await response.json();
      if (result.success) {
        showNotification('success', editingItemType ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح');
        fetchData();
        handleCloseModal();
      } else {
        // ✅ عرض رسالة خطأ آمنة (React يقوم بـ escaping تلقائياً، لكن نتأكد من وجود message)
        const errorMessage = typeof result.error === 'string' ? result.error : 'حدث خطأ';
        showNotification('error', errorMessage);
      }
    } catch (error) {
      showNotification('error', 'فشل في حفظ البيانات');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا النوع؟')) return;

    try {
      const response = await fetch(`${DOMAIN}/api/item-types/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        showNotification('success', 'تم الحذف بنجاح');
        fetchData();
      } else {
        // ✅ عرض رسالة خطأ آمنة (React يقوم بـ escaping تلقائياً، لكن نتأكد من وجود message)
        const errorMessage = typeof result.error === 'string' ? result.error : 'فشل في الحذف';
        showNotification('error', errorMessage);
      }
    } catch (error) {
      showNotification('error', 'فشل في حذف النوع');
    }
  };

  const filteredItemTypes = itemTypes.filter(itemType =>
    itemType.ITEM_TYPE_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
    itemType.SUB_CAT_NAME?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-4 md:p-8">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-xl ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-5">
            <Package className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              إدارة أنواع الأصناف
            </h1>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ابحث عن نوع صنف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none transition-colors text-right"
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full md:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              إضافة نوع صنف جديد
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
          </div>
        ) : filteredItemTypes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-slate-400 mb-4">
              <Package className="w-16 h-16 mx-auto mb-4" />
            </div>
            <p className="text-slate-600 text-lg">لا توجد أنواع أصناف</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItemTypes.map((itemType) => (
              <div
                key={itemType.ITEM_TYPE_ID}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-purple-200 flex flex-col min-h-0"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-lg font-bold text-slate-800 mb-2 text-right break-words line-clamp-2"
                      title={itemType.ITEM_TYPE_NAME}
                      style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {itemType.ITEM_TYPE_NAME}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-500 text-right">
                        رقم النوع: {itemType.ITEM_TYPE_ID}
                      </p>
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium break-words max-w-full">
                          <FolderTree className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{itemType.SUB_CAT_NAME || 'غير محدد'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4 mt-auto border-t border-slate-100">
                  <button
                    onClick={() => handleOpenModal(itemType)}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-50 text-purple-600 px-4 py-2.5 rounded-lg font-medium hover:bg-purple-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">تعديل</span>
                  </button>
                  <button
                    onClick={() => handleDelete(itemType.ITEM_TYPE_ID)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">حذف</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 p-4 overflow-y-auto"
          onClick={handleCloseModal}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg md:max-w-2xl transform transition-all scale-100 my-auto flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl flex-shrink-0">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 pr-2 flex-1 text-right">
                {editingItemType ? 'تعديل نوع الصنف' : 'إضافة نوع صنف جديد'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-white rounded-lg flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1" style={{ minHeight: 0 }}>
              {notification && notification.type === 'error' && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-600 text-right">{notification.message}</p>
                  </div>
                </div>
              )}
              
              {/* اسم نوع الصنف */}
              <div>
                <label className="block text-slate-700 font-semibold mb-2 text-right text-sm">
                  اسم نوع الصنف <span className="text-red-500">*</span>
                </label>
                <input
                  ref={itemTypeNameInputRef}
                  type="text"
                  value={formData.ITEM_TYPE_NAME}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setFormData({ ...formData, ITEM_TYPE_NAME: newValue });
                    if (notification) setNotification(null);
                  }}
                  onFocus={(e) => {
                    // Move cursor to end of text when focusing (for RTL)
                    const input = e.target as HTMLInputElement;
                    if (input && input.value) {
                      setTimeout(() => {
                        input.setSelectionRange(input.value.length, input.value.length);
                      }, 0);
                    }
                  }}
                  className={`w-full px-4 py-2.5 text-base rounded-lg border-2 focus:outline-none transition-all text-right ${
                    notification && notification.type === 'error' 
                      ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200' 
                      : 'border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-200'
                  }`}
                  placeholder="أدخل اسم نوع الصنف"
                  autoComplete="off"
                  dir="rtl"
                />
              </div>

              {/* التصنيف الفرعي */}
              <div>
                <label className="block text-slate-700 font-semibold mb-2 text-right text-sm">
                  التصنيف الفرعي <span className="text-red-500">*</span>
                </label>
                <div className="relative w-full">
                  <select
                    value={formData.SUB_CAT_ID}
                    onChange={(e) => setFormData({ ...formData, SUB_CAT_ID: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border-2 border-slate-200 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-all text-right appearance-none bg-white cursor-pointer"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23334155' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      paddingRight: '2.5rem',
                      direction: 'rtl'
                    }}
                  >
                    <option value="">اختر التصنيف الفرعي</option>
                    {subCategories.map((subCat) => (
                      <option key={subCat.SUB_CAT_ID} value={subCat.SUB_CAT_ID} title={subCat.SUB_CAT_NAME}>
                        {subCat.SUB_CAT_NAME}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-200 flex-shrink-0">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.ITEM_TYPE_NAME.trim() || !formData.SUB_CAT_ID}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    editingItemType ? 'حفظ التعديلات' : 'إضافة'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}