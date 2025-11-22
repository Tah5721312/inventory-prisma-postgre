'use client';

import { User, Shield, Calendar, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserInfoCardProps {
  user: {
    username: string;
    isAdmin: boolean;
    id: string | number;
  };
  fullUserData?: {
    EMAIL: string;
    CREATED_AT: string | Date;
  };
}

export default function UserInfoCard({ user, fullUserData }: UserInfoCardProps) {
  const router = useRouter();
  
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-xl p-6 text-white mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Side - User Info */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/40">
            <span className="text-3xl font-bold">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* User Details */}
          <div>
            <h2 className="text-2xl font-bold mb-1">
              مرحباً، {user.username} 👋
            </h2>
            <div className="flex items-center gap-2 text-blue-100">
              <Shield className="w-4 h-4" />
              <span className="text-sm">
                {user.isAdmin ? 'مدير النظام' : 'مستخدم عادي'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Badge */}
        <div className="flex flex-col gap-2">
          {user.isAdmin && (
            <div className="bg-red-500 px-4 py-2 rounded-lg font-bold text-center shadow-lg">
              🔑 ADMIN
            </div>
          )}
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-center border border-white/30">
            <p className="text-xs text-blue-100">User ID</p>
            <p className="font-bold">#{user.id}</p>
          </div>
        </div>
      </div>

      {/* Additional Info (if fullUserData is provided) */}
      {fullUserData && (
        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Email */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <Mail className="w-5 h-5 text-blue-200" />
              <div>
                <p className="text-xs text-blue-100">البريد الإلكتروني</p>
                <p className="text-sm font-medium truncate">{fullUserData.EMAIL}</p>
              </div>
            </div>

            {/* Registration Date */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <Calendar className="w-5 h-5 text-blue-200" />
              <div>
                <p className="text-xs text-blue-100">تاريخ التسجيل</p>
                <p className="text-sm font-medium">
                  {new Date(fullUserData.CREATED_AT).toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>

            {/* User Stats */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <User className="w-5 h-5 text-blue-200" />
              <div>
                <p className="text-xs text-blue-100">حالة الحساب</p>
                <p className="text-sm font-medium">نشط ✅</p>
              </div>
            </div>

            {/* زر الذهاب للبروفايل */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <button
                onClick={() => router.push(`/profile/${user.id}`)}
                className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 border border-white/30 hover:border-white/50"
              >
                الذهاب إلى البروفايل
              </button>
            </div>
      
          </div>
        </div>
      )}
    </div>
  );
}