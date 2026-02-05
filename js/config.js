// ==========================================
// Configuration File
// ==========================================

const CONFIG = {
    // Solapi API Configuration
    SOLAPI: {
        API_KEY: 'NCSPEYYLIEV2MF1Y',
        API_SECRET: 'ZWYVWP4YLVAABIK3GML6WIZYTXCHOOPG',
        SENDER_PHONE: '', // Will be set in settings
        API_ENDPOINT: 'https://api.solapi.com/messages/v4/send'
    },
    
    // Default message template
    DEFAULT_MESSAGE_TEMPLATE: '{name}님, 생일을 진심으로 축하드립니다! 항상 건강하시고 행복한 일만 가득하시길 바랍니다. - 복지관 드림',
    
    // App information
    APP_NAME: '복지관 생일 SMS 시스템',
    APP_VERSION: '1.0.0',
    
    // LocalStorage keys
    STORAGE_KEYS: {
        SUPPORTERS: 'sms_supporters',
        SETTINGS: 'sms_settings',
        HISTORY: 'sms_history',
        MESSAGE_TEMPLATE: 'sms_message_template'
    }
};

// Initialize settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        CONFIG.SOLAPI.API_KEY = settings.apiKey || CONFIG.SOLAPI.API_KEY;
        CONFIG.SOLAPI.API_SECRET = settings.apiSecret || CONFIG.SOLAPI.API_SECRET;
        CONFIG.SOLAPI.SENDER_PHONE = settings.senderPhone || '';
    }
    
    const savedTemplate = localStorage.getItem(CONFIG.STORAGE_KEYS.MESSAGE_TEMPLATE);
    if (savedTemplate) {
        CONFIG.DEFAULT_MESSAGE_TEMPLATE = savedTemplate;
    }
}

// Save settings to localStorage
function saveSettings(apiKey, apiSecret, senderPhone) {
    const settings = {
        apiKey,
        apiSecret,
        senderPhone
    };
    localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    CONFIG.SOLAPI.API_KEY = apiKey;
    CONFIG.SOLAPI.API_SECRET = apiSecret;
    CONFIG.SOLAPI.SENDER_PHONE = senderPhone;
}

// Save message template
function saveMessageTemplate(template) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.MESSAGE_TEMPLATE, template);
    CONFIG.DEFAULT_MESSAGE_TEMPLATE = template;
}

// Load settings on page load
loadSettings();
