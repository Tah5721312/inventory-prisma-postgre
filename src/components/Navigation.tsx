'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
// import { Can } from '@/components/Can';
// import { Actions, Subjects } from '@/lib/ability';



export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const userId = (session?.user as any)?.id;

  const commonItems: Array<{
    href: string;
    label: string;
    
  }> = [
    { href: '/main-categories', label: 'التصنيفات الرئيسية'},
    { href: '/sub-categories', label: 'التصنيفات الفرعية' },
    { href: '/items', label: 'الأصناف' },
    { href: '/item-type', label: 'أنواع الأصناف' },
    { href: '/others', label: 'أخرون' },
  ];

  return (
    <nav className='sticky top-0 z-50 bg-blue-600 text-white shadow-lg border-b border-blue-700'>
      <div className='container mx-auto px-4 relative'>
        <div className='flex justify-between items-center py-4'>
          <h1 className='text-lg md:text-xl font-bold'>
            <Link href={'/'} className="hover:opacity-80 transition-opacity">
            Inventory Management System            </Link>
          </h1>

          <div className='flex items-center gap-3'>
            {/* Desktop menu */}
            <div className='hidden md:flex items-center space-x-4 space-x-reverse'>
              {/* إظهار عناصر القائمة فقط عند تسجيل الدخول */}
              {isAuthenticated && commonItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      pathname === item.href
                        ? 'bg-blue-800 text-white'
                        : 'text-blue-100 hover:bg-blue-700'
                    }`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
              ))}

              {!isAuthenticated && (
                <>
                  <Link
                    href={'/login'}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      pathname === '/login'
                        ? 'bg-blue-800 text-white'
                        : 'text-blue-100 hover:bg-blue-700'
                    }`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href={'/register'}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      pathname === '/register'
                        ? 'bg-blue-800 text-white'
                        : 'text-blue-100 hover:bg-blue-700'
                    }`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    مستخدم جديد
                  </Link>
                </>
              )}

              {isAuthenticated && (
                <>
                    <Link
                      href={`/profile/${userId}`}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        pathname === `/profile/${userId}`
                          ? 'bg-blue-800 text-white'
                          : 'text-blue-100 hover:bg-blue-700'
                      }`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      المستخدم
                    </Link>

                  <button
                    onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
                    className='px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-700 transition-colors duration-200'
                  >
                    تسجيل الخروج
                  </button>
                </>
              )}

            </div>

            {/* Mobile hamburger */}
            <button
              type='button'
              aria-label='Toggle navigation menu'
              aria-expanded={isMobileOpen}
              onClick={() => setIsMobileOpen((prev) => !prev)}
              className='md:hidden inline-flex items-center justify-center p-2 rounded-md text-blue-100 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white transition-colors'
            >
              <svg
                className='h-6 w-6'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                aria-hidden='true'
              >
                {isMobileOpen ? (
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                ) : (
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu panel (overlay) */}
        {isMobileOpen && (
          <div className='md:hidden absolute left-0 right-0 top-full z-50 bg-blue-600/95 backdrop-blur shadow-lg border-t border-blue-700'>
            <div className='flex flex-col space-y-2 px-4 pb-4 pt-2'>
              {/* إظهار عناصر القائمة فقط عند تسجيل الدخول */}
              {isAuthenticated && commonItems.map((item) => (
                  <Link
                    key={`mobile-${item.href}`}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      pathname === item.href
                        ? 'bg-blue-800 text-white'
                        : 'text-blue-100 hover:bg-blue-700'
                    }`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
              ))}


              {!isAuthenticated && (
                <>
                  <Link
                    href={'/login'}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      pathname === '/login'
                        ? 'bg-blue-800 text-white'
                        : 'text-blue-100 hover:bg-blue-700'
                    }`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href={'/register'}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      pathname === '/register'
                        ? 'bg-blue-800 text-white'
                        : 'text-blue-100 hover:bg-blue-700'
                    }`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    مستخدم جديد
                  </Link>
                </>
              )}

              {isAuthenticated && (
                <>
                    <Link
                      href={`/profile/${userId}`}
                      className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                        pathname === `/profile/${userId}`
                          ? 'bg-blue-800 text-white'
                          : 'text-blue-100 hover:bg-blue-700'
                      }`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      المستخدم
                    </Link>

                  <button
                    onClick={() => {
                      setIsMobileOpen(false);
                      signOut({ redirect: true, callbackUrl: '/login' });
                    }}
                    className='block text-left px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-blue-700 transition-colors duration-200'
                  >
                    تسجيل الخروج
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
