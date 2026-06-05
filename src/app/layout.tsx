'use client';

// ============================================
// DeadlineGuard — Root Layout
// ============================================

import React, { useState } from 'react';
import './globals.css';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { ToastProvider } from '@/components/common/Toast';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <title>DeadlineGuard — Trợ Lý Nhắc Việc Thông Minh</title>
        <meta name="description" content="Trích xuất thời hạn tự động từ tài liệu bằng AI, gửi nhắc nhở thông minh qua email, thông báo đẩy." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#0a0e1a" />
        <link rel="icon" href="/favicon.ico" />
        {/* PWA Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DeadlineGuard" />
      </head>
      <body>
        <I18nProvider>
          <ToastProvider>
            <div className="app-layout" id="app-layout-root">
              {/* Sidebar drawer */}
              <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

              {/* Main content wrapper */}
              <div className="main-wrapper" id="app-main-container">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <main className="main-content" id="app-main-content">
                  {children}
                </main>
              </div>

              {/* Mobile bottom Navigation */}
              <MobileNav />
            </div>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
