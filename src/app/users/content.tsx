'use client';

import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Search, Loader2, CheckCircle, AlertCircle, Users, Mail, Phone, Building2, Award, Building, Shield, Lock } from 'lucide-react';
import { DOMAIN } from '@/lib/constants';

interface Permission {
  SUBJECT: string;
  ACTION: string;
  FIELD_NAME: string | null;
  CAN_ACCESS: number;
}

interface User {
  USER_ID: number;
  USERNAME: string;
  EMAIL: string;
  FULL_NAME: string;
  PHONE?: string;
  IS_ACTIVE?: number;
  ROLE_NAME?: string;
  DEPT_NAME?: string;
  RANK_NAME?: string;
  FLOOR_NAME?: string;
  ROLE_ID?: number;
  DEPT_ID?: number;
  RANK_ID?: number;
  FLOOR_ID?: number;
  PERMISSIONS?: Permission[];
}

interface Role {
  ROLE_ID: number;
  NAME: string;
}

interface Department {
  DEPT_ID: number;
  DEPT_NAME: string;
}

interface Rank {
  RANK_ID: number;
  RANK_NAME: string;
}

interface Floor {
  FLOOR_ID: number;
  FLOOR_NAME: string;
}

export default function UsersPageContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    password: '',
    isActive: 1,
    roleId: '',
    deptId: '',
    rankId: '',
    floorId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  // جلب البيانات
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      try {
        const usersResponse = await fetch(`${DOMAIN}/api/users`);
        const usersResult = await usersResponse.json();
        
        // ✅ التعامل مع البيانات بشكل صحيح - إذا كانت المصفوفة فارغة، نضعها فارغة بدون إظهار خطأ
        if (usersResult.users && Array.isArray(usersResult.users)) {
          setUsers(usersResult.users);
          // Extract unique roles from users (since /api/roles doesn't exist)
          const uniqueRoles = new Map<number, Role>();
          usersResult.users.forEach((user: User) => {
            if (user.ROLE_ID && user.ROLE_NAME && !uniqueRoles.has(user.ROLE_ID)) {
              uniqueRoles.set(user.ROLE_ID, {
                ROLE_ID: user.ROLE_ID,
                NAME: user.ROLE_NAME
              });
            }
          });
          if (uniqueRoles.size > 0) {
            setRoles(Array.from(uniqueRoles.values()));
          }
        } else if (usersResult.success === false && usersResult.error) {
          // خطأ من السيرفر - نضع المصفوفة فارغة فقط، سيظهر "لا توجد مستخدمين" تلقائياً
          setUsers([]);
        } else if (Array.isArray(usersResult)) {
          // إذا كان الـ response array مباشر
          setUsers(usersResult);
        } else {
          // استجابة غير متوقعة - نضع المصفوفة فارغة
          setUsers([]);
        }
      } catch (error) {
        // في حالة catch، نضع المصفوفة فارغة بدون إظهار console.error أو notification
        // سيتم عرض "لا توجد مستخدمين" تلقائياً إذا كانت المصفوفة فارغة
        setUsers([]);
      }

      // Fetch departments
      try {
        const departmentsResponse = await fetch(`${DOMAIN}/api/departments`);
        const departmentsResult = await departmentsResponse.json();
        
        if (Array.isArray(departmentsResult.data)) {
          setDepartments(departmentsResult.data);
        } else if (Array.isArray(departmentsResult)) {
          setDepartments(departmentsResult);
        } else {
          setDepartments([]);
        }
      } catch (error) {
        // في حالة catch، نضع المصفوفة فارغة بدون إظهار console.error
        setDepartments([]);
      }

      // Fetch ranks
      try {
        const ranksResponse = await fetch(`${DOMAIN}/api/ranks`);
        const ranksResult = await ranksResponse.json();
        
        if (Array.isArray(ranksResult.data)) {
          setRanks(ranksResult.data);
        } else if (Array.isArray(ranksResult)) {
          setRanks(ranksResult);
        } else {
          setRanks([]);
        }
      } catch (error) {
        // في حالة catch، نضع المصفوفة فارغة بدون إظهار console.error
        setRanks([]);
      }

      // Fetch floors
      try {
        const floorsResponse = await fetch(`${DOMAIN}/api/floors`);
        const floorsResult = await floorsResponse.json();
        
        if (Array.isArray(floorsResult.data)) {
          setFloors(floorsResult.data);
        } else if (Array.isArray(floorsResult)) {
          setFloors(floorsResult);
        } else {
          setFloors([]);
        }
      } catch (error) {
        // في حالة catch، نضع المصفوفة فارغة بدون إظهار console.error
        setFloors([]);
      }
    } catch (error) {
      // في حالة catch عامة، نضع البيانات فارغة فقط
      // سيتم عرض "لا توجد مستخدمين" تلقائياً إذا كانت المصفوفة فارغة
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.USERNAME,
        email: user.EMAIL,
        fullName: user.FULL_NAME,
        phone: user.PHONE || '',
        password: '', // Don't show password when editing
        isActive: user.IS_ACTIVE ?? 1,
        roleId: user.ROLE_ID?.toString() || '',
        deptId: user.DEPT_ID?.toString() || '',
        rankId: user.RANK_ID?.toString() || '',
        floorId: user.FLOOR_ID?.toString() || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        fullName: '',
        phone: '',
        password: '',
        isActive: 1,
        roleId: '',
        deptId: '',
        rankId: '',
        floorId: '',
      });
    }
    setUserError(null);
    setNotification(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      fullName: '',
      phone: '',
      password: '',
      isActive: 1,
      roleId: '',
      deptId: '',
      rankId: '',
      floorId: '',
    });
    setUserError(null);
    setNotification(null);
  };

  const handleSubmit = async () => {
    if (!formData.username.trim() || !formData.email.trim() || !formData.fullName.trim()) {
      setUserError('اسم المستخدم والبريد الإلكتروني والاسم الكامل مطلوبة');
      return;
    }

    // Password is required only when creating new user
    if (!editingUser && !formData.password.trim()) {
      setUserError('كلمة المرور مطلوبة عند إنشاء مستخدم جديد');
      return;
    }

    // RoleId is required
    if (!formData.roleId) {
      setUserError('الدور مطلوب');
      return;
    }

    setSubmitting(true);
    setUserError(null);
    try {
      if (editingUser) {
        // Update user - API expects: username, email, fullName, roleId (and optional: phone, deptId, rankId, floorId, isActive)
        const url = `${DOMAIN}/api/users/${editingUser.USER_ID}`;
        const body: any = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          roleId: parseInt(formData.roleId),
        };

        // Add optional fields
        if (formData.phone !== undefined) {
          body.phone = formData.phone.trim() || null;
        }
        if (formData.isActive !== undefined) {
          body.isActive = formData.isActive;
        }
        if (formData.deptId !== undefined) {
          body.deptId = formData.deptId ? parseInt(formData.deptId) : null;
        }
        if (formData.rankId !== undefined) {
          body.rankId = formData.rankId ? parseInt(formData.rankId) : null;
        }
        if (formData.floorId !== undefined) {
          body.floorId = formData.floorId ? parseInt(formData.floorId) : null;
        }

        const response = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const result = await response.json();
        if (result.message || result.user) {
          showNotification('success', 'تم التحديث بنجاح');
          fetchData();
          handleCloseModal();
        } else {
          // ✅ عرض رسالة خطأ آمنة (React يقوم بـ escaping تلقائياً، لكن نتأكد من وجود message)
          const errorMsg = typeof result.error === 'string' ? result.error : 'حدث خطأ';
          setUserError(errorMsg);
          showNotification('error', errorMsg);
        }
      } else {
        // Create user - API expects: username, email, fullName, password, roleId (and optional: phone, deptId, rankId, floorId, isActive)
        const url = `${DOMAIN}/api/users`;
        const body: any = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          password: formData.password,
          roleId: parseInt(formData.roleId),
        };

        // Add optional fields
        if (formData.phone.trim()) {
          body.phone = formData.phone.trim();
        }
        if (formData.isActive !== undefined) {
          body.isActive = formData.isActive;
        }
        if (formData.deptId) {
          body.deptId = parseInt(formData.deptId);
        }
        if (formData.rankId) {
          body.rankId = parseInt(formData.rankId);
        }
        if (formData.floorId) {
          body.floorId = parseInt(formData.floorId);
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const result = await response.json();
        if (result.message) {
          showNotification('success', 'تم الإضافة بنجاح');
          fetchData();
          handleCloseModal();
        } else {
          // ✅ عرض رسالة خطأ آمنة (React يقوم بـ escaping تلقائياً، لكن نتأكد من وجود message)
          const errorMsg = typeof result.error === 'string' ? result.error : 'حدث خطأ';
          setUserError(errorMsg);
          showNotification('error', errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = 'فشل في حفظ البيانات';
      setUserError(errorMsg);
      showNotification('error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      const response = await fetch(`${DOMAIN}/api/users/${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.message) {
        showNotification('success', 'تم الحذف بنجاح');
        fetchData();
      } else {
        // ✅ عرض رسالة خطأ آمنة (React يقوم بـ escaping تلقائياً، لكن نتأكد من وجود message)
        const errorMsg = typeof result.error === 'string' ? result.error : 'فشل في الحذف';
        showNotification('error', errorMsg);
      }
    } catch (error) {
      showNotification('error', 'فشل في حذف المستخدم');
    }
  };

  const filteredUsers = users.filter(user =>
    user.USERNAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.FULL_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.EMAIL.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 md:p-8 mb-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">إدارة المستخدمين</h1>
                <p className="text-blue-100">إدارة وتنظيم مستخدمي النظام مع الصلاحيات</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              إضافة مستخدم جديد
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          } px-6 py-4 rounded-lg shadow-xl flex items-center gap-3`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث عن مستخدم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600 text-lg">لا توجد مستخدمين</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.USER_ID}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {user.FULL_NAME.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{user.FULL_NAME}</h3>
                        <p className="text-sm text-slate-500">@{user.USERNAME}</p>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{user.EMAIL}</span>
                      </div>
                      {user.PHONE && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm">{user.PHONE}</span>
                        </div>
                      )}
                      {user.ROLE_NAME && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm">{user.ROLE_NAME}</span>
                        </div>
                      )}
                      {user.DEPT_NAME && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Building2 className="w-4 h-4" />
                          <span className="text-sm">{user.DEPT_NAME}</span>
                        </div>
                      )}
                      {user.RANK_NAME && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Award className="w-4 h-4" />
                          <span className="text-sm">{user.RANK_NAME}</span>
                        </div>
                      )}
                      {user.FLOOR_NAME && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Building className="w-4 h-4" />
                          <span className="text-sm">{user.FLOOR_NAME}</span>
                        </div>
                      )}
                      {user.PERMISSIONS && user.PERMISSIONS.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-500 mb-1">الصلاحيات: {user.PERMISSIONS.length}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          (user.IS_ACTIVE === 1 || user.IS_ACTIVE === undefined)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {(user.IS_ACTIVE === 1 || user.IS_ACTIVE === undefined) ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-2.5 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(user.USER_ID)}
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

        {/* Modal */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={handleCloseModal}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col transform transition-all scale-100 animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">
                        {editingUser ? 'قم بتعديل بيانات المستخدم' : 'أدخل بيانات المستخدم الجديد'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                {userError && (
                  <div className="mb-6 p-4 bg-red-50 border-r-4 border-red-500 rounded-lg animate-in slide-in-from-right duration-300">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-700 text-right">{userError}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 pb-3 border-b border-slate-200 flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                      المعلومات الأساسية
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="flex items-center justify-end gap-2 text-slate-700 font-semibold mb-2">
                          <span>اسم المستخدم</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => {
                            setFormData({ ...formData, username: e.target.value });
                            if (userError) setUserError(null);
                          }}
                          className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all text-right ${
                            userError ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                          placeholder="أدخل اسم المستخدم"
                        />
                      </div>

                      <div>
                        <label className="flex items-center justify-end gap-2 text-slate-700 font-semibold mb-2">
                          <span>البريد الإلكتروني</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            if (userError) setUserError(null);
                          }}
                          className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all text-right ${
                            userError ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                          placeholder="أدخل البريد الإلكتروني"
                        />
                      </div>

                      <div>
                        <label className="flex items-center justify-end gap-2 text-slate-700 font-semibold mb-2">
                          <span>الاسم الكامل</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => {
                            setFormData({ ...formData, fullName: e.target.value });
                            if (userError) setUserError(null);
                          }}
                          className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all text-right ${
                            userError ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                          placeholder="أدخل الاسم الكامل"
                        />
                      </div>

                      {!editingUser && (
                        <div>
                          <label className="flex items-center justify-end gap-2 text-slate-700 font-semibold mb-2">
                            <span>كلمة المرور</span>
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => {
                              setFormData({ ...formData, password: e.target.value });
                              if (userError) setUserError(null);
                            }}
                            className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all text-right ${
                              userError ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                            }`}
                            placeholder="أدخل كلمة المرور"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-700 font-semibold mb-2 text-right">
                          رقم الهاتف
                        </label>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all text-right"
                          placeholder="أدخل رقم الهاتف"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role and Organization Section */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 pb-3 border-b border-slate-200 flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                      الدور والتنظيم
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="flex items-center justify-end gap-2 text-slate-700 font-semibold mb-2">
                          <span>الدور</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.roleId}
                          onChange={(e) => {
                            setFormData({ ...formData, roleId: e.target.value });
                            if (userError) setUserError(null);
                          }}
                          className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all text-right appearance-none bg-white ${
                            userError ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23334155' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'left 1rem center',
                            paddingLeft: '2.5rem'
                          }}
                        >
                          <option value="">اختر الدور</option>
                          {roles.map((role) => (
                            <option key={role.ROLE_ID} value={role.ROLE_ID}>
                              {role.NAME}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-2 text-right">
                          القسم
                        </label>
                        <select
                          value={formData.deptId}
                          onChange={(e) => setFormData({ ...formData, deptId: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all text-right appearance-none bg-white"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23334155' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'left 1rem center',
                            paddingLeft: '2.5rem'
                          }}
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
                        <label className="block text-slate-700 font-semibold mb-2 text-right">
                          الرتبة
                        </label>
                        <select
                          value={formData.rankId}
                          onChange={(e) => setFormData({ ...formData, rankId: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all text-right appearance-none bg-white"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23334155' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'left 1rem center',
                            paddingLeft: '2.5rem'
                          }}
                        >
                          <option value="">اختر الرتبة</option>
                          {ranks.map((rank) => (
                            <option key={rank.RANK_ID} value={rank.RANK_ID}>
                              {rank.RANK_NAME}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-2 text-right">
                          الطابق
                        </label>
                        <select
                          value={formData.floorId}
                          onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all text-right appearance-none bg-white"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23334155' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'left 1rem center',
                            paddingLeft: '2.5rem'
                          }}
                        >
                          <option value="">اختر الطابق</option>
                          {floors.map((floor) => (
                            <option key={floor.FLOOR_ID} value={floor.FLOOR_ID}>
                              {floor.FLOOR_NAME}
                            </option>
                          ))}
                        </select>
                      </div>

                      {editingUser && (
                        <div>
                          <label className="block text-slate-700 font-semibold mb-2 text-right">
                            الحالة
                          </label>
                          <select
                            value={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all text-right appearance-none bg-white"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23334155' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'left 1rem center',
                              paddingLeft: '2.5rem'
                            }}
                          >
                            <option value={1}>نشط</option>
                            <option value={0}>غير نشط</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-white border-t border-slate-200 px-8 py-6 flex gap-4">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.username.trim() || !formData.email.trim() || !formData.fullName.trim() || !formData.roleId || (!editingUser && !formData.password.trim())}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {editingUser ? 'حفظ التعديلات' : 'إضافة مستخدم'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

