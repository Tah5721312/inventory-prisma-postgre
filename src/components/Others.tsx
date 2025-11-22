
'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Search, Building2, Award, Building } from 'lucide-react';
import { DOMAIN } from '@/lib/constants';

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

type TabType = 'departments' | 'ranks' | 'floors';

export default function UnifiedManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('departments');
  
  // Departments State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptSearchTerm, setDeptSearchTerm] = useState('');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptFormData, setDeptFormData] = useState({ DEPT_NAME: '' });
  const [deptSubmitting, setDeptSubmitting] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);

  // Ranks State
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [rankLoading, setRankLoading] = useState(true);
  const [rankSearchTerm, setRankSearchTerm] = useState('');
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [editingRank, setEditingRank] = useState<Rank | null>(null);
  const [rankFormData, setRankFormData] = useState({ RANK_NAME: '' });
  const [rankSubmitting, setRankSubmitting] = useState(false);
  const [rankError, setRankError] = useState<string | null>(null);

  // Floors State
  const [floors, setFloors] = useState<Floor[]>([]);
  const [floorLoading, setFloorLoading] = useState(true);
  const [floorSearchTerm, setFloorSearchTerm] = useState('');
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [floorFormData, setFloorFormData] = useState({ FLOOR_NAME: '' });
  const [floorSubmitting, setFloorSubmitting] = useState(false);
  const [floorError, setFloorError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
    fetchRanks();
    fetchFloors();
  }, []);

  // Departments Functions
  const fetchDepartments = async () => {
    try {
      setDeptLoading(true);
      const res = await fetch(`${DOMAIN}/api/departments`);
      const data = await res.json();
      
      // ✅ التعامل مع البيانات بشكل صحيح - إذا كانت المصفوفة فارغة، نضعها فارغة بدون إظهار خطأ
      if (Array.isArray(data.data)) {
        setDepartments(data.data);
      } else if (Array.isArray(data)) {
        setDepartments(data);
      } else if (data.success === false && data.error) {
        // خطأ من السيرفر - نضع المصفوفة فارغة فقط، سيظهر "لا توجد أقسام" تلقائياً
        setDepartments([]);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      // في حالة catch، نضع المصفوفة فارغة بدون إظهار console.error
      // سيتم عرض "لا توجد أقسام" تلقائياً إذا كانت المصفوفة فارغة
      setDepartments([]);
    } finally {
      setDeptLoading(false);
    }
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptSubmitting(true);
    setDeptError(null);
    try {
      const url = editingDept ? `${DOMAIN}/api/departments/${editingDept.DEPT_ID}` : `${DOMAIN}/api/departments`;
      const method = editingDept ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptFormData),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchDepartments();
        closeDeptModal();
      } else {
        // ✅ عرض رسالة خطأ آمنة (React يقوم بـ escaping تلقائياً، لكن نتأكد من وجود message)
        const errorMessage = typeof data.error === 'string' ? data.error : 'فشل في حفظ القسم';
        setDeptError(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting:', error);
      setDeptError('حدث خطأ أثناء حفظ القسم');
    } finally {
      setDeptSubmitting(false);
    }
  };

  const handleDeptDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
    try {
      const res = await fetch(`${DOMAIN}/api/departments/${id}`, { method: 'DELETE' });
      if (res.ok) await fetchDepartments();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const openDeptModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setDeptFormData({ DEPT_NAME: dept.DEPT_NAME });
    } else {
      setEditingDept(null);
      setDeptFormData({ DEPT_NAME: '' });
    }
    setDeptError(null);
    setIsDeptModalOpen(true);
  };

  const closeDeptModal = () => {
    setIsDeptModalOpen(false);
    setEditingDept(null);
    setDeptFormData({ DEPT_NAME: '' });
    setDeptError(null);
  };

  // Ranks Functions
  const fetchRanks = async () => {
    try {
      setRankLoading(true);
      const res = await fetch(`${DOMAIN}/api/ranks`);
      const data = await res.json();
      
      // ✅ التعامل مع البيانات بشكل صحيح - إذا كانت المصفوفة فارغة، نضعها فارغة بدون إظهار خطأ
      if (Array.isArray(data.data)) {
        setRanks(data.data);
      } else if (Array.isArray(data)) {
        setRanks(data);
      } else if (data.success === false && data.error) {
        // خطأ من السيرفر - نضع المصفوفة فارغة فقط، سيظهر "لا توجد رتب" تلقائياً
        setRanks([]);
      } else {
        setRanks([]);
      }
    } catch (error) {
      // في حالة catch، نضع المصفوفة فارغة بدون إظهار console.error
      // سيتم عرض "لا توجد رتب" تلقائياً إذا كانت المصفوفة فارغة
      setRanks([]);
    } finally {
      setRankLoading(false);
    }
  };

  const handleRankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRankSubmitting(true);
    setRankError(null);
    try {
      const url = editingRank ? `${DOMAIN}/api/ranks/${editingRank.RANK_ID}` : `${DOMAIN}/api/ranks`;
      const method = editingRank ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rankFormData),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchRanks();
        closeRankModal();
      } else {
        // ✅ عرض رسالة خطأ آمنة (React يقوم بـ escaping تلقائياً، لكن نتأكد من وجود message)
        const errorMessage = typeof data.error === 'string' ? data.error : 'فشل في حفظ الرتبة';
        setRankError(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting:', error);
      setRankError('حدث خطأ أثناء حفظ الرتبة');
    } finally {
      setRankSubmitting(false);
    }
  };

  const handleRankDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرتبة؟')) return;
    try {
      const res = await fetch(`${DOMAIN}/api/ranks/${id}`, { method: 'DELETE' });
      if (res.ok) await fetchRanks();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const openRankModal = (rank?: Rank) => {
    if (rank) {
      setEditingRank(rank);
      setRankFormData({ RANK_NAME: rank.RANK_NAME });
    } else {
      setEditingRank(null);
      setRankFormData({ RANK_NAME: '' });
    }
    setRankError(null);
    setIsRankModalOpen(true);
  };

  const closeRankModal = () => {
    setIsRankModalOpen(false);
    setEditingRank(null);
    setRankFormData({ RANK_NAME: '' });
    setRankError(null);
  };

  // Floors Functions
  const fetchFloors = async () => {
    try {
      setFloorLoading(true);
      const res = await fetch(`${DOMAIN}/api/floors`);
      const data = await res.json();
      
      // ✅ التعامل مع البيانات بشكل صحيح - إذا كانت المصفوفة فارغة، نضعها فارغة بدون إظهار خطأ
      if (Array.isArray(data.data)) {
        setFloors(data.data);
      } else if (Array.isArray(data)) {
        setFloors(data);
      } else if (data.success === false && data.error) {
        // خطأ من السيرفر - نضع المصفوفة فارغة فقط، سيظهر "لا توجد طوابق" تلقائياً
        setFloors([]);
      } else {
        setFloors([]);
      }
    } catch (error) {
      // في حالة catch، نضع المصفوفة فارغة بدون إظهار console.error
      // سيتم عرض "لا توجد طوابق" تلقائياً إذا كانت المصفوفة فارغة
      setFloors([]);
    } finally {
      setFloorLoading(false);
    }
  };

  const handleFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFloorSubmitting(true);
    setFloorError(null);
    try {
      const url = editingFloor ? `${DOMAIN}/api/floors/${editingFloor.FLOOR_ID}` : `${DOMAIN}/api/floors`;
      const method = editingFloor ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(floorFormData),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchFloors();
        closeFloorModal();
      } else {
        // ✅ عرض رسالة خطأ آمنة (React يقوم بـ escaping تلقائياً، لكن نتأكد من وجود message)
        const errorMessage = typeof data.error === 'string' ? data.error : 'فشل في حفظ الطابق';
        setFloorError(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting:', error);
      setFloorError('حدث خطأ أثناء حفظ الطابق');
    } finally {
      setFloorSubmitting(false);
    }
  };

  const handleFloorDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطابق؟')) return;
    try {
      const res = await fetch(`${DOMAIN}/api/floors/${id}`, { method: 'DELETE' });
      if (res.ok) await fetchFloors();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const openFloorModal = (floor?: Floor) => {
    if (floor) {
      setEditingFloor(floor);
      setFloorFormData({ FLOOR_NAME: floor.FLOOR_NAME });
    } else {
      setEditingFloor(null);
      setFloorFormData({ FLOOR_NAME: '' });
    }
    setFloorError(null);
    setIsFloorModalOpen(true);
  };

  const closeFloorModal = () => {
    setIsFloorModalOpen(false);
    setEditingFloor(null);
    setFloorFormData({ FLOOR_NAME: '' });
    setFloorError(null);
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.DEPT_NAME.toLowerCase().includes(deptSearchTerm.toLowerCase())
  );

  const filteredRanks = ranks.filter((rank) =>
    rank.RANK_NAME.toLowerCase().includes(rankSearchTerm.toLowerCase())
  );

  const filteredFloors = floors.filter((floor) =>
    floor.FLOOR_NAME.toLowerCase().includes(floorSearchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'departments', name: 'الأقسام', icon: Building2, color: 'blue' },
    { id: 'ranks', name: 'الرتب', icon: Award, color: 'purple' },
    { id: 'floors', name: 'الطوابق', icon: Building, color: 'emerald' },
  ];

  const getActiveConfig = () => {
    switch (activeTab) {
      case 'departments':
        return {
          title: 'إدارة الأقسام',
          subtitle: 'إدارة وتنظيم أقسام المؤسسة',
          icon: Building2,
          color: 'blue',
          data: filteredDepartments,
          loading: deptLoading,
          searchTerm: deptSearchTerm,
          setSearchTerm: setDeptSearchTerm,
          openModal: openDeptModal,
          handleDelete: handleDeptDelete,
          emptyMessage: 'لا توجد أقسام',
          idKey: 'DEPT_ID',
          nameKey: 'DEPT_NAME',
          idLabel: 'رقم القسم',
          nameLabel: 'اسم القسم'
        };
      case 'ranks':
        return {
          title: 'إدارة الرتب',
          subtitle: 'إدارة وتنظيم الرتب الوظيفية',
          icon: Award,
          color: 'purple',
          data: filteredRanks,
          loading: rankLoading,
          searchTerm: rankSearchTerm,
          setSearchTerm: setRankSearchTerm,
          openModal: openRankModal,
          handleDelete: handleRankDelete,
          emptyMessage: 'لا توجد رتب',
          idKey: 'RANK_ID',
          nameKey: 'RANK_NAME',
          idLabel: 'رقم الرتبة',
          nameLabel: 'اسم الرتبة'
        };
      case 'floors':
        return {
          title: 'إدارة الطوابق',
          subtitle: 'إدارة وتنظيم طوابق المبنى',
          icon: Building,
          color: 'emerald',
          data: filteredFloors,
          loading: floorLoading,
          searchTerm: floorSearchTerm,
          setSearchTerm: setFloorSearchTerm,
          openModal: openFloorModal,
          handleDelete: handleFloorDelete,
          emptyMessage: 'لا توجد طوابق',
          idKey: 'FLOOR_ID',
          nameKey: 'FLOOR_NAME',
          idLabel: 'رقم الطابق',
          nameLabel: 'اسم الطابق'
        };
    }
  };

  const config = getActiveConfig();
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Modern & Responsive */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-5 sm:p-6 lg:p-8 mb-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">{config.title}</h1>
                <p className="text-blue-100 text-sm sm:text-base">{config.subtitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-6">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white shadow-lg`
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <TabIcon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Add */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`ابحث عن ${activeTab === 'departments' ? 'قسم' : activeTab === 'ranks' ? 'رتبة' : 'طابق'}...`}
                value={config.searchTerm}
                onChange={(e) => config.setSearchTerm(e.target.value)}
                className={`w-full pr-10 pl-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-${config.color}-500 focus:border-transparent transition-all`}
              />
            </div>
            <button
              onClick={() => config.openModal()}
              className={`flex items-center gap-2 bg-gradient-to-r from-${config.color}-500 to-${config.color}-600 text-white px-6 py-3 rounded-xl hover:from-${config.color}-600 hover:to-${config.color}-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">إضافة {activeTab === 'departments' ? 'قسم' : activeTab === 'ranks' ? 'رتبة' : 'طابق'} جديد</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {config.loading ? (
            <div className="flex justify-center items-center py-20">
              <div className={`animate-spin rounded-full h-12 w-12 border-4 border-${config.color}-500 border-t-transparent`}></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-700">
                      {config.idLabel}
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-700">
                      {config.nameLabel}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {config.data.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                        {config.emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    config.data.map((item: any) => (
                      <tr
                        key={item[config.idKey]}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {item[config.idKey]}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                          {item[config.nameKey]}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => config.openModal(item)}
                              className={`p-2 text-${config.color}-600 hover:bg-${config.color}-50 rounded-lg transition-colors`}
                              title="تعديل"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => config.handleDelete(item[config.idKey])}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Departments Modal */}
        {isDeptModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800">
                  {editingDept ? 'تعديل القسم' : 'إضافة قسم جديد'}
                </h2>
              </div>
              <div className="p-6">
                {deptError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{deptError}</p>
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    اسم القسم
                  </label>
                  <input
                    type="text"
                    value={deptFormData.DEPT_NAME}
                    onChange={(e) => {
                      setDeptFormData({ ...deptFormData, DEPT_NAME: e.target.value });
                      setDeptError(null); // Clear error when user types
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      deptError ? 'border-red-300' : 'border-slate-200'
                    }`}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeptSubmit}
                    disabled={deptSubmitting}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold disabled:opacity-50"
                  >
                    {deptSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                  <button
                    onClick={closeDeptModal}
                    className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl hover:bg-slate-200 transition-colors font-semibold"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ranks Modal */}
        {isRankModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800">
                  {editingRank ? 'تعديل الرتبة' : 'إضافة رتبة جديدة'}
                </h2>
              </div>
              <div className="p-6">
                {rankError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{rankError}</p>
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    اسم الرتبة
                  </label>
                  <input
                    type="text"
                    value={rankFormData.RANK_NAME}
                    onChange={(e) => {
                      setRankFormData({ ...rankFormData, RANK_NAME: e.target.value });
                      setRankError(null); // Clear error when user types
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      rankError ? 'border-red-300' : 'border-slate-200'
                    }`}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRankSubmit}
                    disabled={rankSubmitting}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all font-semibold disabled:opacity-50"
                  >
                    {rankSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                  <button
                    onClick={closeRankModal}
                    className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl hover:bg-slate-200 transition-colors font-semibold"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floors Modal */}
        {isFloorModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800">
                  {editingFloor ? 'تعديل الطابق' : 'إضافة طابق جديد'}
                </h2>
              </div>
              <div className="p-6">
                {floorError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{floorError}</p>
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    اسم الطابق
                  </label>
                  <input
                    type="text"
                    value={floorFormData.FLOOR_NAME}
                    onChange={(e) => {
                      setFloorFormData({ ...floorFormData, FLOOR_NAME: e.target.value });
                      setFloorError(null); // Clear error when user types
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      floorError ? 'border-red-300' : 'border-slate-200'
                    }`}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleFloorSubmit}
                    disabled={floorSubmitting}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-semibold disabled:opacity-50"
                  >
                    {floorSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                  <button
                    onClick={closeFloorModal}
                    className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl hover:bg-slate-200 transition-colors font-semibold"
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