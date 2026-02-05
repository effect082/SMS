// ==========================================
// Data Manager - CSV Upload/Download & Data Management
// ==========================================

const DataManager = {
    // Get all supporters from localStorage
    getSupporters() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.SUPPORTERS);
        return data ? JSON.parse(data) : [];
    },

    // Save supporters to localStorage
    saveSupporters(supporters) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.SUPPORTERS, JSON.stringify(supporters));
    },

    // Clear all supporter data
    clearSupporters() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.SUPPORTERS);
    },

    // Download CSV template
    downloadTemplate() {
        const csvContent = '\uFEFF이름,전화번호,생년월일\n홍길동,01012345678,1990-01-15\n김영희,01087654321,1985-03-22';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', '후원자_템플릿.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // Parse CSV file
    async parseCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    let content = e.target.result;

                    // Remove BOM if present
                    if (content.charCodeAt(0) === 0xFEFF) {
                        content = content.substring(1);
                    }

                    const lines = content.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);

                    if (lines.length < 2) {
                        reject(new Error('CSV 파일이 비어있거나 형식이 올바르지 않습니다.'));
                        return;
                    }

                    // Skip header
                    const dataLines = lines.slice(1);
                    const supporters = [];

                    for (let i = 0; i < dataLines.length; i++) {
                        const line = dataLines[i];
                        const parts = line.split(',').map(p => p.trim());

                        if (parts.length !== 3) {
                            console.warn(`라인 ${i + 2}: 잘못된 형식 - ${line}`);
                            continue;
                        }

                        const [name, phone, birthday] = parts;

                        // Validation
                        if (!name || !phone || !birthday) {
                            console.warn(`라인 ${i + 2}: 필수 값 누락`);
                            continue;
                        }

                        // Validate phone number
                        const cleanPhone = phone.replace(/[^0-9]/g, '');
                        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
                            console.warn(`라인 ${i + 2}: 유효하지 않은 전화번호 - ${phone}`);
                            continue;
                        }

                        // Validate birthday format (YYYY-MM-DD)
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
                            console.warn(`라인 ${i + 2}: 유효하지 않은 생년월일 (YYYY-MM-DD 형식 필요) - ${birthday}`);
                            continue;
                        }

                        supporters.push({
                            id: Date.now() + i,
                            name,
                            phone: cleanPhone,
                            birthday
                        });
                    }

                    resolve(supporters);
                } catch (error) {
                    reject(new Error('CSV 파일 파싱 중 오류가 발생했습니다: ' + error.message));
                }
            };

            reader.onerror = () => {
                reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
            };

            // Try UTF-8 first
            reader.readAsText(file, 'UTF-8');
        });
    },

    // Validate duplicates
    validateDuplicates(newSupporters, existingSupporters = []) {
        const duplicates = [];
        const allSupporters = [...existingSupporters];
        const uniqueNew = [];

        for (const newSupporter of newSupporters) {
            const isDuplicate = allSupporters.some(existing =>
                existing.name === newSupporter.name &&
                existing.phone === newSupporter.phone
            );

            if (isDuplicate) {
                duplicates.push(newSupporter);
            } else {
                uniqueNew.push(newSupporter);
                allSupporters.push(newSupporter);
            }
        }

        return {
            unique: uniqueNew,
            duplicates
        };
    },

    // Upload and merge CSV data
    async uploadCSV(file) {
        const newSupporters = await this.parseCSV(file);
        const existingSupporters = this.getSupporters();

        const validation = this.validateDuplicates(newSupporters, existingSupporters);

        if (validation.duplicates.length > 0) {
            console.warn(`${validation.duplicates.length}명의 중복 데이터가 발견되어 제외되었습니다.`);
        }

        const mergedSupporters = [...existingSupporters, ...validation.unique];
        this.saveSupporters(mergedSupporters);

        return {
            total: newSupporters.length,
            added: validation.unique.length,
            duplicates: validation.duplicates.length,
            supporters: mergedSupporters
        };
    },

    // Calculate age
    calculateAge(birthday) {
        const today = new Date();
        const birthDate = new Date(birthday);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    },

    // Search supporters
    searchSupporters(query) {
        const allSupporters = this.getSupporters();
        const lowerQuery = query.toLowerCase().trim();

        if (!lowerQuery) {
            return allSupporters;
        }

        return allSupporters.filter(supporter =>
            supporter.name.toLowerCase().includes(lowerQuery) ||
            supporter.phone.includes(lowerQuery) ||
            supporter.birthday.includes(lowerQuery)
        );
    },

    // Delete supporter
    deleteSupporter(id) {
        const supporters = this.getSupporters();
        const filtered = supporters.filter(s => s.id !== id);
        this.saveSupporters(filtered);
        return filtered;
    },

    // Export history to CSV
    exportHistoryToCSV(history) {
        if (!history || history.length === 0) {
            throw new Error('내보낼 이력이 없습니다.');
        }

        const headers = '날짜,시간,이름,전화번호,메시지,상태\n';
        const rows = history.map(item => {
            const status = item.status === 'success' ? '성공' : '실패';
            const message = item.message.replace(/,/g, '，'); // Replace commas
            return `${item.date},${item.time},${item.recipient},${item.phone},"${message}",${status}`;
        }).join('\n');

        const csvContent = '\uFEFF' + headers + rows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const filename = `발송이력_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
