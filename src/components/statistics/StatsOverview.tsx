'use client';

// ============================================
// DeadlineGuard — StatsOverview Component
// ============================================

import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  PieChart,
} from 'lucide-react';
import type { AppStats, Deadline } from '@/types';

interface StatsOverviewProps {
  stats: AppStats;
  deadlines: Deadline[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  deadlines,
}) => {
  // 1. Calculate category distributions for charts
  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    let max = 0;

    deadlines.forEach((d) => {
      if (d.category) {
        const cat = d.category.trim();
        counts[cat] = (counts[cat] || 0) + 1;
        if (counts[cat] > max) max = counts[cat];
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: max > 0 ? (count / max) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  }, [deadlines]);

  // Donut chart stroke math
  const completionPercentage = Math.round(stats.completionRate * 100) || 0;
  const strokeDashArray = `${completionPercentage} ${100 - completionPercentage}`;

  return (
    <div className="stats-overview-layout-container" id="stats-overview-root">
      {/* 1. Stat cards grid */}
      <div className="stats-cards-grid">
        {/* Total Card */}
        <div className="stat-card glass-card gradient-glow-primary">
          <div className="card-top-row">
            <span className="card-title">Tổng số hạn chót</span>
            <div className="card-icon-container">
              <Calendar size={18} />
            </div>
          </div>
          <span className="card-main-number">{stats.totalDeadlines}</span>
          <div className="card-trend-info text-success">
            <TrendingUp size={14} style={{ marginRight: '3px' }} />
            <span>Tiến độ tổng quát tăng mạnh</span>
          </div>
        </div>

        {/* Overdue Card */}
        <div className="stat-card glass-card gradient-glow-danger">
          <div className="card-top-row">
            <span className="card-title">Đang quá hạn</span>
            <div className="card-icon-container">
              <AlertTriangle size={18} />
            </div>
          </div>
          <span className="card-main-number text-danger">{stats.overdue}</span>
          <div className="card-trend-info text-danger">
            {stats.overdue > 0 ? (
              <>
                <TrendingDown size={14} style={{ marginRight: '3px' }} />
                <span>Yêu cầu xử lý gấp!</span>
              </>
            ) : (
              <>
                <CheckCircle size={14} style={{ marginRight: '3px', color: 'var(--accent-success)' }} />
                <span className="text-success">Không có việc trễ hạn</span>
              </>
            )}
          </div>
        </div>

        {/* Upcoming Card */}
        <div className="stat-card glass-card gradient-glow-warning">
          <div className="card-top-row">
            <span className="card-title">Sắp tới (Tuần này)</span>
            <div className="card-icon-container">
              <Clock size={18} />
            </div>
          </div>
          <span className="card-main-number text-warning">{stats.upcoming}</span>
          <div className="card-trend-info text-warning">
            <span>Đã lên lịch nhắc nhở đầy đủ</span>
          </div>
        </div>

        {/* Processed Card */}
        <div className="stat-card glass-card gradient-glow-info">
          <div className="card-top-row">
            <span className="card-title">Văn bản đã phân tích</span>
            <div className="card-icon-container">
              <FileText size={18} />
            </div>
          </div>
          <span className="card-main-number text-info">{stats.documentsProcessed}</span>
          <div className="card-trend-info text-info">
            <span>Tiết kiệm 95% thời gian đọc</span>
          </div>
        </div>
      </div>

      {/* 2. Charts Visualizations Grid */}
      <div className="stats-charts-visual-grid">
        {/* Left chart: Donut completion rate */}
        <div className="chart-wrapper-card glass-card">
          <h3 className="chart-card-title">Tỷ lệ hoàn thành công việc</h3>

          <div className="donut-chart-container-block">
            {/* SVG circle donut */}
            <div className="css-donut-chart-svg">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle-fill-progress"
                  strokeDasharray={strokeDashArray}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="donut-center-percentage-text">
                <span className="percent-val">{completionPercentage}%</span>
                <span className="percent-lbl">Đã xong</span>
              </div>
            </div>

            {/* Donut legends description */}
            <div className="donut-legends-group">
              <div className="legend-item">
                <span className="legend-color-dot dot-done"></span>
                <div className="legend-label-col">
                  <span className="lbl">Đúng hạn</span>
                  <span className="val">{stats.completedOnTime} công việc</span>
                </div>
              </div>
              <div className="legend-item">
                <span className="legend-color-dot dot-pending"></span>
                <div className="legend-label-col">
                  <span className="lbl">Đang chờ xử lý</span>
                  <span className="val">
                    {stats.totalDeadlines - stats.completedOnTime} việc
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right chart: Category horizontal bar charts */}
        <div className="chart-wrapper-card glass-card">
          <h3 className="chart-card-title">Phân phối hạn chót theo chủ đề</h3>

          <div className="bar-chart-container-block">
            {categoryChartData.length === 0 ? (
              <div className="charts-empty-placeholder">
                <PieChart size={32} className="chart-empty-icon" />
                <p className="chart-empty-text">Chưa có đủ số liệu phân phối chủ đề</p>
              </div>
            ) : (
              <div className="bar-charts-list">
                {categoryChartData.map((item, idx) => (
                  <div key={idx} className="bar-chart-row-item">
                    <div className="bar-labels-row">
                      <span className="category-name">{item.name}</span>
                      <span className="category-count">{item.count} việc</span>
                    </div>

                    {/* CSS Bar track */}
                    <div className="bar-chart-track-bg">
                      <div
                        className="bar-chart-fill-val"
                        style={{
                          width: `${item.percent}%`,
                          background: `linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
