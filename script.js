// --- CONFIGURATION ---
const ANCHOR_DATE = new Date('2025-12-09T00:00:00');

// Burmese Numerals Map
const BURMESE_NUMS = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];

// Translation Dictionary
const TRANSLATIONS = {
    en: {
        title: "Power Schedule",
        subtitle: "Generator Rotation",
        patternA_title: "Pattern A: Late Morning Outage",
        patternA_desc: "Outage: 9:00 AM - 1:00 PM",
        patternB_title: "Pattern B: Split Outage",
        patternB_desc: "Outage: 7:30 AM - 9:00 AM & 1:00 PM - 5:00 PM",
        grid_on: "Grid ON",
        power_off: "Grid OFF",
        gen_running: "Generator ON",
        gen_rest: "Gen Resting",
        elec_avail: "Electricity Available",
        next_day: "(Next Day)",
        elevatorLabel: "Elevator (Off-hours):",
        elevatorFee: "10,000 MMK fee",
        toggle_label: "🇺🇸 EN",
        btn_today: "Today",
        range_separator: " - ", 
        unit_hour: "", 
        periods: { morning: "AM", afternoon: "PM", evening: "PM", night: "PM" },
        months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    },
    mm: {
        title: "မီးပေးချိန် ဇယား",
        subtitle: "မီးစက် အလှည့်ကျစနစ်",
        patternA_title: "ပုံစံ A (မနက်ပိုင်း မီးပျက်)",
        patternA_desc: "မီးပျက်ချိန် - ၉ နာရီ မှ ၁ နာရီ",
        patternB_title: "ပုံစံ B (နှစ်ချိန်ခွဲ)",
        patternB_desc: "မီးပျက်ချိန် - မနက် ၇:၃၀-၉ ၊ နေ့လည် ၁-၅",
        grid_on: "မီးလာ",
        power_off: "မီးပျက်",
        gen_running: "မီးစက်မောင်း",
        gen_rest: "မီးစက်နား",
        elec_avail: "မီးလာ (EPC)",
        next_day: "(နောက်ရက်)",
        elevatorLabel: "ဓာတ်လှေကား (အချိန်ပြင်ပ):",
        elevatorFee: "၁၀,၀၀၀ ကျပ်",
        toggle_label: "🇲🇲 MM",
        btn_today: "ဒီနေ့",
        range_separator: " မှ ", 
        unit_hour: " နာရီ",
        periods: { morning: "မနက်", afternoon: "နေ့လည်", evening: "ညနေ", night: "ည" },
        months: ["ဇန်နဝါရီ", "ဖေဖော်ဝါရီ", "မတ်", "ဧပြီ", "မေ", "ဇွန်", "ဇူလိုင်", "သြဂုတ်", "စက်တင်ဘာ", "အောက်တိုဘာ", "နိုဝင်ဘာ", "ဒီဇင်ဘာ"]
    }
};

const GEN_RULES = {
    '07:30-09:00': [
        { start: '07:30', end: '09:00', status: 'Running' }
    ],
    '09:00-13:00': [
        { start: '09:00', end: '11:00', status: 'Running' },
        { start: '11:00', end: '12:00', status: 'Rest' },
        { start: '12:00', end: '13:00', status: 'Running' }
    ],
    '13:00-17:00': [
        { start: '14:00', end: '15:00', status: 'Running' },
        { start: '15:00', end: '16:00', status: 'Rest' },
        { start: '16:00', end: '17:00', status: 'Running' }
    ]
};

// --- DOM ELEMENTS ---
const datePicker = document.getElementById('date-picker');
const prevBtn = document.getElementById('prev-day');
const nextBtn = document.getElementById('next-day');
const todayBtn = document.getElementById('today-btn');
const summaryContainer = document.getElementById('daily-summary');
const scheduleContainer = document.getElementById('schedule-container');
const langToggle = document.getElementById('lang-toggle');
const displayDateText = document.getElementById('display-date-text');
const displayPatternName = document.getElementById('display-pattern-name');

