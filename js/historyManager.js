// ==========================================
// History Manager - Sending history management
// ==========================================

const HistoryManager = {
    // Get all history from localStorage
    getHistory() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY);
        return data ? JSON.parse(data) : [];
    },

    // Save history to localStorage
    saveHistory(history) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(history));
    },

    // Add history record
    addRecord(recipient, phone, message, status, errorMessage = null) {
        const history = this.getHistory();
        const now = new Date();

        const record = {
            id: Date.now() + Math.random(),
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().split(' ')[0],
            timestamp: now.getTime(),
            recipient,
            phone,
            message,
            status, // 'success' or 'failed'
            errorMessage
        };

        history.unshift(record); // Add to beginning
        this.saveHistory(history);

        return record;
    },

    // Add multiple records from SMS results
    addBulkRecords(results) {
        results.forEach(result => {
            this.addRecord(
                result.recipient,
                result.phone,
                result.message,
                result.success ? 'success' : 'failed',
                result.error || null
            );
        });
    },

    // Get records filtered by date range
    getFilteredHistory(filter = 'all') {
        const history = this.getHistory();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (filter) {
            case 'today': {
                return history.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate >= today;
                });
            }
            case 'week': {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return history.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate >= weekAgo;
                });
            }
            case 'month': {
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return history.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate >= monthAgo;
                });
            }
            default:
                return history;
        }
    },

    // Get statistics
    getStatistics(filter = 'all') {
        const history = this.getFilteredHistory(filter);

        const total = history.length;
        const success = history.filter(r => r.status === 'success').length;
        const failed = history.filter(r => r.status === 'failed').length;

        return {
            total,
            success,
            failed,
            successRate: total > 0 ? ((success / total) * 100).toFixed(1) : 0
        };
    },

    // Get recent history (for dashboard)
    getRecentHistory(limit = 5) {
        const history = this.getHistory();
        return history.slice(0, limit);
    },

    // Clear all history
    clearHistory() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.HISTORY);
    },

    // Delete specific record
    deleteRecord(id) {
        const history = this.getHistory();
        const filtered = history.filter(r => r.id !== id);
        this.saveHistory(filtered);
        return filtered;
    },

    // Group history by date
    groupByDate() {
        const history = this.getHistory();
        const grouped = {};

        history.forEach(record => {
            const date = record.date;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(record);
        });

        return grouped;
    },

    // Get history for specific date
    getHistoryByDate(date) {
        const history = this.getHistory();
        return history.filter(r => r.date === date);
    },

    // Get monthly summary
    getMonthlySummary() {
        const history = this.getHistory();
        const summary = {};

        history.forEach(record => {
            const yearMonth = record.date.substring(0, 7); // YYYY-MM
            if (!summary[yearMonth]) {
                summary[yearMonth] = {
                    total: 0,
                    success: 0,
                    failed: 0
                };
            }
            summary[yearMonth].total++;
            if (record.status === 'success') {
                summary[yearMonth].success++;
            } else {
                summary[yearMonth].failed++;
            }
        });

        return summary;
    },

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}년 ${month}월 ${day}일`;
    }
};
