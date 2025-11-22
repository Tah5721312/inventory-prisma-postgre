'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Search, RotateCcw, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import { DOMAIN } from '@/lib/constants';
import { toastError, toastSuccess } from '@/lib/toast';

interface Permission {
  SUBJECT: string;
  ACTION: string;
  FIELD_NAME: string | null;
  CAN_ACCESS: number;
}

interface User {
  USER_ID: number;
  USERNAME: string;
  FULL_NAME: string;
  EMAIL: string;
  ROLE_NAME: string;
  ROLE_ID: number;
  PERMISSIONS: Permission[];
}

interface Role {
  ROLE_ID: number;
  NAME: string;
  DESCRIPTION?: string;
  IS_ACTIVE?: number;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [originalUserId, setOriginalUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [usernameFilter, setUsernameFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const usersResponse = await fetch(`${DOMAIN}/api/users`);
        const usersData = await usersResponse.json();
        
        if (usersData.users) {
          setUsers(usersData.users);
          setFilteredUsers(usersData.users);
        }

        const rolesResponse = await fetch(`${DOMAIN}/api/roles`);
        const rolesData = await rolesResponse.json();
        
        if (rolesData.roles) {
          setRoles(rolesData.roles);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    let filtered = users;

    if (usernameFilter) {
      filtered = filtered.filter(user => 
        user.USERNAME.toLowerCase().includes(usernameFilter.toLowerCase())
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(user => user.ROLE_NAME === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleResetSearch = () => {
    setUsernameFilter('');
    setRoleFilter('');
    setFilteredUsers(users);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setOriginalUserId(user.USER_ID);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (userId: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        const response = await fetch(`${DOMAIN}/api/users/${userId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setUsers(users.filter(u => u.USER_ID !== userId));
          setFilteredUsers(filteredUsers.filter(u => u.USER_ID !== userId));
          toastSuccess('تم حذف المستخدم بنجاح');
        } else {
          toastError('فشل في حذف المستخدم');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toastError('حدث خطأ أثناء حذف المستخدم');
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`${DOMAIN}/api/users/${originalUserId ?? selectedUser.USER_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: selectedUser.USERNAME,
          email: selectedUser.EMAIL,
          fullName: selectedUser.FULL_NAME,
          roleId: selectedUser.ROLE_ID,
          newUserId: (originalUserId !== null && selectedUser.USER_ID !== originalUserId) ? selectedUser.USER_ID : undefined,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        const updatedUser = responseData.user;
        
        const updatedUsers = users.map(u => 
          u.USER_ID === (originalUserId ?? selectedUser.USER_ID) ? updatedUser : u
        );
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        setSelectedUser(updatedUser);
        setOriginalUserId(updatedUser.USER_ID);
        
        setIsEditModalOpen(false);
        toastSuccess('تم تحديث المستخدم بنجاح');
      } else {
        toastError('فشل في تحديث المستخدم');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toastError('حدث خطأ أثناء تحديث المستخدم');
    }
  };

  return (
    <div className="min-h-screen card py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  إدارة المستخدمين
                </h1>
                <p className="text-sm text-gray-600 mt-1">إدارة وتحكم كامل بحسابات المستخدمين</p>
              </div>
            </div>
            
            <Link href='/new'
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <Plus size={20} />
              <span>إضافة مستخدم جديد</span>
            </Link>
            
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">عدد الأدوار</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{roles.length}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Shield className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المستخدمين النشطين</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{filteredUsers.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Search size={20} className="text-blue-600" />
            البحث والتصفية
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المستخدم
              </label>
              <input
                type="text"
                value={usernameFilter}
                onChange={(e) => setUsernameFilter(e.target.value)}
                placeholder="ابحث باسم المستخدم..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الدور الوظيفي
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none bg-white"
              >
                <option value="">كل الأدوار</option>
                {roles.map(role => (
                  <option key={role.ROLE_ID} value={role.NAME}>
                    {role.NAME}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3">
              <button
                onClick={handleSearch}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Search size={18} />
                <span className="hidden sm:inline">بحث</span>
              </button>
              <button
                onClick={handleResetSearch}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <RotateCcw size={18} />
                <span className="hidden sm:inline">إعادة تعيين</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-xs text-left font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                  <th className="px-4 sm:px-6 py-4 text-xs text-left font-semibold text-gray-700 uppercase tracking-wider">اسم المستخدم</th>
                  <th className="hidden md:table-cell px-4 text-left sm:px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">الاسم الكامل</th>
                  <th className="px-4 sm:px-6 py-4 text-xs text-left font-semibold text-gray-700 uppercase tracking-wider">الدور</th>
                  <th className="hidden lg:table-cell px-4 text-left sm:px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">الصلاحيات</th>
                  <th className="px-4 sm:px-6 py-4  text-xs text-left font-semibold text-gray-700 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                        <span className="text-gray-600 font-medium">جاري التحميل...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">لا توجد بيانات للمستخدمين</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                  <tr key={user.USER_ID} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-gray-900">{user.USER_ID}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {user.USERNAME.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.USERNAME}</p>
                          <p className="text-xs text-gray-500 truncate md:hidden">{user.FULL_NAME}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-700">{user.FULL_NAME}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-xs font-semibold shadow-sm">
                        {user.ROLE_NAME}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-4 sm:px-6 py-4">
                      <div className="space-y-1.5">
                        {user.PERMISSIONS.slice(0, 2).map((perm, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-2 py-1.5">
                            <span className="font-semibold text-gray-700">{perm.SUBJECT}</span>
                            <span className="text-gray-500">-</span>
                            <span className="text-gray-600">{perm.ACTION}</span>
                            {perm.FIELD_NAME && <span className="text-gray-500">({perm.FIELD_NAME})</span>}
                            <span className={`ml-auto ${perm.CAN_ACCESS ? 'text-green-600' : 'text-red-600'} font-bold`}>
                              {perm.CAN_ACCESS ? '✓' : '✗'}
                            </span>
                          </div>
                        ))}
                        {user.PERMISSIONS.length > 2 && (
                          <div className="text-xs text-gray-500 font-medium px-2">
                            +{user.PERMISSIONS.length - 2} المزيد...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.USER_ID)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile list view */}
        
        <div className="sm:hidden space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 text-center">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
                <span className="text-gray-600 font-medium">جاري التحميل...</span>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <Users className="w-14 h-14 text-gray-300" />
                <p className="text-gray-500 font-medium">لا توجد بيانات للمستخدمين</p>
              </div>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.USER_ID} className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {user.USERNAME.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.USERNAME}</p>
                      <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-[10px] font-semibold shadow-sm whitespace-nowrap">
                        {user.ROLE_NAME}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user.FULL_NAME}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-[11px] text-gray-600">
                    صلاحيات: <span className="font-semibold">{user.PERMISSIONS.length}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                      title="تعديل"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.USER_ID)}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                    <Edit className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">تعديل المستخدم</h2>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-all duration-200"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    معرف المستخدم
                  </label>
                  <input
                    type="number"
                    value={selectedUser.USER_ID}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsed = value === '' ? 0 : parseInt(value, 10);
                      setSelectedUser({ ...selectedUser, USER_ID: isNaN(parsed) ? selectedUser.USER_ID : parsed });
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    اسم المستخدم *
                  </label>
                  <input
                    type="text"
                    value={selectedUser.USERNAME}
                    onChange={(e) => setSelectedUser({...selectedUser, USERNAME: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    value={selectedUser.FULL_NAME}
                    onChange={(e) => setSelectedUser({...selectedUser, FULL_NAME: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الدور الوظيفي *
                  </label>
                  <select
                    value={selectedUser.ROLE_ID}
                    onChange={(e) => {
                      const roleId = parseInt(e.target.value);
                      const roleName = roles.find(r => r.ROLE_ID === roleId)?.NAME || '';
                      setSelectedUser({...selectedUser, ROLE_ID: roleId, ROLE_NAME: roleName});
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none bg-white"
                    required
                  >
                    {roles.map(role => (
                      <option key={role.ROLE_ID} value={role.ROLE_ID}>
                        {role.NAME}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    value={selectedUser.EMAIL}
                    onChange={(e) => setSelectedUser({...selectedUser, EMAIL: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Shield size={16} className="text-blue-600" />
                    الصلاحيات
                  </label>
                  <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                    <div className="space-y-2">
                      {selectedUser.PERMISSIONS.map((perm, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2.5 px-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors duration-200">
                          <div className="text-sm flex-1">
                            <span className="font-semibold text-gray-800">{perm.SUBJECT}</span>
                            <span className="text-gray-500 mx-2">-</span>
                            <span className="text-gray-700">{perm.ACTION}</span>
                            {perm.FIELD_NAME && <span className="text-gray-600"> ({perm.FIELD_NAME})</span>}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${perm.CAN_ACCESS ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {perm.CAN_ACCESS ? 'مسموح' : 'غير مسموح'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    حفظ التغييرات
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}