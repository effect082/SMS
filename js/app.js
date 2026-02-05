// ==========================================
// Main Application - UI Interactions & Event Handlers
// ==========================================

// DOM Elements
let currentPage = 'dashboard';
let currentFilter = 'all';

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadDashboard();
});

// ==========================================
// Initialization
// ==========================================
function initializeApp() {
    // Load settings into settings page
    const apiKeyInput = document.getElementById('api-key');
    const apiSecretInput = document.getElementById('api-secret');
    const senderPhoneInput = document.getElementById('sender-phone');
    const defaultTemplateInput = document.getElementById('default-template');
    const messageTemplateInput = document.getElementById('message-template');

    apiKeyInput.value = CONFIG.SOLAPI.API_KEY || '';
    apiSecretInput.value = CONFIG.SOLAPI.API_SECRET || '';
    senderPhoneInput.value = CONFIG.SOLAPI.SENDER_PHONE || '';
    defaultTemplateInput.value = CONFIG.DEFAULT_MESSAGE_TEMPLATE;
    messageTemplateInput.value = CONFIG.DEFAULT_MESSAGE_TEMPLATE;
}

// ==========================================
// Event Listeners Setup
// ==========================================
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.currentTarget.dataset.page;
            navigateToPage(page);
        });
    });

    // Supporters Management
    document.getElementById('download-template-btn').addEventListener('click', () => {
        DataManager.downloadTemplate();
        showToast('CSV 템플릿이 다운로드되었습니다.', 'success');
    });

    document.getElementById('clear-data-btn').addEventListener('click', clearAllData);

    // Upload area
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('csv-file-input');

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        const query = e.target.value;
        displaySupporters(DataManager.searchSupporters(query));
    });

    // SMS Sending
    document.getElementById('message-template').addEventListener('input', updateMessagePreview);
    document.getElementById('send-sms-btn').addEventListener('click', sendBulkSMS);

    // History filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.currentTarget.dataset.filter;
            setHistoryFilter(filter);
        });
    });

    document.getElementById('export-history-btn').addEventListener('click', exportHistory);

    // Settings
    document.getElementById('save-settings-btn').addEventListener('click', saveSettingsHandler);
    document.getElementById('save-template-btn').addEventListener('click', saveTemplateHandler);
}

// ==========================================
// Navigation
// ==========================================
function navigateToPage(pageName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === pageName) {
            btn.classList.add('active');
        }
    });

    // Update pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageName}-page`).classList.add('active');

    currentPage = pageName;

    // Load page-specific data
    switch (pageName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'supporters':
            loadSupporters();
            break;
        case 'send':
            loadSendPage();
            break;
        case 'history':
            loadHistory();
            break;
        case 'settings':
            break;
    }
}

// ==========================================
// Dashboard
// ==========================================
function loadDashboard() {
    const supporters = DataManager.getSupporters();
    const todayBirthdays = BirthdayMatcher.getTodayBirthdays(supporters);
    const monthBirthdays = BirthdayMatcher.getThisMonthBirthdays(supporters);
    const history = HistoryManager.getHistory();

    // Update stats
    document.getElementById('total-supporters').textContent = supporters.length;
    document.getElementById('today-birthdays').textContent = todayBirthdays.length;
    document.getElementById('month-birthdays').textContent = monthBirthdays.length;
    document.getElementById('total-sent').textContent = history.length;

    // Display recent history
    const recentHistory = HistoryManager.getRecentHistory(5);
    const recentHistoryContainer = document.getElementById('recent-history');

    if (recentHistory.length === 0) {
        recentHistoryContainer.innerHTML = '<p class="empty-message">발송 이력이 없습니다.</p>';
    } else {
        recentHistoryContainer.innerHTML = recentHistory.map(record => `
            <div class="history-item ${record.status === 'failed' ? 'failed' : ''}">
                <div class="history-info">
                    <div class="history-name">${record.recipient}</div>
                    <div class="history-details">${record.date} ${record.time} • ${SMSService.formatPhone(record.phone)}</div>
                </div>
                <span class="history-status ${record.status}">${record.status === 'success' ? '성공' : '실패'}</span>
            </div>
        `).join('');
    }
}

// ==========================================
// Supporters Management
// ==========================================
function loadSupporters() {
    const supporters = DataManager.getSupporters();
    displaySupporters(supporters);
}

