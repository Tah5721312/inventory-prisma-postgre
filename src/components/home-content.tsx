'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Package, 
  FolderTree, 
  Box, 
  Users, 
  BarChart3, 
  Settings,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react';
import ThreeDGallery from '@/components/ThreeDGallery';
import { Can } from '@/components/Can';


export default function HomeContent() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthenticated = status === 'authenticated' && !!session?.user;

  const features = [
    {
      icon: FolderTree,
      title: 'التصنيفات',
      description: 'تنظيم الأصناف في تصنيفات رئيسية ',
      href: '/main-categories',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      icon: Package,
      title: ' التصنيفات الفرعية',
      description: 'تصنيف فرعي للأصناف تحت التصنيفات الرئيسية',
      href: '/sub-categories',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: Box,
      title: 'أنواع الأصناف',
      description: 'تصنيف دقيق لأنواع الأصناف المختلفة',
      href: '/item-type',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      icon: Users,
      title: 'إدارة المستخدمين',
      description: 'إدارة المستخدمين والأقسام والطوابق',
      href: '/users',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      icon: BarChart3,
      title: 'الإحصائيات',
      description: 'تقارير وإحصائيات شاملة عن النظام',
      href: '/statistics',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      icon: Settings,
      title: 'الإعدادات',
      description: 'إعدادات متقدمة للنظام',
      href: '/others',
      color: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20'
    }
  ];

  const stats = [
    { label: 'نظام متكامل', icon: Shield, value: '100%' },
    { label: 'أداء عالي', icon: Zap, value: 'سريع' },
    { label: 'موثوقية', icon: CheckCircle2, value: 'آمن' },
    { label: 'نمو مستمر', icon: TrendingUp, value: 'متطور' }
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 relative">
      {/* Hero Section */}
      <div className="relative overflow-hidden z-10">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative container mx-auto px-4 py-12 md:py-20">
          <div className="text-center max-w-4xl mx-auto" dir="rtl">
            {/* Welcome Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold shadow-lg animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>مرحباً بك في نظام إدارة المخزون</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              نظام إدارة المخزون
              <br />
              والمستودعات
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              نظام متكامل وشامل لإدارة المخزون والأصناف بطريقة احترافية وسهلة
            </p>

            {/* 3D Gallery */}
            <div className="flex justify-center items-center mb-40">
              <ThreeDGallery />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 ">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-dark-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CTA Buttons */}
            {isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/items"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  ابدأ الإدارة
                </Link>
                <Link
                  href="/statistics"
                  className="px-8 py-4 bg-white dark:bg-dark-800 text-slate-800 dark:text-slate-200 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl border-2 border-slate-200 dark:border-dark-700 transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  <BarChart3 className="w-5 h-5" />
                  عرض الإحصائيات
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="px-8 py-4 bg-white dark:bg-dark-800 text-slate-800 dark:text-slate-200 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl border-2 border-slate-200 dark:border-dark-700 transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  إنشاء حساب جديد
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <Can do="manage" on="all">
        {isAuthenticated && (
        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <div className="text-center mb-12" dir="rtl">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              المميزات الرئيسية
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              استكشف جميع المميزات والإمكانيات المتاحة في النظام
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={index}
                  href={feature.href}
                  className="group relative bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700"
                >
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-semibold text-sm group-hover:translate-x-2 transition-transform">
                    <span>استكشف المزيد</span>
                    <ArrowLeft className="w-4 h-4 mr-2 rotate-180" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        )}
   </Can> 

      {/* Footer */}
      <footer className="bg-white dark:bg-dark-800 border-t border-slate-200 dark:border-dark-700 mt-20 relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center" dir="rtl">
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              © {new Date().getFullYear()} نظام إدارة المخزون والمستودعات
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">
              تصميم وتطوير: <span className="font-semibold text-blue-600 dark:text-blue-400">محمد عبد الفتاح</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

