'use client';

import { useState, useEffect } from 'react';
import { Printer, BarChart3, RefreshCw, Home, FileText } from 'lucide-react';
import Link from 'next/link';
import { escapeHtml } from '@/lib/security';
import { Can } from '@/components/Can';
import { utils, writeFileXLSX } from 'xlsx';
import { DOMAIN } from '@/lib/constants';

interface Statistics {
  mainCategories: Array<{ CAT_ID: number; CAT_NAME: string; ITEM_COUNT: number }>;
  subCategories: Array<{ SUB_CAT_ID: number; SUB_CAT_NAME: string; MAIN_CATEGORY_NAME: string; ITEM_COUNT: number }>;
  itemTypes: Array<{ 
    ITEM_TYPE_ID: number; 
    ITEM_TYPE_NAME: string; 
    SUB_CAT_ID?: number;
    SUB_CAT_NAME?: string;
    CAT_ID?: number;
    MAIN_CATEGORY_NAME?: string;
    ITEM_COUNT: number 
  }>;
  departments: Array<{ DEPT_ID: number; DEPT_NAME: string; ITEM_COUNT: number }>;
  floors: Array<{ FLOOR_ID: number; FLOOR_NAME: string; ITEM_COUNT: number }>;
  situations: Array<{ SITUATION: string; ITEM_COUNT: number }>;
  kinds: Array<{ KIND: string; ITEM_COUNT: number }>;
  users: Array<{ USER_ID: number; USER_NAME: string; ITEM_COUNT: number }>;
  warehouse: { ITEM_COUNT: number };
  totalItems: { TOTAL_COUNT: number };
  stockStats?: {
    TOTAL_ITEMS: number;
    TOTAL_QUANTITY: number;
    LOW_STOCK_COUNT: number;
    OUT_OF_STOCK_COUNT: number;
    IN_STOCK_COUNT: number;
  };
  movementsStats?: {
    TOTAL_MOVEMENTS: number;
    TOTAL_IN: number;
    TOTAL_OUT: number;
    ITEMS_WITH_MOVEMENTS: number;
    USERS_WITH_MOVEMENTS: number;
  };
  movementTypesStats?: Array<{
    MOVEMENT_TYPE_ID: number;
    TYPE_NAME: string;
    TYPE_CODE: string;
    MOVEMENT_COUNT: number;
    TOTAL_QUANTITY: number;
  }>;
  lowStockItems?: Array<{
    ITEM_ID: number;
    ITEM_NAME: string;
    QUANTITY: number;
    MIN_QUANTITY: number;
    UNIT: string;
    SHORTAGE_QTY: number;
  }>;
}