function displaySupporters(supporters) {
    const tbody = document.getElementById('supporters-table-body');
    const countEl = document.getElementById('supporter-count');

    countEl.textContent = `총 ${supporters.length}명`;

    if (supporters.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">데이터가 없습니다. CSV 파일을 업로드해주세요.</td></tr>';
        return;
    }

    tbody.innerHTML = supporters.map((supporter, index) => {
        const age = DataManager.calculateAge(supporter.birthday);
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${supporter.name}</td>
                <td>${SMSService.formatPhone(supporter.phone)}</td>
                <td>${supporter.birthday}</td>
                <td>${age}세</td>
                <td>
                    <button class="btn btn-danger" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="deleteSupporter(${supporter.id})">
                        삭제
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function deleteSupporter(id) {
    if (confirm('이 후원자를 삭제하시겠습니까?')) {
        const updated = DataManager.deleteSupporter(id);
        displaySupporters(updated);
        showToast('후원자가 삭제되었습니다.', 'success');
    }
}

function clearAllData() {
    if (confirm('모든 후원자 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        DataManager.clearSupporters();
        loadSupporters();
        showToast('모든 데이터가 삭제되었습니다.', 'success');
    }
}

// File upload handlers
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

async function handleFile(file) {
    if (!file.name.endsWith('.csv')) {
        showToast('CSV 파일만 업로드 가능합니다.', 'error');
        return;
    }

    showLoading('CSV 파일을 처리하는 중...');

    try {
        const result = await DataManager.uploadCSV(file);
        hideLoading();

        let message = `${result.added}명의 후원자가 추가되었습니다.`;
        if (result.duplicates > 0) {
            message += ` (${result.duplicates}명 중복 제외)`;
        }

        showToast(message, 'success');
        loadSupporters();
        loadDashboard();
    } catch (error) {
        hideLoading();
        showToast('오류: ' + error.message, 'error');
    }
}

// ==========================================
// SMS Sending
// ==========================================
function loadSendPage() {
    const supporters = DataManager.getSupporters();
    const todayBirthdays = BirthdayMatcher.getTodayBirthdays(supporters);

    const countEl = document.getElementById('today-count');
    const recipientsEl = document.getElementById('today-recipients');
    const sendBtn = document.getElementById('send-sms-btn');

    countEl.textContent = todayBirthdays.length;

    if (todayBirthdays.length === 0) {
        recipientsEl.innerHTML = '<p class="empty-message">오늘 생일인 후원자가 없습니다.</p>';
        sendBtn.disabled = true;
        updateMessagePreview(null);
    } else {
        // Render selectable list
        recipientsEl.innerHTML = todayBirthdays.map((supporter, index) => `
            <div class="recipient-item ${index === 0 ? 'active' : ''}" id="recipient-${supporter.id}">
                <input type="checkbox" class="recipient-checkbox" id="check-${supporter.id}" value="${supporter.id}" checked>
                <div class="recipient-info" onclick="selectRecipientPreview(${supporter.id})">
                    ${supporter.name} <span class="recipient-phone">(${SMSService.formatPhone(supporter.phone)})</span>
                </div>
            </div>
        `).join('');

        sendBtn.disabled = false;

        // Preview the first one by default
        updateMessagePreview(todayBirthdays[0]);
    }
}

// Global variable to track currently previewed supporter
let currentPreviewId = null;

function selectRecipientPreview(id) {
    const supporters = DataManager.getSupporters();
    const target = supporters.find(s => s.id === id);

    if (target) {
        // Update UI active state
        document.querySelectorAll('.recipient-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.getElementById(`recipient-${id}`);
        if (activeItem) activeItem.classList.add('active');

        currentPreviewId = id;
        updateMessagePreview(target);
    }
}

function updateMessagePreview(specificRecipient = null) {
    const template = document.getElementById('message-template').value;
    const previewEl = document.getElementById('message-preview');

    // If no specific recipient passed (e.g. on input change), try to find current one or fallback
    let target = specificRecipient;
    if (!target) {
        const supporters = DataManager.getSupporters();
        if (currentPreviewId) {
            target = supporters.find(s => s.id === currentPreviewId);
        } else {
            const todayBirthdays = BirthdayMatcher.getTodayBirthdays(supporters);
            if (todayBirthdays.length > 0) target = todayBirthdays[0];
        }
    }

    if (!target) {
        previewEl.textContent = '대상자를 선택하면 미리보기가 표시됩니다.';
        return;
    }

    const personalizedMessage = SMSService.personalizeMessage(template, target.name);

    previewEl.textContent = personalizedMessage + '\n\n' +
        `(${target.name}님에게 발송될 메시지)`;
}

async function sendBulkSMS() {
    const template = document.getElementById('message-template').value.trim();

    if (!template) {
        showToast('메시지를 입력해주세요.', 'error');
        return;
    }

    if (!CONFIG.SOLAPI.SENDER_PHONE) {
        showToast('발신번호가 설정되지 않았습니다. 설정 페이지에서 입력해주세요.', 'error');
        navigateToPage('settings');
        return;
    }

    // Get checked recipients
    const checkboxes = document.querySelectorAll('.recipient-checkbox:checked');
    const checkedIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (checkedIds.length === 0) {
        showToast('발송할 대상자를 선택해주세요.', 'warning');
        return;
    }

    const supporters = DataManager.getSupporters();
    const targetSupporters = supporters.filter(s => checkedIds.includes(s.id));

    const confirmMsg = `선택한 ${targetSupporters.length}명에게 SMS를 발송하시겠습니까?`;
    if (!confirm(confirmMsg)) {
        return;
    }

    showLoading('SMS 발송 중...');

    try {
        const results = await SMSService.sendBulkSMS(targetSupporters, template, (progress) => {
            const loadingText = document.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = `SMS 발송 중... (${progress.current}/${progress.total})`;
            }
        });

        // Save to history
        HistoryManager.addBulkRecords(results);

        hideLoading();

        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        let message = `발송 완료: 성공 ${successCount}건`;
        if (failedCount > 0) {
            message += `, 실패 ${failedCount}건`;
        }

        showToast(message, successCount > 0 ? 'success' : 'error');
        loadDashboard();

        // Refresh the send page list to reset states if needed, or keep it
        // navigateToPage('history'); // Optional: redirect to history?

    } catch (error) {
        hideLoading();
        showToast('오류: ' + error.message, 'error');
    }
}

// Make selectRecipientPreview available globally
window.selectRecipientPreview = selectRecipientPreview;

// ==========================================
// History
// ==========================================
function loadHistory(filter = currentFilter) {
    const history = HistoryManager.getFilteredHistory(filter);
    const stats = HistoryManager.getStatistics(filter);

    // Update statistics
    document.getElementById('history-total').textContent = `${stats.total}건`;
    document.getElementById('history-success').textContent = `${stats.success}건`;
    document.getElementById('history-failed').textContent = `${stats.failed}건`;

    // Display history table
    const tbody = document.getElementById('history-table-body');

    if (history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">발송 이력이 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = history.map(record => `
        <tr>
            <td>${record.date}</td>
            <td>${record.time}</td>
            <td>${record.recipient}</td>
            <td>${SMSService.formatPhone(record.phone)}</td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${record.message}</td>
            <td>
                <span class="history-status ${record.status}">
                    ${record.status === 'success' ? '성공' : '실패'}
                </span>
            </td>
        </tr>
    `).join('');
}

function setHistoryFilter(filter) {
    currentFilter = filter;

    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    loadHistory(filter);
}

function exportHistory() {
    try {
        const history = HistoryManager.getFilteredHistory(currentFilter);

        if (history.length === 0) {
            showToast('내보낼 이력이 없습니다.', 'warning');
            return;
        }

        DataManager.exportHistoryToCSV(history);
        showToast('발송 이력이 CSV로 내보내졌습니다.', 'success');
    } catch (error) {
        showToast('오류: ' + error.message, 'error');
    }
}

// ==========================================
// Settings
// ==========================================
function saveSettingsHandler() {
    const apiKey = document.getElementById('api-key').value.trim();
    const apiSecret = document.getElementById('api-secret').value.trim();
    const senderPhone = document.getElementById('sender-phone').value.trim().replace(/[^0-9]/g, '');

    if (!apiKey || !apiSecret) {
        showToast('API Key와 Secret을 모두 입력해주세요.', 'error');
        return;
    }

    if (!senderPhone) {
        showToast('발신번호를 입력해주세요.', 'error');
        return;
    }

    if (!SMSService.validatePhone(senderPhone)) {
        showToast('유효하지 않은 전화번호입니다.', 'error');
        return;
    }

    saveSettings(apiKey, apiSecret, senderPhone);
    showToast('설정이 저장되었습니다.', 'success');
}

function saveTemplateHandler() {
    const template = document.getElementById('default-template').value.trim();

    if (!template) {
        showToast('템플릿을 입력해주세요.', 'error');
        return;
    }

    saveMessageTemplate(template);
    document.getElementById('message-template').value = template;
    showToast('템플릿이 저장되었습니다.', 'success');
}

// ==========================================
// UI Helpers
// ==========================================
function showLoading(message = '처리 중...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = overlay.querySelector('.loading-text');
    loadingText.textContent = message;
    overlay.classList.remove('hidden');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('hidden');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.success}</div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

// Make deleteSupporter available globally
window.deleteSupporter = deleteSupporter;
