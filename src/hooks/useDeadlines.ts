'use client';

// ============================================
// DeadlineGuard — useDeadlines Custom Hook
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Deadline, Priority, DeadlineStatus, AppStats, DocumentAnalysis, Reminder } from '@/types';
import {
  getAllDeadlines,
  addDeadline,
  addDeadlines,
  updateDeadline,
  deleteDeadline as deleteDbDeadline,
  getStats as getDbStats,
  addDocument,
  getDB,
} from '@/lib/storage/database';
import { generateId } from '@/lib/utils/helpers';
import { suggestReminders } from '@/lib/ai/reminderSuggester';

// ---- Vietnamese Mock Data for Demo / Seed ----
const MOCK_DEADLINES: Deadline[] = [
  {
    id: 'mock-1',
    title: 'Nộp Báo cáo Tài chính Quý 2 - 2026',
    description: 'Nộp báo cáo tài chính quý 2 cho cơ quan thuế. Báo cáo cần bao gồm bảng cân đối kế toán, báo cáo kết quả hoạt động kinh doanh và thuyết minh báo cáo tài chính.',
    deadlineDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // 2 days 4 hours
    priority: 'critical',
    category: 'nộp thuế',
    sourceText: 'Doanh nghiệp phải nộp Báo cáo tài chính Quý II năm 2026 chậm nhất là ngày 30 tháng 06 năm 2026.',
    sourceFile: 'Quy_dinh_nop_bao_cao_2026.pdf',
    confidence: 0.95,
    status: 'pending',
    reminders: [],
    tags: ['Tài chính', 'Thuế'],
    notes: 'Liên hệ chị Lan phòng kế toán để chốt số liệu trước khi gửi.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    title: 'Hạn chót Đăng ký Tham gia Triển lãm TechExpo',
    description: 'Gửi hồ sơ đăng ký gian hàng triển lãm TechExpo 2026 tại SECC. Cần chuẩn bị layout gian hàng, danh sách sản phẩm trưng bày và thông tin giới thiệu doanh nghiệp.',
    deadlineDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
    priority: 'high',
    category: 'dự án',
    sourceText: 'Thời hạn đăng ký tham gia trưng bày và thanh toán chi phí đặt cọc trước ngày 06/06/2026.',
    sourceFile: 'Thu_moi_trien_lam_TechExpo.docx',
    confidence: 0.9,
    status: 'pending',
    reminders: [],
    tags: ['Marketing', 'Sự kiện'],
    notes: 'Gian hàng dự kiến 18m2. Đã duyệt ngân sách.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    title: 'Ký kết Hợp đồng Cung cấp Thiết bị với ABC Corp',
    description: 'Hoàn thiện việc đàm phán các điều khoản thanh toán và tiến độ giao hàng để tiến hành ký kết hợp đồng chính thức.',
    deadlineDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
    priority: 'critical',
    category: 'hợp đồng',
    sourceText: 'Đại diện hai bên sẽ thực hiện ký kết hợp đồng cung cấp thiết bị chậm nhất vào lúc 17h00 ngày hôm nay.',
    sourceFile: 'Thong_bao_thuong_thao_hop_dong.docx',
    confidence: 0.88,
    status: 'pending',
    reminders: [],
    tags: ['Pháp lý', 'Kinh doanh'],
    notes: 'Kiểm tra kỹ điều khoản phạt chậm tiến độ.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-4',
    title: 'Nộp Thuế Thu nhập Cá nhân Quý 1',
    description: 'Khai quyết toán thuế và nộp tiền thuế TNCN phát sinh trong quý 1 năm 2026 cho cán bộ nhân viên.',
    deadlineDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Overdue by 1 day
    priority: 'high',
    category: 'nộp thuế',
    sourceText: 'Thời hạn kê khai thuế thu nhập cá nhân Quý 1 năm 2026 chậm nhất là ngày cuối cùng của tháng thứ tư kể từ ngày kết thúc quý.',
    sourceFile: 'Nghia_vu_thue_2026.xlsx',
    confidence: 0.92,
    status: 'pending',
    reminders: [],
    tags: ['Kế toán', 'Nhân sự'],
    notes: 'Đang chờ cập nhật thông tin người phụ thuộc của 2 nhân viên mới.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-5',
    title: 'Họp Tổng kết Kế hoạch Phát triển Sản phẩm',
    description: 'Họp rà soát tiến độ thiết kế UI/UX mới cho ứng dụng di động và chốt timeline lập trình.',
    deadlineDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    priority: 'medium',
    category: 'họp',
    sourceText: 'Lịch họp định kỳ chốt thiết kế sản phẩm vào lúc 14h00 ngày thứ Năm tuần này.',
    sourceFile: 'Ke_hoach_tuan.txt',
    confidence: 0.98,
    status: 'completed',
    reminders: [],
    tags: ['Họp', 'Product'],
    notes: 'Đã hoàn thành chuẩn bị slide giới thiệu các mẫu wireframe.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export interface DeadlineFilter {
  priority: Priority | 'all';
  status: DeadlineStatus | 'all';
  category: string | 'all';
  search: string;
}

export type DeadlineSortBy = 'date' | 'priority' | 'status' | 'created';

/**
 * Hook for managing deadlines, sorting, filtering, and IndexedDB integration.
 */
export function useDeadlines() {
  const [rawDeadlines, setRawDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AppStats>({
    totalDeadlines: 0,
    completedOnTime: 0,
    overdue: 0,
    upcoming: 0,
    documentsProcessed: 0,
    completionRate: 0,
  });

  // Filter and Sort states
  const [filters, setFiltersState] = useState<DeadlineFilter>({
    priority: 'all',
    status: 'all',
    category: 'all',
    search: '',
  });
  const [sortBy, setSortByState] = useState<DeadlineSortBy>('date');

  // Trigger state reload
  const reloadData = useCallback(async () => {
    try {
      setLoading(true);
      const db = getDB();
      if (!db) {
        setLoading(false);
        return;
      }

      // Check if DB is empty. If so, seed mock data so the app has content instantly.
      const count = await db.deadlines.count();
      if (count === 0) {
        // Seed mock deadlines
        await addDeadlines(MOCK_DEADLINES);
      }

      const list = await getAllDeadlines();
      setRawDeadlines(list);

      const dbStats = await getDbStats();
      setStats(dbStats);
      setError(null);
    } catch (err: unknown) {
      console.error('[useDeadlines] Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Unknown database error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Hydrate on mount
  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Expose filter updates
  const updateFilters = useCallback((newFilters: Partial<DeadlineFilter>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Expose sort updates
  const updateSort = useCallback((newSort: DeadlineSortBy) => {
    setSortByState(newSort);
  }, []);

  // ---- CRUD Actions ----

  /**
   * Create a manual deadline with smart default reminders
   */
  const createManualDeadline = useCallback(async (data: Omit<Deadline, 'id' | 'status' | 'reminders' | 'createdAt' | 'updatedAt'>) => {
    const id = generateId();
    const newDeadline: Deadline = {
      ...data,
      id,
      status: 'pending',
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto suggest reminders
    const reminders = suggestReminders(newDeadline);
    newDeadline.reminders = reminders;

    await addDeadline(newDeadline);
    
    // Save reminders in Dexie too
    const db = getDB();
    if (db && reminders.length > 0) {
      await db.reminders.bulkPut(reminders);
    }

    await reloadData();
    return newDeadline;
  }, [reloadData]);

  /**
   * Toggle a deadline between Completed and Pending status
   */
  const toggleComplete = useCallback(async (id: string) => {
    const item = rawDeadlines.find((d) => d.id === id);
    if (!item) return;

    const newStatus: DeadlineStatus = item.status === 'completed' ? 'pending' : 'completed';
    await updateDeadline(id, { status: newStatus });
    await reloadData();
  }, [rawDeadlines, reloadData]);

  /**
   * Snooze a deadline by adding N hours to its deadlineDate
   */
  const snooze = useCallback(async (id: string, hours: number) => {
    const item = rawDeadlines.find((d) => d.id === id);
    if (!item) return;

    const originalDate = new Date(item.deadlineDate);
    const newDate = new Date(originalDate.getTime() + hours * 60 * 60 * 1000);

    // Update status to 'snoozed' if it was pending or overdue
    const newStatus: DeadlineStatus = 'snoozed';

    // Recalculate reminders based on new date
    const updatedDeadline: Deadline = {
      ...item,
      deadlineDate: newDate.toISOString(),
      status: newStatus,
    };
    const newReminders = suggestReminders(updatedDeadline);

    await updateDeadline(id, {
      deadlineDate: newDate.toISOString(),
      status: newStatus,
      reminders: newReminders,
    });

    // Replace reminders in the database
    const db = getDB();
    if (db) {
      await db.reminders.where('deadlineId').equals(id).delete();
      if (newReminders.length > 0) {
        await db.reminders.bulkPut(newReminders);
      }
    }

    await reloadData();
  }, [rawDeadlines, reloadData]);

  /**
   * Delete a deadline
   */
  const deleteItem = useCallback(async (id: string) => {
    await deleteDbDeadline(id);
    await reloadData();
  }, [reloadData]);

  /**
   * Import analysis results from Gemini, batch creating deadlines
   */
  const importAnalysisResults = useCallback(async (analysis: DocumentAnalysis) => {
    const docId = analysis.id;
    const documentRecord = {
      id: docId,
      fileName: analysis.fileName,
      fileSize: analysis.fileSize,
      fileType: analysis.fileType,
      rawText: analysis.rawText,
      documentSummary: analysis.documentSummary,
      documentType: analysis.documentType,
      deadlineIds: [] as string[],
      analyzedAt: analysis.analyzedAt,
      processingTime: analysis.processingTime,
    };

    const deadlinesToCreate: Deadline[] = [];
    const allReminders: Reminder[] = [];

    for (const extracted of analysis.deadlines) {
      const dlId = generateId();
      documentRecord.deadlineIds.push(dlId);

      const newDeadline: Deadline = {
        id: dlId,
        title: extracted.title,
        description: extracted.description,
        deadlineDate: extracted.deadlineDate,
        priority: extracted.priority,
        category: extracted.category,
        sourceText: extracted.sourceText,
        sourceFile: analysis.fileName,
        confidence: extracted.confidence,
        status: 'pending',
        reminders: [],
        tags: [extracted.category],
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const reminders = suggestReminders(newDeadline);
      newDeadline.reminders = reminders;
      deadlinesToCreate.push(newDeadline);
      allReminders.push(...reminders);
    }

    // Save all to database
    await addDeadlines(deadlinesToCreate);
    await addDocument(documentRecord);

    const db = getDB();
    if (db && allReminders.length > 0) {
      await db.reminders.bulkPut(allReminders);
    }

    await reloadData();
    return deadlinesToCreate.length;
  }, [reloadData]);

  // ---- Filtering & Sorting Logic ----
  const filteredAndSortedDeadlines = useMemo(() => {
    let result = [...rawDeadlines];

    // 1. Search Filter
    if (filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          d.description.toLowerCase().includes(searchLower) ||
          d.category.toLowerCase().includes(searchLower) ||
          d.sourceFile.toLowerCase().includes(searchLower),
      );
    }

    // 2. Priority Filter
    if (filters.priority !== 'all') {
      result = result.filter((d) => d.priority === filters.priority);
    }

    // 3. Status Filter
    if (filters.status !== 'all') {
      if (filters.status === 'overdue') {
        const now = new Date().toISOString();
        result = result.filter(
          (d) => d.deadlineDate < now && d.status !== 'completed',
        );
      } else {
        result = result.filter((d) => d.status === filters.status);
      }
    }

    // 4. Category Filter
    if (filters.category !== 'all') {
      result = result.filter((d) => d.category.toLowerCase() === filters.category.toLowerCase());
    }

    // 5. Sorting
    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    const statusWeight = { overdue: 4, pending: 3, snoozed: 2, completed: 1 };

    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
      }
      if (sortBy === 'priority') {
        const wA = priorityWeight[a.priority] || 0;
        const wB = priorityWeight[b.priority] || 0;
        if (wA !== wB) return wB - wA; // High priority first
        return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
      }
      if (sortBy === 'status') {
        const nowStr = new Date().toISOString();
        const statA = a.status === 'completed' ? 'completed' : a.deadlineDate < nowStr ? 'overdue' : a.status;
        const statB = b.status === 'completed' ? 'completed' : b.deadlineDate < nowStr ? 'overdue' : b.status;
        const wA = statusWeight[statA as keyof typeof statusWeight] || 0;
        const wB = statusWeight[statB as keyof typeof statusWeight] || 0;
        if (wA !== wB) return wB - wA; // Overdue first, then pending
        return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
      }
      return 0;
    });

    return result;
  }, [rawDeadlines, filters, sortBy]);

  // Extract all unique categories for filter options
  const categories = useMemo(() => {
    const cats = new Set<string>();
    rawDeadlines.forEach((d) => {
      if (d.category) cats.add(d.category.trim());
    });
    return Array.from(cats);
  }, [rawDeadlines]);

  return {
    deadlines: filteredAndSortedDeadlines,
    rawDeadlines,
    loading,
    error,
    stats,
    categories,
    filters,
    sortBy,
    updateFilters,
    updateSort,
    createManualDeadline,
    toggleComplete,
    snooze,
    deleteItem,
    importAnalysisResults,
    refresh: reloadData,
  };
}
