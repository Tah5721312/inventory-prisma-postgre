"use client";
import React, { useState, useEffect } from "react";
import { DOMAIN } from "@/lib/constants";

interface Role {
  ROLE_ID: number;
  NAME: string;
  DESCRIPTION?: string;
  IS_ACTIVE?: number;
}

const NewUserForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [passwordShown, setPasswordShown] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "">("");

  const togglePasswordVisiblity = () => setPasswordShown((cur) => !cur);

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage("");
      setToastType("");
    }, 3000);
  };

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setFullName("");
    setPassword("");
    setRoleId(0);
    setPasswordShown(false);
  };

  useEffect(() => {
    resetForm();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${DOMAIN}/api/roles`);
        const data = await response.json();
        if (data.roles) {
          setRoles(data.roles);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        showToast('فشل في تحميل الأدوار', 'error');
      }
    };

    fetchRoles();
  }, []);

  const formSubmitHandler = async () => {
    if (username === "") return showToast("اسم المستخدم مطلوب", "error");
    if (email === "") return showToast("البريد الإلكتروني مطلوب", "error");
    if (fullName === "") return showToast("الاسم الكامل مطلوب", "error");
    if (password === "") return showToast("كلمة المرور مطلوبة", "error");
    if (roleId === 0) return showToast("الدور الوظيفي مطلوب", "error");

    try {
      setLoading(true);
      const response = await fetch(`${DOMAIN}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          fullName,
          password,
          roleId,
        }),
      });

      if (response.ok) {
        showToast("تم إنشاء المستخدم بنجاح", "success");
        setTimeout(() => {
          window.location.href = "/Dashboard";
        }, 1500);
      } else {
        const errorData = await response.json();
        showToast(errorData.error || "فشل في إنشاء المستخدم", "error");
      }
    } catch (error: any) {
      showToast("حدث خطأ أثناء إنشاء المستخدم", "error");
      console.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Custom Icons as SVG
  const UserPlusIcon = () => (
    <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 20 20">
      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
    </svg>
  );

  const ArrowLeftIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
  );

  const EyeIcon = () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
  );

  const EyeSlashIcon = () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
    </svg>
  );

  const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg shadow-lg p-4 max-w-sm ${
            toastType === "success" ? "bg-green-500" : "bg-red-500"
          }`}>
            <p className="text-white font-medium">{toastMessage}</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4 sm:mb-6 text-white">
            <UserPlusIcon />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            إضافة مستخدم جديد
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-md mx-auto px-4">
            أدخل تفاصيل المستخدم الجديد لإضافته إلى النظام
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="space-y-6">
              {/* Username Field */}
              <div className="group">
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  اسم المستخدم
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <input
                  id="username"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-900 placeholder:text-gray-400"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>

              {/* Full Name Field */}
              <div className="group">
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                  الاسم الكامل
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <input
                  id="fullName"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-900 placeholder:text-gray-400"
                  type="text"
                  placeholder="أدخل الاسم الكامل"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Email Field */}
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  البريد الإلكتروني
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <input
                  id="email"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-900 placeholder:text-gray-400"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Role Field */}
              <div className="group">
                <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                  الدور الوظيفي
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <select
                  id="role"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-900 bg-white appearance-none cursor-pointer"
                  value={roleId}
                  onChange={(e) => setRoleId(parseInt(e.target.value))}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'left 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingLeft: '2.5rem'
                  }}
                >
                  <option value={0}>اختر الدور الوظيفي</option>
                  {roles.map((role) => (
                    <option key={role.ROLE_ID} value={role.ROLE_ID}>
                      {role.NAME}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password Field */}
              <div className="group">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  كلمة المرور
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-900 placeholder:text-gray-400"
                    type={passwordShown ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisiblity}
                    className="absolute right-6  inset-y-0  flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {passwordShown ? <EyeIcon /> : <EyeSlashIcon />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 space-y-3">
              <button
                disabled={loading}
                onClick={formSubmitHandler}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 px-6 rounded-xl text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Spinner />
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                    إنشاء مستخدم جديد
                  </>
                )}
              </button>

              <button
                onClick={() => window.location.href = "/Dashboard"}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 px-6 rounded-xl text-base sm:text-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeftIcon />
                العودة إلى لوحة التحكم
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-t border-gray-100">
            <p className="text-center text-sm text-gray-600">
              جميع الحقول المميزة بـ <span className="text-red-500 font-bold">*</span> إلزامية
            </p>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 sm:p-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                ملاحظة هامة
              </h3>
              <p className="text-sm text-blue-700">
                تأكد من اختيار الدور الوظيفي المناسب للمستخدم لضمان منحه الصلاحيات الصحيحة في النظام.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NewUserForm;