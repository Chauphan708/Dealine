'use client';

// ============================================
// DeadlineGuard — Mobile Nav Component
// ============================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, FileText, Settings, BarChart3 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems = [
    { href: '/', label: t('nav.dashboard'), icon: <LayoutDashboard size={20} /> },
    { href: '/calendar', label: t('nav.calendar'), icon: <CalendarDays size={20} /> },
    { href: '/documents', label: t('nav.documents'), icon: <FileText size={20} /> },
    { href: '/statistics', label: t('nav.statistics') || 'Thống kê', icon: <BarChart3 size={20} /> },
    { href: '/settings', label: t('nav.settings'), icon: <Settings size={20} /> },
  ];

  return (
    <nav className="mobile-nav" id="mobile-nav-container">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            id={`mobile-nav-${item.href.replace('/', '') || 'dashboard'}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNav;
