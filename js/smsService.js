// ==========================================
// SMS Service - Solapi API Integration
// ==========================================

const SMSService = {
    // Generate authentication signature for Solapi
    async generateAuth() {
        const apiKey = CONFIG.SOLAPI.API_KEY;
        const apiSecret = CONFIG.SOLAPI.API_SECRET;

        if (!apiKey || !apiSecret) {
            throw new Error('API Key와 Secret이 설정되지 않았습니다. 설정 페이지에서 입력해주세요.');
        }

        const timestamp = Date.now().toString();
        const salt = this.generateSalt();

        // Create signature: HMAC-SHA256(API_SECRET, timestamp + salt)
        const signature = await this.hmacSHA256(apiSecret, timestamp + salt);

        return {
            apiKey,
            timestamp,
            salt,
            signature
        };
    },

    // Generate random salt
    generateSalt() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let salt = '';
        for (let i = 0; i < 32; i++) {
            salt += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return salt;
    },

    // HMAC-SHA256 implementation using Web Crypto API
    async hmacSHA256(secret, message) {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(message);

        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', key, messageData);
        const hashArray = Array.from(new Uint8Array(signature));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return hashHex;
    },

    // Personalize message with name replacement
    personalizeMessage(template, name) {
        return template.replace(/{name}/g, name);
    },

    // Send single SMS
    async sendSMS(recipient, message) {
        const senderPhone = CONFIG.SOLAPI.SENDER_PHONE;

        if (!senderPhone) {
            throw new Error('발신번호가 설정되지 않았습니다. 설정 페이지에서 입력해주세요.');
        }

        try {
            const auth = await this.generateAuth();

            const requestBody = {
                message: {
                    to: recipient.phone,
                    from: senderPhone,
                    text: message
                }
            };

            const response = await fetch(CONFIG.SOLAPI.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `HMAC-SHA256 apiKey=${auth.apiKey}, date=${auth.timestamp}, salt=${auth.salt}, signature=${auth.signature}`
                },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.errorMessage || `API 오류: ${response.status}`);
            }

            return {
                success: true,
                recipient: recipient.name,
                phone: recipient.phone,
                message,
                messageId: result.messageId,
                statusCode: result.statusCode
            };

        } catch (error) {
            console.error('SMS 발송 오류:', error);
            return {
                success: false,
                recipient: recipient.name,
                phone: recipient.phone,
                message,
                error: error.message
            };
        }
    },

    // Send bulk SMS with delay between each message
    async sendBulkSMS(recipients, messageTemplate, onProgress = null) {
        const results = [];
        const total = recipients.length;

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            const personalizedMessage = this.personalizeMessage(messageTemplate, recipient.name);

            // Progress callback
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total,
                    recipient: recipient.name
                });
            }

            // Send SMS
            const result = await this.sendSMS(recipient, personalizedMessage);
            results.push(result);

            // Add delay between requests (0.5 seconds) to avoid rate limiting
            if (i < recipients.length - 1) {
                await this.delay(500);
            }
        }

        return results;
    },

    // Delay helper
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Validate phone number format
    validatePhone(phone) {
        const cleaned = phone.replace(/[^0-9]/g, '');
        return cleaned.length >= 10 && cleaned.length <= 11;
    },

    // Format phone number for display
    formatPhone(phone) {
        const cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        } else if (cleaned.length === 11) {
            return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        }
        return phone;
    },

    // Check SMS balance (if Solapi provides this endpoint)
    async checkBalance() {
        // Note: This is a placeholder. Solapi may have a different endpoint for checking balance
        try {
            const auth = await this.generateAuth();

            const response = await fetch('https://api.solapi.com/balance/v1/cash/balance', {
                method: 'GET',
                headers: {
                    'Authorization': `HMAC-SHA256 apiKey=${auth.apiKey}, date=${auth.timestamp}, salt=${auth.salt}, signature=${auth.signature}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                return result.balance || 0;
            }

            return null;
        } catch (error) {
            console.error('잔액 조회 오류:', error);
            return null;
        }
    }
};
