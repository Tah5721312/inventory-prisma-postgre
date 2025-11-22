'use client';

import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { DOMAIN } from '@/lib/constants';

interface MainCategory {
  CAT_ID: number;
  CAT_NAME: string;
  DESCRIPTION?: string;
}

export default function MainCategoriesPage() {
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MainCategory | null>(null);
const [formData, setFormData] = useState({ CAT_NAME: '', DESCRIPTION: '' });
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // جلب البيانات
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${DOMAIN}/api/main-categories`);
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
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

  const handleOpenModal = (category?: MainCategory) => {
   if (category) {
  setEditingCategory(category);
  setFormData({
    CAT_NAME: category.CAT_NAME,
    DESCRIPTION: category.DESCRIPTION || '',
  });
} else {
  setEditingCategory(null);
  setFormData({ CAT_NAME: '', DESCRIPTION: '' });
}
    setNotification(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ CAT_NAME: '', DESCRIPTION: '' });
    setNotification(null);
  };

  const handleSubmit = async () => {
    if (!formData.CAT_NAME.trim()) return;

    setSubmitting(true);
    try {
      const url = editingCategory
        ? `${DOMAIN}/api/main-categories/${editingCategory.CAT_ID}`
        : `${DOMAIN}/api/main-categories`;

        // ✅ هنا بننظّف البيانات قبل الإرسال
    const body = {
      CAT_NAME: formData.CAT_NAME.trim(),
      DESCRIPTION: formData.DESCRIPTION.trim(),
    };
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
 
      const result = await response.json();
      if (result.success) {
        showNotification('success', editingCategory ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح');
        fetchCategories();
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
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;

    try {
      const response = await fetch(`${DOMAIN}/api/main-categories/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        showNotification('success', 'تم الحذف بنجاح');
        fetchCategories();
      } else {
        // ✅ عرض رسالة خطأ آمنة (React يقوم بـ escaping تلقائياً، لكن نتأكد من وجود message)
        const errorMessage = typeof result.error === 'string' ? result.error : 'فشل في الحذف';
        showNotification('error', errorMessage);
      }
    } catch (error) {
      showNotification('error', 'فشل في حذف التصنيف');
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.CAT_NAME.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
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
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            إدارة التصنيفات الرئيسية
          </h1>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ابحث عن تصنيف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors text-right"
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full md:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              إضافة تصنيف جديد
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-slate-400 mb-4">
              <Search className="w-16 h-16 mx-auto mb-4" />
            </div>
            <p className="text-slate-600 text-lg">لا توجد تصنيفات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <div
                key={category.CAT_ID}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 mb-2 text-right">
                      {category.CAT_NAME}
                    </h3>
                    <p className="text-sm text-slate-500 text-right">
                      رقم التصنيف: {category.CAT_ID}
                    </p>
           
                     <p className="text-slate-600 text-sm mt-2 text-right">
                       <span className="font-semibold text-slate-700">الوصف:</span> {category.DESCRIPTION}
                     </p>
                  

                  </div>
                </div>
                
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenModal(category)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-2.5 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(category.CAT_ID)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {notification && notification.type === 'error' && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 text-right">{notification.message}</p>
                </div>
              )}
              <div className="mb-6">
                <label className="block text-slate-700 font-semibold mb-3 text-right">
                  اسم التصنيف
                </label>
                <input
                  type="text"
                  value={formData.CAT_NAME}
                  onChange={(e) => {
                    setFormData({ ...formData, CAT_NAME: e.target.value });
                    if (notification) setNotification(null);
                  }}
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors text-right ${
                    notification && notification.type === 'error' ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="أدخل اسم التصنيف"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmit();
                    }
                  }}
                />
              </div>
<div className="mb-6">
  <label className="block text-slate-700 font-semibold mb-3 text-right">
    وصف التصنيف
  </label>
  <textarea
    value={formData.DESCRIPTION}
    onChange={(e) => setFormData({ ...formData, DESCRIPTION: e.target.value })}
    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors text-right"
    placeholder="أدخل وصف التصنيف (اختياري)"
    rows={3}
  />
</div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    editingCategory ? 'حفظ التعديلات' : 'إضافة'
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