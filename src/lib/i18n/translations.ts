// ============================================
// DeadlineGuard — Bilingual Translation System
// ============================================

export const translations = {
  vi: {
    // App
    'app.name': 'DeadlineGuard',
    'app.tagline': 'Trợ lý nhắc việc thông minh',
    'app.description': 'Phân tích văn bản, trích xuất thời hạn, nhắc nhở đúng lúc',

    // Navigation
    'nav.dashboard': 'Tổng quan',
    'nav.calendar': 'Lịch',
    'nav.documents': 'Văn bản',
    'nav.settings': 'Cài đặt',
    'nav.upload': 'Tải lên',
    'nav.statistics': 'Thống kê',

    // Dashboard
    'dashboard.title': 'Tổng quan',
    'dashboard.welcome': 'Xin chào! Đây là tổng quan deadline của bạn.',
    'dashboard.today': 'Hôm nay',
    'dashboard.thisWeek': 'Tuần này',
    'dashboard.overdue': 'Quá hạn',
    'dashboard.completed': 'Đã hoàn thành',
    'dashboard.upcoming': 'Sắp tới',
    'dashboard.noDeadlines': 'Chưa có deadline nào. Hãy tải văn bản lên để bắt đầu!',
    'dashboard.quickActions': 'Thao tác nhanh',
    'dashboard.recentActivity': 'Hoạt động gần đây',

    // Deadlines
    'deadline.title': 'Tiêu đề',
    'deadline.description': 'Mô tả',
    'deadline.date': 'Thời hạn',
    'deadline.priority': 'Mức ưu tiên',
    'deadline.category': 'Phân loại',
    'deadline.status': 'Trạng thái',
    'deadline.source': 'Nguồn',
    'deadline.confidence': 'Độ tin cậy',
    'deadline.complete': 'Hoàn thành',
    'deadline.snooze': 'Hoãn',
    'deadline.delete': 'Xóa',
    'deadline.edit': 'Chỉnh sửa',
    'deadline.addManual': 'Thêm thủ công',
    'deadline.dueIn': 'Còn {days} ngày',
    'deadline.dueToday': 'Hôm nay',
    'deadline.overdue': 'Quá hạn {days} ngày',
    'deadline.dueHours': 'Còn {hours} giờ',

    // Priority
    'priority.critical': 'Rất quan trọng',
    'priority.high': 'Quan trọng',
    'priority.medium': 'Trung bình',
    'priority.low': 'Thấp',

    // Status
    'status.pending': 'Đang chờ',
    'status.completed': 'Hoàn thành',
    'status.overdue': 'Quá hạn',
    'status.snoozed': 'Đã hoãn',

    // File Upload
    'upload.title': 'Tải văn bản lên',
    'upload.dragDrop': 'Kéo thả file vào đây',
    'upload.or': 'hoặc',
    'upload.browse': 'Chọn file',
    'upload.supported': 'Hỗ trợ: PDF, Word, Excel, Text',
    'upload.analyzing': 'Đang phân tích...',
    'upload.success': 'Phân tích thành công!',
    'upload.error': 'Lỗi khi phân tích file',
    'upload.foundDeadlines': 'Tìm thấy {count} deadline',
    'upload.noDeadlines': 'Không tìm thấy deadline nào trong văn bản',
    'upload.saveAll': 'Lưu tất cả',
    'upload.saveSelected': 'Lưu đã chọn',

    // Calendar
    'calendar.title': 'Lịch Deadline',
    'calendar.month': 'Tháng',
    'calendar.week': 'Tuần',
    'calendar.today': 'Hôm nay',
    'calendar.mon': 'T2',
    'calendar.tue': 'T3',
    'calendar.wed': 'T4',
    'calendar.thu': 'T5',
    'calendar.fri': 'T6',
    'calendar.sat': 'T7',
    'calendar.sun': 'CN',

    // Settings
    'settings.title': 'Cài đặt',
    'settings.general': 'Chung',
    'settings.notifications': 'Thông báo',
    'settings.apiKey': 'Gemini API Key',
    'settings.apiKeyPlaceholder': 'Nhập API key của bạn...',
    'settings.apiKeyHelp': 'Lấy API key tại Google AI Studio',
    'settings.language': 'Ngôn ngữ',
    'settings.theme': 'Giao diện',
    'settings.dark': 'Tối',
    'settings.light': 'Sáng',
    'settings.reminderTimes': 'Thời gian nhắc nhở',
    'settings.quietHours': 'Giờ im lặng',
    'settings.save': 'Lưu cài đặt',
    'settings.saved': 'Đã lưu!',
    'settings.googleDrive': 'Google Drive',
    'settings.connect': 'Kết nối',
    'settings.disconnect': 'Ngắt kết nối',
    'settings.syncInterval': 'Tần suất đồng bộ',
    'settings.sound': 'Âm thanh thông báo',

    // Google Drive
    'drive.title': 'Google Drive',
    'drive.connect': 'Kết nối Google Drive',
    'drive.connected': 'Đã kết nối',
    'drive.disconnected': 'Chưa kết nối',
    'drive.syncing': 'Đang đồng bộ...',
    'drive.lastSync': 'Đồng bộ lần cuối: {time}',
    'drive.selectFolder': 'Chọn thư mục theo dõi',
    'drive.filesWatched': '{count} file đang theo dõi',
    'drive.syncNow': 'Đồng bộ ngay',

    // Statistics
    'stats.title': 'Thống kê',
    'stats.completionRate': 'Tỷ lệ hoàn thành',
    'stats.onTime': 'Đúng hạn',
    'stats.late': 'Trễ hạn',
    'stats.total': 'Tổng deadline',
    'stats.processed': 'Văn bản đã xử lý',

    // Notifications
    'notification.deadlineSoon': 'Deadline sắp đến!',
    'notification.deadlineToday': 'Deadline hôm nay!',
    'notification.deadlineOverdue': 'Deadline đã quá hạn!',
    'notification.newDeadline': 'Deadline mới được phát hiện',
    'notification.enabled': 'Bật thông báo',
    'notification.disabled': 'Tắt thông báo',

    // Common
    'common.save': 'Lưu',
    'common.cancel': 'Hủy',
    'common.delete': 'Xóa',
    'common.edit': 'Sửa',
    'common.close': 'Đóng',
    'common.confirm': 'Xác nhận',
    'common.search': 'Tìm kiếm...',
    'common.filter': 'Lọc',
    'common.sort': 'Sắp xếp',
    'common.all': 'Tất cả',
    'common.loading': 'Đang tải...',
    'common.error': 'Đã xảy ra lỗi',
    'common.retry': 'Thử lại',
    'common.noData': 'Không có dữ liệu',
    'common.yes': 'Có',
    'common.no': 'Không',
  },

  en: {
    // App
    'app.name': 'DeadlineGuard',
    'app.tagline': 'Smart Deadline Reminder',
    'app.description': 'Analyze documents, extract deadlines, remind on time',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.calendar': 'Calendar',
    'nav.documents': 'Documents',
    'nav.settings': 'Settings',
    'nav.upload': 'Upload',
    'nav.statistics': 'Statistics',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Hello! Here is your deadline overview.',
    'dashboard.today': 'Today',
    'dashboard.thisWeek': 'This Week',
    'dashboard.overdue': 'Overdue',
    'dashboard.completed': 'Completed',
    'dashboard.upcoming': 'Upcoming',
    'dashboard.noDeadlines': 'No deadlines yet. Upload a document to get started!',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.recentActivity': 'Recent Activity',

    // Deadlines
    'deadline.title': 'Title',
    'deadline.description': 'Description',
    'deadline.date': 'Due Date',
    'deadline.priority': 'Priority',
    'deadline.category': 'Category',
    'deadline.status': 'Status',
    'deadline.source': 'Source',
    'deadline.confidence': 'Confidence',
    'deadline.complete': 'Complete',
    'deadline.snooze': 'Snooze',
    'deadline.delete': 'Delete',
    'deadline.edit': 'Edit',
    'deadline.addManual': 'Add Manually',
    'deadline.dueIn': '{days} days left',
    'deadline.dueToday': 'Due today',
    'deadline.overdue': '{days} days overdue',
    'deadline.dueHours': '{hours} hours left',

    // Priority
    'priority.critical': 'Critical',
    'priority.high': 'High',
    'priority.medium': 'Medium',
    'priority.low': 'Low',

    // Status
    'status.pending': 'Pending',
    'status.completed': 'Completed',
    'status.overdue': 'Overdue',
    'status.snoozed': 'Snoozed',

    // File Upload
    'upload.title': 'Upload Document',
    'upload.dragDrop': 'Drag and drop files here',
    'upload.or': 'or',
    'upload.browse': 'Browse files',
    'upload.supported': 'Supported: PDF, Word, Excel, Text',
    'upload.analyzing': 'Analyzing...',
    'upload.success': 'Analysis complete!',
    'upload.error': 'Error analyzing file',
    'upload.foundDeadlines': 'Found {count} deadlines',
    'upload.noDeadlines': 'No deadlines found in the document',
    'upload.saveAll': 'Save All',
    'upload.saveSelected': 'Save Selected',

    // Calendar
    'calendar.title': 'Deadline Calendar',
    'calendar.month': 'Month',
    'calendar.week': 'Week',
    'calendar.today': 'Today',
    'calendar.mon': 'Mon',
    'calendar.tue': 'Tue',
    'calendar.wed': 'Wed',
    'calendar.thu': 'Thu',
    'calendar.fri': 'Fri',
    'calendar.sat': 'Sat',
    'calendar.sun': 'Sun',

    // Settings
    'settings.title': 'Settings',
    'settings.general': 'General',
    'settings.notifications': 'Notifications',
    'settings.apiKey': 'Gemini API Key',
    'settings.apiKeyPlaceholder': 'Enter your API key...',
    'settings.apiKeyHelp': 'Get API key from Google AI Studio',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.dark': 'Dark',
    'settings.light': 'Light',
    'settings.reminderTimes': 'Reminder Times',
    'settings.quietHours': 'Quiet Hours',
    'settings.save': 'Save Settings',
    'settings.saved': 'Saved!',
    'settings.googleDrive': 'Google Drive',
    'settings.connect': 'Connect',
    'settings.disconnect': 'Disconnect',
    'settings.syncInterval': 'Sync Interval',
    'settings.sound': 'Notification Sound',

    // Google Drive
    'drive.title': 'Google Drive',
    'drive.connect': 'Connect Google Drive',
    'drive.connected': 'Connected',
    'drive.disconnected': 'Not Connected',
    'drive.syncing': 'Syncing...',
    'drive.lastSync': 'Last sync: {time}',
    'drive.selectFolder': 'Select folder to watch',
    'drive.filesWatched': '{count} files watched',
    'drive.syncNow': 'Sync Now',

    // Statistics
    'stats.title': 'Statistics',
    'stats.completionRate': 'Completion Rate',
    'stats.onTime': 'On Time',
    'stats.late': 'Late',
    'stats.total': 'Total Deadlines',
    'stats.processed': 'Documents Processed',

    // Notifications
    'notification.deadlineSoon': 'Deadline approaching!',
    'notification.deadlineToday': 'Deadline today!',
    'notification.deadlineOverdue': 'Deadline overdue!',
    'notification.newDeadline': 'New deadline detected',
    'notification.enabled': 'Enable notifications',
    'notification.disabled': 'Disable notifications',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.search': 'Search...',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.all': 'All',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.retry': 'Retry',
    'common.noData': 'No data',
    'common.yes': 'Yes',
    'common.no': 'No',
  },
} as const;

export type TranslationKey = keyof typeof translations.vi;
