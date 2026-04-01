document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startDateInput = document.getElementById('startDate');
    const cycleDaysInput = document.getElementById('cycleDays');
    const referenceDateInput = document.getElementById('referenceDate');
    const lookupMultipleInput = document.getElementById('lookupMultiple');

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

    // Set default reference date to today
    const today = new Date();
    referenceDateInput.value = today.toISOString().split('T')[0];

    // Helper: Format Date to YYYY-MM-DD
    function formatDate(date) {
        if (!date || isNaN(date.getTime())) return "---";
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Main Update Function
    function updateDashboard() {
        const startDate = new Date(startDateInput.value);
        const refDate = new Date(referenceDateInput.value);
        const cycleDays = parseInt(cycleDaysInput.value) || 390;

        if (isNaN(startDate.getTime()) || isNaN(refDate.getTime())) return;

        // 1. Calculate Current Day Count (Inclusive)
        // Set both dates to midnight for accurate day calculation
        const startMid = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const refMid = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
        
        const diffTime = refMid.getTime() - startMid.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const currentDays = diffDays + 1;

        currentDayCountEl.textContent = currentDays.toLocaleString();

        // 2. Progress Logic
        const currentCycleMod = (currentDays - 1) % cycleDays;
        const progressPercent = Math.min(100, Math.max(0, ((currentCycleMod + 1) / cycleDays) * 100));
        progressBarEl.style.width = `${progressPercent}%`;
        progressTextEl.textContent = `${progressPercent.toFixed(1)}% 완료`;

        // 3. Milestones Logic
        const nextMultiple = Math.floor((currentDays + cycleDays - 1) / cycleDays);
        // If currentDays is exactly a multiple, maybe show next one? 
        // Let's say if we hit 390 today, "Next" is 780.
        let targetMultiple1 = nextMultiple;
        if (currentDays >= nextMultiple * cycleDays) {
            targetMultiple1 = nextMultiple + 1;
        }

        const targetMultiple2 = targetMultiple1 + 1;

        updateMilestone(targetMultiple1, cycleDays, startDate, refMid, nextM_Title, nextM_Date, nextM_Remaining, nextM_Badge);
        updateMilestone(targetMultiple2, cycleDays, startDate, refMid, futureM_Title, futureM_Date, futureM_Remaining);

        // Update Lookup if value exists
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
        const startDate = new Date(startDateInput.value);
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

    // Event Listeners
    [startDateInput, cycleDaysInput, referenceDateInput].forEach(el => {
        el.addEventListener('change', updateDashboard);
    });

    lookupMultipleInput.addEventListener('input', updateLookup);

    // Initial Run
    updateDashboard();
});