// --- STATE MANAGEMENT ---
let currentLang = localStorage.getItem('powerSched_lang') || 'en';
let currentDate = new Date();

// --- INITIALIZATION ---
applyLanguage(currentLang);
updateUI(currentDate);

// --- EVENT LISTENERS ---
langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'mm' : 'en';
    localStorage.setItem('powerSched_lang', currentLang);
    applyLanguage(currentLang);
    updateUI(currentDate);
});

datePicker.addEventListener('change', (e) => {
    if(!e.target.value) return;
    const parts = e.target.value.split('-');
    currentDate = new Date(parts[0], parts[1] - 1, parts[2]); 
    updateUI(currentDate);
});

prevBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    updateUI(currentDate);
});

nextBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 1);
    updateUI(currentDate);
});

todayBtn.addEventListener('click', () => {
    currentDate = new Date();
    updateUI(currentDate);
});

// --- HELPER FUNCTIONS ---

function toBurmeseNum(num) {
    return num.toString().split('').map(char => {
        const digit = parseInt(char);
        return isNaN(digit) ? char : BURMESE_NUMS[digit];
    }).join('');
}

function formatDateHeader(date) {
    const t = TRANSLATIONS[currentLang];
    const day = date.getDate();
    const month = t.months[date.getMonth()];
    
    const options = { weekday: 'long' };
    const weekday = new Intl.DateTimeFormat(currentLang === 'mm' ? 'my-MM' : 'en-US', options).format(date);

    if (currentLang === 'mm') {
        return `${weekday}၊ ${month} ${toBurmeseNum(day)}`;
    }
    return `${weekday}, ${month} ${day}`;
}

function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const t = TRANSLATIONS[currentLang];
    
    let period = "";
    if (h >= 5 && h < 12) period = t.periods.morning;
    else if (h >= 12 && h < 17) period = t.periods.afternoon;
    else if (h >= 17 && h < 22) period = t.periods.evening;
    else period = t.periods.night; 

    let displayH = h % 12;
    displayH = displayH ? displayH : 12; 

    if (currentLang === 'mm') {
        let displayNum = toBurmeseNum(displayH);
        let minStr = m > 0 ? `:${toBurmeseNum(m)}` : '';
        return `${period} ${displayNum}${minStr}${t.unit_hour}`;
    } else {
        let minStr = m.toString().padStart(2, '0');
        return `${displayH}:${minStr} ${period}`;
    }
}

// --- CORE LOGIC ---

function applyLanguage(lang) {
    const t = TRANSLATIONS[lang];
    langToggle.textContent = t.toggle_label;
    
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (t[key]) el.textContent = t[key];
    });
}

function updateUI(date) {
    const t = TRANSLATIONS[currentLang];

    // 1. Is it Today?
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();

    // 2. Button State
    if (isToday) {
        todayBtn.classList.add('active');
        todayBtn.classList.remove('hidden-state');
    } else {
        todayBtn.classList.remove('active');
        todayBtn.classList.add('hidden-state');
    }

    // 3. Date Header
    displayDateText.textContent = formatDateHeader(date);
    
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    datePicker.value = `${y}-${m}-${d}`;

    // 4. Determine Pattern
    const anchor = new Date(ANCHOR_DATE);
    anchor.setHours(0,0,0,0);
    const target = new Date(date);
    target.setHours(0,0,0,0);
    const diffTime = target.getTime() - anchor.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    const isAnchorPattern = Math.abs(diffDays) % 2 === 0;

    // 5. Generate Schedule Data
    let daySchedule = [];
    let patternTitle = "";
    
    if (isAnchorPattern) {
        // Pattern A
        patternTitle = t.patternA_title;
        displayPatternName.style.color = "var(--accent-red)";
        daySchedule = [
            { timeKey: '05:00-09:00', start:'05:00', end:'09:00', type: 'grid' },
            { timeKey: '09:00-13:00', start:'09:00', end:'13:00', type: 'outage' },
            { timeKey: '13:00-17:00', start:'13:00', end:'17:00', type: 'grid' },
            { timeKey: '17:00-05:00', start:'17:00', end:'05:00', type: 'grid', nextDay: true }
        ];
    } else {
        // Pattern B
        patternTitle = t.patternB_title;
        displayPatternName.style.color = "var(--accent-yellow)";
        daySchedule = [
            // Split the morning slot: 5:00-7:30 is Grid, 7:30-9:00 is Outage
            { timeKey: '05:00-07:30', start:'05:00', end:'07:30', type: 'grid' },
            { timeKey: '07:30-09:00', start:'07:30', end:'09:00', type: 'outage' },
            { timeKey: '09:00-13:00', start:'09:00', end:'13:00', type: 'grid' },
            { timeKey: '13:00-17:00', start:'13:00', end:'17:00', type: 'outage' },
            { timeKey: '17:00-09:00', start:'17:00', end:'09:00', type: 'grid', nextDay: true }
        ];
    }

    displayPatternName.textContent = patternTitle;
    
    summaryContainer.innerHTML = `<span>${isAnchorPattern ? t.patternA_desc : t.patternB_desc}</span>`;
    summaryContainer.style.borderLeftColor = isAnchorPattern ? "var(--accent-red)" : "var(--accent-yellow)";

    renderScheduleList(daySchedule, isToday);
}

