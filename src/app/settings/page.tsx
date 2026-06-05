'use client';

// ============================================
// DeadlineGuard — Settings Page
// ============================================

import React, { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useNotifications } from '@/hooks/useNotifications';
import DriveConnector from '@/components/drive/DriveConnector';
import Button from '@/components/common/Button';
import { useToast } from '@/components/common/Toast';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  Key,
  Eye,
  EyeOff,
  Bell,
  Volume2,
  VolumeX,
  Globe,
  Settings,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings, toggleTheme } = useSettings();
  const { permission, requestPermission, sendTestNotification } = useNotifications();
  const { t, language, setLanguage } = useI18n();
  const { toast } = useToast();

  // Gemini API Key State
  const [apiKey, setApiKey] = useState(settings.geminiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  // Sync state with settings on load/render
  React.useEffect(() => {
    if (settings.geminiApiKey) {
      setApiKey(settings.geminiApiKey);
    }
  }, [settings.geminiApiKey]);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingKey(true);
      await updateSettings({ geminiApiKey: apiKey });
      toast('Đã cập nhật Gemini API Key thành công! 🔑', 'success');
    } catch {
      toast('Cập nhật API Key thất bại.', 'error');
    } finally {
      setSavingKey(false);
    }
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value as 'vi' | 'en';
    setLanguage(lang);
    await updateSettings({ language: lang });
    toast(lang === 'vi' ? 'Đã đổi sang Tiếng Việt' : 'Changed to English', 'success');
  };

  const handleNotifyToggle = async () => {
    const next = !settings.notificationsEnabled;
    await updateSettings({ notificationsEnabled: next });
    toast(next ? 'Đã bật thông báo nhắc nhở.' : 'Đã tắt thông báo nhắc nhở.', 'info');
  };

  const handleSoundToggle = async () => {
    const next = !settings.soundEnabled;
    await updateSettings({ soundEnabled: next });
    toast(next ? 'Đã bật âm thanh thông báo.' : 'Đã tắt âm thanh thông báo.', 'info');
  };

  const handleRequestPermission = async () => {
    const res = await requestPermission();
    if (res === 'granted') {
      toast('Cấp quyền thông báo hệ thống thành công!', 'success');
    } else {
      toast('Quyền thông báo bị từ chối.', 'warning');
    }
  };

  return (
    <div className="settings-page-container" id="settings-page-root" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. API Key Card Section */}
      <div className="settings-card-item glass-card">
        <div className="settings-card-header">
          <Key className="card-header-icon" />
          <div className="header-info">
            <h3 className="card-title">Cấu hình Cung cấp API Key (Gemini AI)</h3>
            <p className="card-desc">Cung cấp khóa API của bạn để trích xuất tự động bằng Trí tuệ Nhân tạo thông minh</p>
          </div>
        </div>

        <form onSubmit={handleSaveApiKey} className="api-key-form-flow" style={{ marginTop: '16px' }}>
          <div className="form-field">
            <label className="field-label">Gemini API Key của bạn:</label>
            <div className="input-with-button-wrapper" style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <div className="password-input-container" style={{ position: 'relative', flex: 1 }}>
                <input
                  id="settings-api-key-input"
                  type={showKey ? 'text' : 'password'}
                  placeholder="Nhập AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="edit-field-input"
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', opacity: 0.7 }}
                  id="settings-eye-toggle"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Button id="btn-save-api-key" variant="primary" type="submit" loading={savingKey}>
                Cập nhật khóa
              </Button>
            </div>
          </div>

          <div className="api-key-instructions-card glass-card" style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <HelpCircle size={14} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Chưa có khóa? Bạn có thể lấy khóa miễn phí tại{' '}
              <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                Google AI Studio
              </a>.
            </span>
          </div>
        </form>
      </div>

      {/* 2. Google Drive & NotebookLM integration Connector */}
      <DriveConnector />

      {/* 3. General Preferences */}
      <div className="settings-card-item glass-card">
        <div className="settings-card-header">
          <Settings className="card-header-icon" />
          <div className="header-info">
            <h3 className="card-title">Cấu hình Hệ thống & Giao diện</h3>
            <p className="card-desc">Thiết lập các cấu hình đa ngôn ngữ và chuyển đổi giao diện chính</p>
          </div>
        </div>

        <div className="general-settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          {/* Language selection */}
          <div className="setting-field-block">
            <label className="field-label">Ngôn ngữ hiển thị (Language):</label>
            <div className="select-container" style={{ width: '100%', marginTop: '8px' }}>
              <Globe size={16} className="select-icon" />
              <select
                id="settings-lang-select"
                value={settings.language}
                onChange={handleLanguageChange}
                className="filter-select"
                style={{ width: '100%', paddingLeft: '32px' }}
              >
                <option value="vi">Tiếng Việt (VI) 🇻🇳</option>
                <option value="en">English (EN) 🇺🇸</option>
              </select>
            </div>
          </div>

          {/* Theme Quick change */}
          <div className="setting-field-block">
            <label className="field-label">Chế độ giao diện (Giao diện):</label>
            <div style={{ marginTop: '8px' }}>
              <Button id="btn-settings-theme-toggle" variant="secondary" onClick={toggleTheme} style={{ width: '100%' }}>
                {settings.theme === 'dark' ? 'Chuyển sang giao diện Sáng ☀️' : 'Chuyển sang giao diện Tối 🌙'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Notification Settings */}
      <div className="settings-card-item glass-card">
        <div className="settings-card-header">
          <Bell className="card-header-icon" />
          <div className="header-info">
            <h3 className="card-title">Thiết lập Thông báo nhắc nhở</h3>
            <p className="card-desc">Thiết lập cách thức và các quy định gửi thông báo khi đến hạn công việc</p>
          </div>
        </div>

        <div className="notification-settings-flow" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
          {/* System permission row */}
          <div className="setting-toggle-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="toggle-left">
              <span className="toggle-label" style={{ fontWeight: 600, display: 'block' }}>Quyền thông báo hệ thống</span>
              <span className="toggle-sub" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Trạng thái hiện tại:{' '}
                <strong style={{ color: permission === 'granted' ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                  {permission === 'granted' ? 'Đã cho phép' : permission === 'denied' ? 'Bị từ chối' : 'Chưa thiết lập'}
                </strong>
              </span>
            </div>
            {permission !== 'granted' ? (
              <Button id="btn-request-notification" variant="secondary" size="sm" onClick={handleRequestPermission}>
                Cấp quyền thông báo
              </Button>
            ) : (
              <Button id="btn-test-notification" variant="ghost" size="sm" onClick={() => sendTestNotification()}>
                Gửi thông báo thử
              </Button>
            )}
          </div>

          <hr className="divider" style={{ border: 'none', borderBottom: '1px solid var(--border-color)' }} />

          {/* Toggle notify active */}
          <div className="setting-toggle-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="toggle-left">
              <span className="toggle-label" style={{ fontWeight: 600, display: 'block' }}>Bật thông báo đẩy</span>
              <span className="toggle-sub" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cho phép gửi thông báo in-app và đẩy trên trình duyệt</span>
            </div>
            <button
              onClick={handleNotifyToggle}
              className={`sidebar-control-btn ${settings.notificationsEnabled ? 'active-accent' : ''}`}
              style={{ width: '100px', padding: '6px 0', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}
              id="settings-notify-toggle-btn"
            >
              {settings.notificationsEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <hr className="divider" style={{ border: 'none', borderBottom: '1px solid var(--border-color)' }} />

          {/* Toggle sound preferences */}
          <div className="setting-toggle-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="toggle-left">
              <span className="toggle-label" style={{ fontWeight: 600, display: 'block' }}>Âm thanh nhắc nhở</span>
              <span className="toggle-sub" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Phát âm thanh chuông báo nhỏ khi nhận nhắc nhở khẩn cấp</span>
            </div>
            <button
              onClick={handleSoundToggle}
              className={`sidebar-control-btn ${settings.soundEnabled ? 'active-accent' : ''}`}
              style={{ width: '100px', padding: '6px 0', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}
              id="settings-sound-toggle-btn"
            >
              {settings.soundEnabled ? <Volume2 size={16} style={{ display: 'inline' }} /> : <VolumeX size={16} style={{ display: 'inline' }} />}
            </button>
          </div>
        </div>
      </div>

      {/* 5. About card */}
      <div className="settings-card-item glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: 'rgba(102, 126, 234, 0.05)' }}>
        <ShieldCheck size={32} style={{ color: 'var(--accent-primary)' }} />
        <div className="about-info">
          <h4 style={{ fontWeight: 600, fontSize: '14px' }}>Hệ thống Quản lý Dữ liệu An toàn, Cục bộ</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
            Mọi dữ liệu thời hạn công việc (deadlines), ghi chú và tệp tải lên đều được xử lý cục bộ hoàn toàn tại thiết bị của bạn thông qua IndexedDB (Offline-first). Ổn định, an toàn và bảo mật tuyệt đối!
          </p>
        </div>
      </div>
    </div>
  );
}
