'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import AutoLogout from '@/components/AutoLogout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AutoLogout inactivityTimeout={15 * 60 * 1000} /> {/* 15 minutes inactivity timeout */}
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        className="custom-toast-container"
      />
    </SessionProvider>
  );
}

