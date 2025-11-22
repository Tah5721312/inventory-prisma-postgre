import React from "react";
import { requireAuthServer } from '@/lib/auth-helper';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: Props) {
  // ✅ التحقق من تسجيل الدخول
  await requireAuthServer();

  const session = await auth();
  const { id } = await params;

  // بعد requireAuthServer، session موجود بالتأكيد
  if (!session?.user) {
    return null; // لن يحدث أبداً ولكن للتحقق من TypeScript
  }

  // ✅ التحقق إن المستخدم مش بيحاول يفتح بروفايل حد تاني
  const currentUserId = String((session.user as any)?.userId || (session.user as any)?.id || '');
  const requestedId = String(id);
  
  if (currentUserId !== requestedId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">ليس لديك صلاحية للوصول إلى هذا الملف الشخصي.</p>
          <a href="/dashboard" className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300">
            العودة للرئيسية
          </a>
        </div>
      </div>
    );
  }
  
  // ✅ لو كل حاجة تمام نجيب بيانات المستخدم من الـ API
  const cookieStore = cookies();
  const cookieHeader = (await cookieStore).toString();
  
  const baseUrl = process.env.NEXTAUTH_URL ;
  const res = await fetch(`${baseUrl}/api/users/profile/${id}`, {
    cache: "no-store",
    headers: { Cookie: cookieHeader },
  });
  
  const user = await res.json();
  
  if (!res.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-6">{user.message || "لم يتم العثور على المستخدم."}</p>
          <a href="/dashboard" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300">
            العودة للرئيسية
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 py-8 px-4 sm:py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-slate-200/50">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                {user.IS_ACTIVE === 1 && (
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-right">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                  {user.FULL_NAME || user.USERNAME}
                </h1>
                <p className="text-blue-100 text-sm sm:text-base mb-3">{user.EMAIL}</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {user.ROLE_NAME && (
                    <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-sm px-3 py-1.5 rounded-full border border-white/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {user.ROLE_NAME}
                    </span>
                  )}
                  {user.IS_ACTIVE === 1 ? (
                    <span className="inline-flex items-center gap-1.5 bg-green-500/20 backdrop-blur-sm text-sm px-3 py-1.5 rounded-full border border-green-300/30">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      نشط
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-red-500/20 backdrop-blur-sm text-sm px-3 py-1.5 rounded-full border border-red-300/30">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      غير نشط
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* User Details */}
          <div className="p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 pb-3 border-b-2 border-slate-200">
              معلومات الملف الشخصي
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* رقم المستخدم */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-500 p-2.5 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide">رقم المستخدم</h3>
                </div>
                <p className="text-xl font-bold text-gray-800">{user.ID}</p>
              </div>
              
              {/* اسم المستخدم */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-200 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="bg-indigo-500 p-2.5 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide">اسم المستخدم</h3>
                </div>
                <p className="text-lg font-semibold text-gray-800">{user.USERNAME}</p>
              </div>
              
              {/* الاسم الكامل */}
              {user.FULL_NAME && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="bg-purple-500 p-2.5 rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide">الاسم الكامل</h3>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{user.FULL_NAME}</p>
                </div>
              )}

              {/* البريد الإلكتروني */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="bg-green-500 p-2.5 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide">البريد الإلكتروني</h3>
                </div>
                <p className="text-sm font-medium text-gray-800 break-all">{user.EMAIL}</p>
              </div>

              {/* الهاتف */}
              {user.PHONE && (
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl border border-yellow-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="bg-yellow-500 p-2.5 rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide">رقم الهاتف</h3>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{user.PHONE}</p>
                </div>
              )}

              {/* الدور */}
              {user.ROLE_NAME && (
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border border-red-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="bg-red-500 p-2.5 rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide">الدور</h3>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{user.ROLE_NAME}</p>
                </div>
              )}

              {/* القسم */}
              {user.DEPT_NAME && (
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-xl border border-teal-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="bg-teal-500 p-2.5 rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide">القسم</h3>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{user.DEPT_NAME}</p>
                </div>
              )}

              {/* الرتبة */}
              {user.RANK_NAME && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="bg-orange-500 p-2.5 rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide">الرتبة</h3>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{user.RANK_NAME}</p>
                </div>
              )}

              {/* الطابق */}
              {user.FLOOR_NAME && (
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 rounded-xl border border-cyan-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="bg-cyan-500 p-2.5 rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide">الطابق</h3>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{user.FLOOR_NAME}</p>
                </div>
              )}

              {/* عدد الأصناف */}
              {user.ITEMS_COUNT !== undefined && (
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-5 rounded-xl border border-pink-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="bg-pink-500 p-2.5 rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide">عدد الأصناف</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{user.ITEMS_COUNT}</p>
                </div>
              )}

              {/* تاريخ الإنشاء */}
              {user.CREATED_AT && (
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-5 rounded-xl border border-violet-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="bg-violet-500 p-2.5 rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wide">تاريخ الإنشاء</h3>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(user.CREATED_AT).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(user.CREATED_AT).toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                العودة للرئيسية
              </a>
              {user.ITEMS_COUNT !== undefined && user.ITEMS_COUNT > 0 && (
                <a href={`/items?userId=${user.ID}`} className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  عرض الأصناف ({user.ITEMS_COUNT})
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}