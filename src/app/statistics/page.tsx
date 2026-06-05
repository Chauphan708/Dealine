'use client';

// ============================================
// DeadlineGuard — Statistics Page
// ============================================

import React from 'react';
import { useDeadlines } from '@/hooks/useDeadlines';
import StatsOverview from '@/components/statistics/StatsOverview';
import { BarChart3, TrendingUp, Sparkles } from 'lucide-react';

export default function StatisticsPage() {
  const { deadlines, stats, loading } = useDeadlines();

  return (
    <div className="statistics-page-container" id="statistics-page-root" style={{ width: '100%' }}>
      {loading ? (
        <div className="stats-loading-skeleton glass-card shine" style={{ height: '400px', width: '100%', padding: '20px' }}>
          <div className="skeleton-line" style={{ width: '180px', height: '24px', marginBottom: '20px' }}></div>
          <div className="skeleton-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton-line" style={{ height: '100px', borderRadius: '8px' }}></div>
            ))}
          </div>
          <div className="skeleton-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="skeleton-line" style={{ height: '200px', borderRadius: '12px' }}></div>
            <div className="skeleton-line" style={{ height: '200px', borderRadius: '12px' }}></div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top banner describing analytics */}
          <div className="stats-page-hero-card glass-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', alignItems: 'center', backgroundColor: 'rgba(102, 126, 234, 0.03)' }}>
            <div className="hero-left-block">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <BarChart3 size={20} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Phân tích & Thống kê Hiệu suất</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Xem báo cáo hiệu quả xử lý công việc đúng hạn, phân phối hạng mục và theo dõi mức độ hoàn thành
              </p>
            </div>

            <div className="hero-right-block" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-success)' }}>
              <TrendingUp size={16} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Tốc độ xử lý +15% tuần này</span>
            </div>
          </div>

          {/* Core visual stats layout */}
          <StatsOverview stats={stats} deadlines={deadlines} />
        </div>
      )}
    </div>
  );
}
