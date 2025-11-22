'use client';

import { useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';

interface AutoLogoutProps {
  inactivityTimeout?: number; // in milliseconds, default 15 minutes (900000ms)
}

const LAST_ACTIVITY_KEY = 'lastActivity';
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export default function AutoLogout({ inactivityTimeout = INACTIVITY_TIMEOUT }: AutoLogoutProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const { data: session, update, status } = useSession();
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  useEffect(() => {
    // التحقق من الجلسة عند فتح التطبيق
    if (status === 'authenticated' && session) {
      const lastActivity = sessionStorage.getItem(LAST_ACTIVITY_KEY);
      const now = Date.now();
      
      // إذا كان هناك lastActivity محفوظ ومرت أكثر من 15 دقيقة
      if (lastActivity) {
        const timeSinceLastActivity = now - parseInt(lastActivity, 10);
        if (timeSinceLastActivity > inactivityTimeout) {
          // الجلسة قديمة، تسجيل الخروج
          sessionStorage.removeItem(LAST_ACTIVITY_KEY);
          signOut({ 
            redirect: true, 
            callbackUrl: '/login' 
          });
          return;
        }
      } else {
        // إذا لم يكن هناك lastActivity، نضع timestamp الحالي
        sessionStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      }
    }

    // إذا لم يكن المستخدم مسجل دخول، ننظف sessionStorage
    if (!session || status !== 'authenticated') {
      sessionStorage.removeItem(LAST_ACTIVITY_KEY);
      return;
    }

    const resetTimeout = () => {
      // تحديث lastActivity في sessionStorage
      sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // تحديث الجلسة عند التفاعل لتحديث lastActivity
      // نحدث الجلسة كل 60 ثانية (كما محدد في updateAge)
      if (sessionUpdateRef.current) {
        clearTimeout(sessionUpdateRef.current);
      }
      
      sessionUpdateRef.current = setTimeout(() => {
        update(); // تحديث الجلسة عند التفاعل
      }, 60 * 1000); // كل 60 ثانية

      // Set new timeout للتسجيل الخروج بعد 15 دقيقة من عدم التفاعل
      timeoutRef.current = setTimeout(() => {
        sessionStorage.removeItem(LAST_ACTIVITY_KEY);
        // Auto logout after inactivity
        signOut({ 
          redirect: true, 
          callbackUrl: '/login' 
        });
      }, inactivityTimeout);
    };

    // Set initial timeout
    resetTimeout();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimeout, true);
    });

    // Handle visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // عند فتح التبويب مرة أخرى، التحقق من الجلسة
        const lastActivity = sessionStorage.getItem(LAST_ACTIVITY_KEY);
        const now = Date.now();
        
        if (lastActivity) {
          const timeSinceLastActivity = now - parseInt(lastActivity, 10);
          if (timeSinceLastActivity > inactivityTimeout) {
            // الجلسة قديمة، تسجيل الخروج
            sessionStorage.removeItem(LAST_ACTIVITY_KEY);
            signOut({ 
              redirect: true, 
              callbackUrl: '/login' 
            });
            return;
          }
        }
        resetTimeout();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (sessionUpdateRef.current) {
        clearTimeout(sessionUpdateRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimeout, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [inactivityTimeout, session, status, update]);

  return null; // This component doesn't render anything
}

