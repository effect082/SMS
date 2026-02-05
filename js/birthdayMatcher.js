// ==========================================
// Birthday Matcher - Date comparison and filtering
// ==========================================

const BirthdayMatcher = {
    // Get today's date in YYYY-MM-DD format
    getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Get month-day from date string (MM-DD)
    getMonthDay(dateString) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return `${parts[1]}-${parts[2]}`;
        }
        return '';
    },

    // Get current month in MM format
    getCurrentMonth() {
        const today = new Date();
        return String(today.getMonth() + 1).padStart(2, '0');
    },

    // Check if birthday is today
    isBirthdayToday(birthday) {
        const todayMonthDay = this.getMonthDay(this.getTodayDate());
        const birthdayMonthDay = this.getMonthDay(birthday);
        return todayMonthDay === birthdayMonthDay;
    },

    // Check if birthday is in current month
    isBirthdayThisMonth(birthday) {
        const currentMonth = this.getCurrentMonth();
        const birthdayMonth = birthday.split('-')[1];
        return currentMonth === birthdayMonth;
    },

    // Get today's birthday supporters
    getTodayBirthdays(supporters = null) {
        const allSupporters = supporters || DataManager.getSupporters();
        return allSupporters.filter(supporter =>
            this.isBirthdayToday(supporter.birthday)
        );
    },

    // Get this month's birthday supporters
    getThisMonthBirthdays(supporters = null) {
        const allSupporters = supporters || DataManager.getSupporters();
        return allSupporters.filter(supporter =>
            this.isBirthdayThisMonth(supporter.birthday)
        );
    },

    // Get birthdays by specific date (for testing)
    getBirthdaysByDate(supporters, targetDate) {
        const targetMonthDay = this.getMonthDay(targetDate);
        return supporters.filter(supporter => {
            const birthdayMonthDay = this.getMonthDay(supporter.birthday);
            return targetMonthDay === birthdayMonthDay;
        });
    },

    // Get upcoming birthdays (next N days)
    getUpcomingBirthdays(supporters, days = 7) {
        const today = new Date();
        const upcoming = [];

        for (const supporter of supporters) {
            const [year, month, day] = supporter.birthday.split('-');
            const thisYearBirthday = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));

            // If birthday already passed this year, check next year
            if (thisYearBirthday < today) {
                thisYearBirthday.setFullYear(today.getFullYear() + 1);
            }

            const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));

            if (daysUntil >= 0 && daysUntil <= days) {
                upcoming.push({
                    ...supporter,
                    daysUntil
                });
            }
        }

        return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
    },

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}년 ${month}월 ${day}일`;
    },

    // Get age on next birthday
    getAgeOnNextBirthday(birthday) {
        const today = new Date();
        const birthDate = new Date(birthday);
        const nextBirthdayYear = today.getFullYear();
        const age = nextBirthdayYear - birthDate.getFullYear();
        return age;
    }
};
