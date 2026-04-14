document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Inputs
    const startDateIds = ['startDate_Y', 'startDate_M', 'startDate_D'];
    const refDateIds = ['referenceDate_Y', 'referenceDate_M', 'referenceDate_D'];
    
    const cycleDaysInput = document.getElementById('cycleDays');
    const lookupMultipleInput = document.getElementById('lookupMultiple');

    // DOM Elements - Display
    const currentDayCountEl = document.getElementById('currentDayCount');
    const progressBarEl = document.getElementById('progressBar');
    const progressTextEl = document.getElementById('progressText');

    const lookupTargetDaysEl = document.getElementById('lookupTargetDays');
    const lookupTargetDateEl = document.getElementById('lookupTargetDate');

    const nextM_Title = document.getElementById('nextM_Title');
    const nextM_Date = document.getElementById('nextM_Date');
    const nextM_Remaining = document.getElementById('nextM_Remaining');
    const nextM_Badge = document.getElementById('nextM_Badge');

    const futureM_Title = document.getElementById('futureM_Title');
    const futureM_Date = document.getElementById('futureM_Date');
    const futureM_Remaining = document.getElementById('futureM_Remaining');

    // Helper: Get Date Object from Split Inputs
    function getDateFromSplit(prefix) {
        const y = document.getElementById(`${prefix}_Y`).value;
        const m = document.getElementById(`${prefix}_M`).value;
        const d = document.getElementById(`${prefix}_D`).value;
        
        if (!y || !m || !d) return new Date(NaN);
        
        const year = parseInt(y);
        const month = parseInt(m) - 1; // 0-indexed
        const day = parseInt(d);
        
        const date = new Date(year, month, day);
        // Validation: Check if date is logically valid (e.g., avoid Feb 31)
        if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
            return new Date(NaN);
        }
        return date;
    }

    // Helper: Set Split Inputs from Date Object
    function setSplitFromDate(prefix, date) {
        document.getElementById(`${prefix}_Y`).value = date.getFullYear();
        document.getElementById(`${prefix}_M`).value = String(date.getMonth() + 1).padStart(2, '0');
        document.getElementById(`${prefix}_D`).value = String(date.getDate()).padStart(2, '0');
    }

    // Helper: Format Date to YYYY-MM-DD
    function formatDate(date) {
        if (!date || isNaN(date.getTime())) return "---";
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Auto-Jump & Update Logic
    function setupDateGroup(prefix) {
        const y = document.getElementById(`${prefix}_Y`);
        const m = document.getElementById(`${prefix}_M`);
        const d = document.getElementById(`${prefix}_D`);

        y.addEventListener('input', (e) => {
            if (y.value.length >= 4) m.focus();
            updateDashboard();
        });

        m.addEventListener('input', (e) => {
            // Jump if 2 digits OR if first digit is > 1 (e.g., 2-9 for month)
            if (m.value.length >= 2 || (m.value.length === 1 && parseInt(m.value) > 1)) {
                d.focus();
            }
            updateDashboard();
        });

        d.addEventListener('input', () => {
            updateDashboard();
        });

        // Handle backspace to go back to previous field
        [m, d].forEach((el, idx) => {
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && el.value.length === 0) {
                    const prev = idx === 0 ? y : m;
                    prev.focus();
                }
            });
        });

        // Auto-select text on focus and click (allows immediate overwrite)
        [y, m, d].forEach(el => {
            el.addEventListener('focus', () => {
                setTimeout(() => el.select(), 0);
            });
            el.addEventListener('click', () => {
                el.select();
            });
        });
    }

    // Initialize default reference date to today
    setSplitFromDate('referenceDate', new Date());

    // Setup input behaviors
    setupDateGroup('startDate');
    setupDateGroup('referenceDate');

    // Main Update Function
    function updateDashboard() {
        const startDate = getDateFromSplit('startDate');
        const refDate = getDateFromSplit('referenceDate');
        const cycleDays = parseInt(cycleDaysInput.value) || 390;

        if (isNaN(startDate.getTime()) || isNaN(refDate.getTime())) {
            currentDayCountEl.textContent = "0";
            progressBarEl.style.width = `0%`;
            progressTextEl.textContent = `입력 대기 중...`;
            return;
        }

        const startMid = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const refMid = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
        
        const diffTime = refMid.getTime() - startMid.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const currentDays = diffDays + 1;

        currentDayCountEl.textContent = currentDays.toLocaleString();

        const currentCycleMod = (currentDays - 1) % cycleDays;
        const progressPercent = Math.min(100, Math.max(0, ((currentCycleMod + 1) / cycleDays) * 100));
        progressBarEl.style.width = `${progressPercent}%`;
        progressTextEl.textContent = `${progressPercent.toFixed(1)}% 완료`;

        const nextMultiple = Math.floor((currentDays + cycleDays - 1) / cycleDays);
        let targetMultiple1 = nextMultiple;
        if (currentDays >= nextMultiple * cycleDays) {
            targetMultiple1 = nextMultiple + 1;
        }

        const targetMultiple2 = targetMultiple1 + 1;

        updateMilestone(targetMultiple1, cycleDays, startDate, refMid, nextM_Title, nextM_Date, nextM_Remaining, nextM_Badge);
        updateMilestone(targetMultiple2, cycleDays, startDate, refMid, futureM_Title, futureM_Date, futureM_Remaining);

        updateLookup();
    }

    function updateMilestone(multiple, cycle, start, ref, titleEl, dateEl, remainEl, badgeEl) {
        const targetDays = multiple * cycle;
        const targetDate = new Date(start.getTime() + (targetDays - 1) * (1000 * 60 * 60 * 24));
        
        titleEl.textContent = `${multiple}배수`;
        dateEl.textContent = formatDate(targetDate);
        
        const diff = targetDays - Math.floor((ref.getTime() - new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) / 86400000 + 1);
        
        if (diff > 0) {
            remainEl.textContent = `${diff.toLocaleString()}일 남음`;
            if (badgeEl) badgeEl.textContent = "다음 배수";
        } else if (diff === 0) {
            remainEl.textContent = "🥳 오늘 달성!";
            if (badgeEl) badgeEl.textContent = "달성 완료";
        } else {
            remainEl.textContent = `${Math.abs(diff).toLocaleString()}일 경과`;
            if (badgeEl) badgeEl.textContent = "과거 마일스톤";
        }
    }

    function updateLookup() {
        const multiple = parseFloat(lookupMultipleInput.value);
        const startDate = getDateFromSplit('startDate');
        const cycleDays = parseInt(cycleDaysInput.value) || 390;

        if (isNaN(multiple) || isNaN(startDate.getTime())) {
            lookupTargetDaysEl.textContent = "---";
            lookupTargetDateEl.textContent = "---";
            return;
        }

        const targetDays = multiple * cycleDays;
        const targetDate = new Date(startDate.getTime() + (targetDays - 1) * (1000 * 60 * 60 * 24));

        lookupTargetDaysEl.textContent = `${targetDays.toLocaleString()} 일차`;
        lookupTargetDateEl.textContent = formatDate(targetDate);
    }

    // Event Listeners for other inputs
    cycleDaysInput.addEventListener('input', updateDashboard);
    lookupMultipleInput.addEventListener('input', updateLookup);

    // Initial Run
    updateDashboard();
});