function renderScheduleList(schedule, isToday) {
    scheduleContainer.innerHTML = ''; 
    const t = TRANSLATIONS[currentLang];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMin;

    schedule.forEach(slot => {
        const card = document.createElement('div');
        card.className = 'time-slot';

        // Check if Active Slot
        let isActive = false;
        if (isToday) {
            const [sH, sM] = slot.start.split(':').map(Number);
            const [eH, eM] = slot.end.split(':').map(Number);
            let startVal = sH * 60 + sM;
            let endVal = eH * 60 + eM;
            
            if (slot.nextDay) {
                if (currentTimeVal >= startVal || currentTimeVal < endVal) isActive = true;
            } else {
                if (currentTimeVal >= startVal && currentTimeVal < endVal) isActive = true;
            }
        }

        if (isActive) card.classList.add('active-now');

        let timeDisplay = `${formatTime(slot.start)}${t.range_separator}${formatTime(slot.end)}`;
        if (slot.nextDay) timeDisplay += ` <small>${t.next_day}</small>`;

        let statusBadge = slot.type === 'grid' 
            ? `<span class="status-badge status-grid-on">${t.grid_on}</span>`
            : `<span class="status-badge status-outage">${t.power_off}</span>`;

        let htmlContent = `
            <div class="slot-header">
                <span class="time-range">${timeDisplay}</span>
                ${statusBadge}
            </div>
        `;

        if (slot.type === 'outage') {
            const rules = GEN_RULES[slot.timeKey];
            if (rules) {
                htmlContent += `<div class="gen-info">`;
                rules.forEach(rule => {
                    let dotClass = rule.status === 'Running' ? 'dot-yellow' : 'dot-grey';
                    let textStyle = rule.status === 'Running' ? 'color: var(--accent-yellow)' : 'color: var(--text-muted)';
                    let statusText = rule.status === 'Running' ? t.gen_running : t.gen_rest;
                    let genRange = `${formatTime(rule.start)}${t.range_separator}${formatTime(rule.end)}`;

                    htmlContent += `
                        <div class="gen-row">
                            <span class="dot ${dotClass}"></span>
                            <span style="${textStyle}">
                                <strong>${genRange}:</strong> ${statusText}
                            </span>
                        </div>
                    `;
                });
                htmlContent += `</div>`;
            }
        } else {
            htmlContent += `
                <div class="gen-info">
                    <div class="gen-row">
                        <span class="dot dot-green"></span>
                        <span style="color: var(--accent-green)">${t.elec_avail}</span>
                    </div>
                </div>
            `;
        }

        card.innerHTML = htmlContent;
        scheduleContainer.appendChild(card);
    });
}