export default function StatisticsPageContent() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${DOMAIN}/api/statistics`);
      const data = await response.json();
      
      // ✅ التعامل مع البيانات بشكل صحيح - إذا كانت البيانات فارغة أو حدث خطأ، نضع statistics إلى null
      if (data.success && data.data) {
        setStatistics(data.data);
      } else if (data.success === false && data.error) {
        // خطأ من السيرفر - نضع statistics إلى null، سيتم عرض "لا يوجد بيانات" تلقائياً
        setStatistics(null);
      } else {
        // استجابة غير متوقعة - نضع statistics إلى null
        setStatistics(null);
      }
    } catch (_err) {
      // في حالة catch، نضع statistics إلى null بدون إظهار console.error
      // سيتم عرض "لا يوجد بيانات" تلقائياً
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handlePrint = () => {
    // طباعة الصفحة كـ PDF
    window.print();
  };

  const handleExportItemsExcel = () => {
    if (!statistics || !statistics.mainCategories || statistics.mainCategories.length === 0) {
      alert('لا توجد تصنيفات رئيسية للتصدير');
      return;
    }

    // تحويل التصنيفات الرئيسية إلى صفوف Excel
    const rows = statistics.mainCategories.map((cat, index) => ({
      '#': index + 1,
      'اسم التصنيف الرئيسي': cat.CAT_NAME || '',
      'العدد': cat.ITEM_COUNT || 0,
    }));

    // إنشاء ورقة عمل
    const worksheet = utils.json_to_sheet(rows);
    
    // ضبط عرض الأعمدة
    worksheet['!cols'] = [
      { wch: 5 },   // #
      { wch: 30 },  // اسم التصنيف الرئيسي
      { wch: 10 },  // العدد
    ];

    // إنشاء مصنف جديد
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'التصنيفات الرئيسية');

    // تصدير الملف
    const fileName = `التصنيفات_الرئيسية_${new Date().toISOString().split('T')[0]}.xlsx`;
    writeFileXLSX(workbook, fileName);
  };

  const handleExportMainCategoriesPDF = () => {
    if (!statistics) return;

    // الحصول على URL الصورة (آمن - window.location.origin لا يمكن تلاعبه)
    // ✅ window.location.origin آمن لأنه لا يحتوي على أحرف خطيرة في HTML attributes
    const logoUrl = window.location.origin + '/EDARA_LOGO.png';
    
    // تحويل الأرقام إلى الأرقام العربية
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const toArabicNum = (num: number): string => {
      return num.toString().replace(/\d/g, (digit) => arabicNumbers[parseInt(digit)]);
    };
    
    // إنشاء HTML للتصنيفات الرئيسية فقط بنفس التنسيق
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تقرير عهدة أجهزة ومعدات الحاسب</title>
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
              max-width: 800px;
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
            .subtitle {
              font-size: 12px;
              font-weight: 900;
              text-align: center;
              margin: 8px 0;
              text-decoration: underline;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 11px;
            }
            th, td {
              border: 2px solid #000;
              padding: 6px 8px;
              text-align: center;
              font-size: 11px;
            }
            th {
              background-color: #d3d3d3;
              font-weight: bold;
            }
            td {
              min-height: 30px;
              line-height: 1.4;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              padding: 0 15px;
            }
            .signature-block {
              text-align: right;
              width: 45%;
            }
            .signature-line {
              margin-top: 35px;
              font-size: 11px;
              line-height: 1.6;
              text-align: right;
            }
            .signature-title {
              font-weight: bold;
              margin-bottom: 3px;
              font-size: 11px;
              text-align: right;
            }
            .signature-line-space {
              display: inline-block;
              min-width: 120px;
              height: 14px;
              vertical-align: bottom;
              margin: 0 2px;
            }
            @media print {
              @page {
                size: A4;
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
                font-weight: 900;
              }
              .subtitle {
                margin: 5px 0;
                font-size: 11px;
                font-weight: 900;
              }
              table {
                margin: 10px 0;
                font-size: 10px;
              }
              th, td {
                padding: 5px 6px;
                font-size: 10px;
              }
              .signatures {
                margin-top: 30px;
              }
              .signature-line {
                margin-top: 25px;
                font-size: 10px;
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
                <div class="header-text">هيئة الشؤون المالية للقوات المسلحة</div>
                <div class="header-text">إدارة التامين و المعاشات </div>
                <div class="header-text">فرع نظم المعلومات</div>
              </div>
            </div>
            
            <!-- Title -->
            <div class="title">
              يومية عددية بأجهزة ومعدات الحاسب فرع نظم المعلومات ملحق (1)
            </div>
            
            <!-- Subtitle -->
            <div class="subtitle">
              (إدارة التأمينات المعاشات)
            </div>
            
            <!-- Table -->
            <table>
              <thead>
                <tr>
                <th>اســـــم الصــــنـــــف</th>
                <th>العدد بالعهدة</th>
                <th>ملاحـــظــــــات</th>
                </tr>
              </thead>
              <tbody>
                ${statistics.mainCategories.map(cat => `
                  <tr>
                  <td>${escapeHtml(cat.CAT_NAME)}</td>
                  <td>${toArabicNum(cat.ITEM_COUNT)}</td>
                  <td></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <!-- Signatures -->
            <div class="signatures">
              <div class="signature-block">
                <div class="signature-line">
                  <div class="signature-title">إعتماد اللجنة</div>
                  <div>التوقيع (<span class="signature-line-space">               </span>)</div>
                    <div> <br /> </div>
                 <div>رئيس فرع نظم المعلومات</div>
                </div>
              </div>
              <div class="signature-block">
                <div class="signature-line">
                  <div class="signature-title">إعتماد الإدارة</div>
                  <div>التوقيع (<span class="signature-line-space">             </span>)</div>
                  <div> <br /> </div>
                  <div>رئيس فريق مراجعة العهدة</div>
                </div>
              </div>
            </div>
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

  const getSituationBadge = (situation: string) => {
    const badges: Record<string, { emoji: string; color: string; bgColor: string }> = {
      'صالح': { emoji: '🟢', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
      'عاطل': { emoji: '🔴', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
      'تحت الإصلاح': { emoji: '🟡', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' },
      'ورشة': { emoji: '🔧', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
    };
    return badges[situation] || { emoji: '', color: 'text-slate-700', bgColor: 'bg-slate-50 border-slate-200' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 text-lg font-medium">جاري تحميل الإحصائيات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!statistics && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
             
            <div className="flex flex-wrap gap-3">
                <Link
                  href="/items"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all font-semibold backdrop-blur-sm"
                >
                  <Home size={18} />
                  <span className="hidden sm:inline">الأصناف</span>
                </Link>
                <button
                  onClick={fetchStatistics}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all font-semibold backdrop-blur-sm"
                >
                  <RefreshCw size={18} />
                  <span className="hidden sm:inline">تحديث</span>
                </button>
              </div>
               <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BarChart3 className="text-white" size={32} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">الإحصائيات الشاملة</h1>
                  <p className="text-blue-100 text-sm sm:text-base">نظرة شاملة على جميع البيانات والإحصائيات</p>
                </div>
              </div>
             
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-700 text-xl font-semibold mb-2">لا توجد بيانات</p>
            <p className="text-slate-500 text-sm mb-6">لا توجد إحصائيات متاحة حالياً</p>
            <button
              onClick={fetchStatistics}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              <RefreshCw size={20} />
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // إذا لم تكن statistics موجودة، لا نعرض المحتوى
  if (!statistics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 md:p-8 print:p-2" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 print:rounded-lg print:shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">الإحصائيات الشاملة</h1>
                <p className="text-blue-100 text-sm sm:text-base">نظرة شاملة على جميع البيانات والإحصائيات</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 print:hidden">
              <Link
                href="/items"
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all font-semibold backdrop-blur-sm print:hidden"
              >
                <Home size={18} />
                <span className="hidden sm:inline">الأصناف</span>
              </Link>
              <button
                onClick={fetchStatistics}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all font-semibold backdrop-blur-sm print:hidden"
              >
                <RefreshCw size={18} />
                <span className="hidden sm:inline">تحديث</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl print:hidden"
              >
                <Printer size={18} />
                <span>طباعة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Total Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6 print:rounded-lg print:shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{statistics.totalItems?.TOTAL_COUNT || 0}</div>
              <div className="text-sm text-slate-600 mt-1">إجمالي الأصناف</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="text-3xl font-bold text-green-600">{statistics.warehouse?.ITEM_COUNT || 0}</div>
              <div className="text-sm text-slate-600 mt-1">في المخزن</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">
                {(statistics.totalItems?.TOTAL_COUNT || 0) - (statistics.warehouse?.ITEM_COUNT || 0)}
              </div>
              <div className="text-sm text-slate-600 mt-1">مخصصة للمستخدمين</div>
            </div>
          </div>

          {/* Stock Statistics */}
          {statistics.stockStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
              <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-600">{statistics.stockStats.TOTAL_QUANTITY || 0}</div>
                <div className="text-xs text-slate-600 mt-1">إجمالي الكمية</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{statistics.stockStats.LOW_STOCK_COUNT || 0}</div>
                <div className="text-xs text-slate-600 mt-1">قريب من النفاد</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                <div className="text-2xl font-bold text-red-600">{statistics.stockStats.OUT_OF_STOCK_COUNT || 0}</div>
                <div className="text-xs text-slate-600 mt-1">منتهي</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-600">{statistics.stockStats.IN_STOCK_COUNT || 0}</div>
                <div className="text-xs text-slate-600 mt-1">متاح</div>
              </div>
            </div>
          )}

          {/* Movements Statistics */}
          {statistics.movementsStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 mt-4 border-t border-slate-200">
              <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                <div className="text-2xl font-bold text-indigo-600">{statistics.movementsStats.TOTAL_MOVEMENTS || 0}</div>
                <div className="text-xs text-slate-600 mt-1">إجمالي الحركات</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-600">{statistics.movementsStats.TOTAL_IN || 0}</div>
                <div className="text-xs text-slate-600 mt-1">إجمالي الإدخال</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl border border-rose-200">
                <div className="text-2xl font-bold text-rose-600">{statistics.movementsStats.TOTAL_OUT || 0}</div>
                <div className="text-xs text-slate-600 mt-1">إجمالي الإخراج</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl border border-cyan-200">
                <div className="text-2xl font-bold text-cyan-600">{statistics.movementsStats.ITEMS_WITH_MOVEMENTS || 0}</div>
                <div className="text-xs text-slate-600 mt-1">أصناف بحركات</div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Sections */}
        <div className="space-y-6 print:space-y-4">
          {/* Main Categories */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-blue-100">
              <h2 className="text-xl font-bold text-slate-800">
                التصنيفات الرئيسية
              </h2>
              <Can do="read" on="Reports">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportMainCategoriesPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg print:hidden"
                    title="تصدير PDF للتصنيفات الرئيسية"
                  >
                    <FileText size={18} />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                  <button
                    onClick={handleExportItemsExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-semibold shadow-md hover:shadow-lg print:hidden"
                    title="تصدير التصنيفات الرئيسية إلى ملف Excel"
                  >
                    <FileText size={18} />
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                </div>
              </Can> 

            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-slate-50 border-b-2 border-slate-200 sticky top-0 z-10">
                  <tr>
                    {/* <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">معرف التصنيف</th> */}
                    <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">اسم التصنيف الرئيسي</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 whitespace-nowrap">العدد</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.mainCategories.map((cat) => (
                    <tr key={cat.CAT_ID} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      {/* <td className="px-4 py-3 text-sm text-slate-600">{cat.CAT_ID}</td> */}
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{cat.CAT_NAME}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                          {cat.ITEM_COUNT}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sub Categories */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              التصنيفات الفرعية
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-slate-50 border-b-2 border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">التصنيف الرئيسي</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">التصنيف الفرعي</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 whitespace-nowrap">العدد</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.subCategories.map((sub) => (
                    <tr key={sub.SUB_CAT_ID} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <div className="max-w-[200px] truncate" title={sub.MAIN_CATEGORY_NAME || '-'}>
                          {sub.MAIN_CATEGORY_NAME || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">
                        <div className="max-w-[750px] truncate" title={sub.SUB_CAT_NAME}>
                          {sub.SUB_CAT_NAME}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                          {sub.ITEM_COUNT}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Item Types */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              أنواع الأصناف
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-slate-50 border-b-2 border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">التصنيف الرئيسي</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">التصنيف الفرعي</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">نوع الصنف</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 whitespace-nowrap">عدد الأصناف</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.itemTypes.map((type) => (
                    <tr key={type.ITEM_TYPE_ID} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-600">{type.MAIN_CATEGORY_NAME || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{type.SUB_CAT_NAME || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{type.ITEM_TYPE_NAME}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                          {type.ITEM_COUNT}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Departments */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              الأقسام
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {statistics.departments.map((dept) => (
                <div
                  key={dept.DEPT_ID}
                  className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">{dept.DEPT_NAME}</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 ml-4">{dept.ITEM_COUNT}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floors */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              الطوابق
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {statistics.floors.map((floor) => (
                <div
                  key={floor.FLOOR_ID}
                  className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">{floor.FLOOR_NAME}</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 ml-4">{floor.ITEM_COUNT}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Situations */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              الحالات
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statistics.situations.map((situation) => {
                const badge = getSituationBadge(situation.SITUATION);
                return (
                  <div
                    key={situation.SITUATION}
                    className={`p-4 border-2 rounded-xl hover:shadow-md transition-all ${badge.bgColor} border-${badge.color.replace('text-', '')}-200`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{badge.emoji}</span>
                        <div className={`font-semibold ${badge.color}`}>{situation.SITUATION}</div>
                      </div>
                      <div className={`text-2xl font-bold ml-4 ${badge.color}`}>{situation.ITEM_COUNT}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kinds */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              النوع (عهدة/مشتريات)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {statistics.kinds.map((kind) => (
                <div
                  key={kind.KIND}
                  className="p-4 border-2 border-indigo-200 rounded-xl bg-indigo-50 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-indigo-800">{kind.KIND}</div>
                    <div className="text-2xl font-bold text-indigo-600 ml-4">{kind.ITEM_COUNT}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Items */}
          {statistics.lowStockItems && statistics.lowStockItems.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-yellow-100">
                ⚠️ الأصناف القريبة من النفاد
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead className="bg-slate-50 border-b-2 border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">اسم الصنف</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 whitespace-nowrap">الكمية الحالية</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 whitespace-nowrap">الحد الأدنى</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 whitespace-nowrap">النقص</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 whitespace-nowrap">الوحدة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.lowStockItems.map((item) => (
                      <tr key={item.ITEM_ID} className="border-b border-slate-100 hover:bg-yellow-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.ITEM_NAME}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-sm">
                            {item.QUANTITY}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm">
                            {item.MIN_QUANTITY}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-sm">
                            {item.SHORTAGE_QTY}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">{item.UNIT || 'قطعة'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Movement Types Statistics */}
          {statistics.movementTypesStats && statistics.movementTypesStats.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
                إحصائيات أنواع الحركات
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead className="bg-slate-50 border-b-2 border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">نوع الحركة</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">الكود</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 whitespace-nowrap">عدد الحركات</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 whitespace-nowrap">إجمالي الكمية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.movementTypesStats.map((type) => (
                      <tr key={type.MOVEMENT_TYPE_ID} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{type.TYPE_NAME}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 font-mono text-xs">
                            {type.TYPE_CODE}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                            {type.MOVEMENT_COUNT || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                            {type.TOTAL_QUANTITY || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users - Hidden in Print */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:hidden">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              المستخدمين والأصناف المخصصة
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-slate-50 border-b-2 border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">اسم المستخدم</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 whitespace-nowrap">عدد الأصناف</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.users
                    .filter((user) => user.ITEM_COUNT > 0)
                    .map((user) => (
                      <tr key={user.USER_ID} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">👤 {user.USER_NAME}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                            {user.ITEM_COUNT}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {statistics.users.filter((user) => user.ITEM_COUNT > 0).length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                        لا توجد أصناف مخصصة للمستخدمين
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Print Footer */}
        <div className="mt-8 text-center text-sm text-slate-500 print:mt-4 print-footer">
          <p>تم إنشاء هذه الإحصائيات بواسطة محمد عبد الفتاح في: {new Date().toLocaleDateString('ar-EG', { dateStyle: 'long' })}</p>
          <p className="mt-1">{new Date().toLocaleTimeString('ar-EG')}</p>
        </div>
      </div>

      {/* Table Styles */}
      <style jsx global>{`
        /* تحسين عرض الجداول */
        table {
          display: table;
          width: 100%;
          border-collapse: collapse;
        }
        
        thead {
          display: table-header-group;
        }
        
        tbody {
          display: table-row-group;
        }
        
        tr {
          display: table-row;
        }
        
        th, td {
          display: table-cell;
        }
        
        /* Print Styles - محسّن للطباعة PDF - موفر للورق */
        @media print {
          @page {
            size: A4;
            margin: 0.8cm 0.8cm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* تصغير حجم الخط بشكل عام */
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 9px !important;
            line-height: 1.3 !important;
          }
          
          h1 {
            font-size: 16px !important;
            margin-bottom: 0.5rem !important;
            line-height: 1.2 !important;
          }
          
          h2 {
            font-size: 12px !important;
            margin-top: 0.8rem !important;
            margin-bottom: 0.4rem !important;
            padding-bottom: 0.3rem !important;
            line-height: 1.3 !important;
          }
          
          h3 {
            font-size: 11px !important;
            margin-top: 0.6rem !important;
            margin-bottom: 0.3rem !important;
          }
          
          p, span, div, td, th {
            font-size: 9px !important;
            line-height: 1.3 !important;
          }
          
          /* تصغير الأرقام الكبيرة في الإحصائيات */
          .text-2xl,
          .text-3xl,
          .text-4xl {
            font-size: 14px !important;
          }
          
          .text-xl {
            font-size: 11px !important;
          }
          
          .text-lg {
            font-size: 10px !important;
          }
          
          .text-sm {
            font-size: 8px !important;
          }
          
          .text-xs {
            font-size: 7px !important;
          }
          
          /* إخفاء الـ Navbar والتنقل عند الطباعة - يجب أن يكون أول شيء */
          body > nav,
          nav,
          nav.sticky,
          nav[class*="sticky"],
          nav[class*="top-0"],
          header[role="navigation"],
          [role="navigation"] {
            display: none !important;
          }
          
          /* إخفاء العناصر غير المرغوبة في الطباعة - يجب أن يكون شامل */
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* إخفاء جميع الأزرار والروابط داخل Header بشكل مطلق */
          .bg-gradient-to-r .flex.flex-wrap,
          .bg-gradient-to-r .flex.flex-wrap > *,
          .bg-gradient-to-r button,
          .bg-gradient-to-r a[href],
          .bg-gradient-to-r a {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }
          
          /* إخفاء أي أزرار أو روابط أخرى */
          button:not(.print-keep),
          a[href]:not(.print-keep) {
            display: none !important;
          }
          
          /* إخفاء الـ main container padding */
          main.container {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* تحسين البطاقات للطباعة */
          .bg-white,
          .bg-slate-50,
          .bg-gradient-to-r {
            background: white !important;
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
          
          /* Header للطباعة - تصغير */
          .bg-gradient-to-r {
            background: #1e40af !important;
            color: white !important;
            padding: 0.5rem 0.8rem !important;
            margin-bottom: 0.6rem !important;
          }
          
          .bg-gradient-to-r * {
            color: white !important;
          }
          
          .bg-gradient-to-r h1 {
            font-size: 14px !important;
            margin-bottom: 0.2rem !important;
          }
          
          .bg-gradient-to-r p {
            font-size: 8px !important;
          }
          
          /* تحسين المسافات في الطباعة - تقليل */
          .print\\:p-2 {
            padding: 0.4rem !important;
          }
          
          .print\\:space-y-4 > * + * {
            margin-top: 0.5rem !important;
          }
          
          /* تقليل padding في البطاقات */
          .bg-white,
          .rounded-2xl,
          .rounded-xl {
            padding: 0.5rem 0.6rem !important;
            margin-bottom: 0.5rem !important;
          }
          
          /* تقليل المسافات بين الأقسام */
          .space-y-6 > * + * {
            margin-top: 0.8rem !important;
          }
          
          .mb-6,
          .mb-8 {
            margin-bottom: 0.6rem !important;
          }
          
          .mt-8 {
            margin-top: 0.6rem !important;
          }
          
          .pb-3 {
            padding-bottom: 0.3rem !important;
          }
          
          .mb-4 {
            margin-bottom: 0.4rem !important;
          }
          
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          
          .print\\:rounded-lg {
            border-radius: 0.25rem !important;
          }
          
          .print\\:shadow-md {
            box-shadow: none !important;
          }
          
          /* تحسين الجداول للطباعة - تصغير */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            margin-bottom: 0.5rem !important;
            font-size: 8px !important;
            table-layout: auto !important;
          }
          
          table thead {
            display: table-header-group !important;
            background-color: #f9fafb !important;
          }
          
          table thead th {
            background-color: #f3f4f6 !important;
            color: #1f2937 !important;
            font-weight: bold !important;
            border: 1px solid #d1d5db !important;
            padding: 0.3rem 0.4rem !important;
            text-align: right !important;
            font-size: 8px !important;
            line-height: 1.2 !important;
            white-space: nowrap !important;
          }
          
          table tbody td {
            border: 1px solid #e5e7eb !important;
            padding: 0.25rem 0.4rem !important;
            font-size: 8px !important;
            line-height: 1.3 !important;
            word-wrap: break-word !important;
            word-break: break-word !important;
            max-width: 300px !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          
          table tbody td div {
            max-width: 100% !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }
          
          table tbody tr {
            border-bottom: 1px solid #e5e7eb !important;
          }
          
          table tbody tr:nth-child(even) {
            background-color: #f9fafb !important;
          }
          
          /* تصغير badges في الجداول */
          table .rounded-full,
          table .rounded-lg,
          table .rounded-xl {
            padding: 0.15rem 0.4rem !important;
            font-size: 7px !important;
            min-width: auto !important;
            width: auto !important;
            height: auto !important;
            display: inline-flex !important;
          }
          
          /* تحسين عرض النصوص الطويلة في الجداول */
          table td .max-w-\\[750px\\] {
            max-width: 400px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            display: block !important;
          }
          
          table td .max-w-\\[200px\\] {
            max-width: 150px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            display: block !important;
          }
          
          table td .max-w-\\[250px\\] {
            max-width: 200px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            display: block !important;
          }
          
          /* إزالة الـ hover effects في الطباعة */
          tr:hover {
            background-color: inherit !important;
          }
          
          /* تحسين البطاقات والإحصائيات */
          .grid {
            display: grid !important;
          }
          
          /* تحسين الألوان للطباعة */
          .text-blue-600,
          .text-blue-700 {
            color: #1e40af !important;
          }
          
          .text-green-600,
          .text-green-700 {
            color: #059669 !important;
          }
          
          .text-red-600,
          .text-red-700 {
            color: #dc2626 !important;
          }
          
          .text-yellow-600,
          .text-yellow-700 {
            color: #d97706 !important;
          }
          
          .text-orange-600,
          .text-orange-700 {
            color: #ea580c !important;
          }
          
          .text-purple-600,
          .text-purple-700 {
            color: #9333ea !important;
          }
          
          .text-indigo-600,
          .text-indigo-700 {
            color: #4338ca !important;
          }
          
          /* تحسين البطاقات الملونة - تصغير */
          .bg-blue-50,
          .bg-green-50,
          .bg-red-50,
          .bg-yellow-50,
          .bg-orange-50,
          .bg-purple-50,
          .bg-indigo-50 {
            background-color: #f9fafb !important;
            border: 1px solid #e5e7eb !important;
            padding: 0.3rem 0.5rem !important;
          }
          
          /* تصغير Grid items */
          .grid {
            gap: 0.4rem !important;
          }
          
          .grid > div {
            padding: 0.3rem 0.4rem !important;
          }
          
          /* Footer للطباعة - تصغير */
          .print-footer {
            margin-top: 0.8rem !important;
            padding-top: 0.4rem !important;
            border-top: 1px solid #e5e7eb !important;
            text-align: center !important;
            font-size: 7px !important;
            color: #6b7280 !important;
          }
          
          .print-footer p {
            font-size: 7px !important;
            margin: 0.2rem 0 !important;
          }
          
          /* تحسين العنوان */
          h2 {
            page-break-after: avoid !important;
          }
          
          /* تقليل المسافات في البطاقات الإحصائية */
          .p-4,
          .p-6,
          .p-8 {
            padding: 0.4rem 0.5rem !important;
          }
          
          /* تصغير الأيقونات والرموز */
          .text-xl,
          .text-2xl {
            font-size: 10px !important;
          }
          
          /* تقليل border thickness */
          .border-2 {
            border-width: 1px !important;
          }
          
          /* تحسين spacing في grid */
          .gap-4 {
            gap: 0.3rem !important;
          }
          
          .gap-5,
          .gap-6 {
            gap: 0.4rem !important;
          }
        }
      `}</style>
    </div>
  );
}
