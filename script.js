// --- CONFIGURATION ---
const ANCHOR_DATE = new Date('2025-12-09T00:00:00');

const BURMESE_NUMS = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];

const TRANSLATIONS = {
    en: {
        title: "Power Schedule",
        patternA_title: "PATTERN A: LATE MORNING OUTAGE",
        patternA_desc: "Outage: 9:00 AM - 1:00 PM",
        patternB_title: "PATTERN B: SPLIT OUTAGE",
        patternB_desc: "Outage: 7:30 AM - 9:00 AM & 1:00 PM - 5:00 PM",
        grid_on: "GRID ON",
        power_off: "GRID OFF",
        gen_running: "Generator ON",
        gen_rest: "Gen Resting",
        elec_avail: "Electricity Available",
        next_day: "(Next Day)",
        elevatorLabel: "Elevator (Off-hours):",
        elevatorFee: "10,000 MMK fee",
        btn_today: "Today",
        range_separator: " - ", 
        unit_hour: "", 
        periods: { morning: "AM", afternoon: "PM", evening: "PM", night: "PM" },
        months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    },
    mm: {
        title: "မီးပေးချိန် ဇယား",
        patternA_title: "ပုံစံ A (မနက်ပိုင်း မီးပျက်)",
        patternA_desc: "မီးပျက်ချိန် - မနက် ၉ မှ နေ့လည် ၁",
        patternB_title: "ပုံစံ B (နှစ်ချိန်ခွဲ)",
        patternB_desc: "မီးပျက်ချိန် - မနက် ၇:၃၀ မှ ၉ ၊ နေ့လည် ၁ မှ ၅",
        grid_on: "မီးလာ",
        power_off: "မီးပျက်",
        gen_running: "မီးစက်မောင်း",
        gen_rest: "မီးစက်နား",
        elec_avail: "မီးလာ (EPC)",
        next_day: "(နောက်နေ့)",
        elevatorLabel: "ဓာတ်လှေကား (အချိန်ပြင်ပ):",
        elevatorFee: "၁၀,၀၀၀ ကျပ်",
        btn_today: "ဒီနေ့",
        range_separator: " မှ ", 
        unit_hour: "",
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
        { start: '13:00', end: '14:00', status: 'Rest' },
        { start: '14:00', end: '15:00', status: 'Running' },
        { start: '15:00', end: '16:00', status: 'Rest' },
        { start: '16:00', end: '17:00', status: 'Running' }
    ]
};

// Icons (SVG Strings)
const ICONS = {
    bolt: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    power: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>`,
    genBox: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    restBox: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M7 12h10"></path></svg>`,
    elecBox: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`
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
const displayPatternBadge = document.getElementById('display-pattern-badge');

// --- STATE MANAGEMENT ---
let currentLang = localStorage.getItem('powerSched_lang') || 'en';
let currentDate = new Date();

// --- INITIALIZATION ---
applyLanguage(currentLang);
updateUI(currentDate);

// Refresh every minute to update progress bars
setInterval(() => {
    // Only update if looking at today
    const now = new Date();
    if (currentDate.getDate() === now.getDate() && 
        currentDate.getMonth() === now.getMonth()) {
        updateUI(currentDate);
    }
}, 60000);

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
        // Burmese Format
        let displayNum = toBurmeseNum(displayH);
        let minStr = m > 0 ? `:${toBurmeseNum(m)}` : '';
        return `${period} ${displayNum}${minStr}`;
    } else {
        // English Format
        let minStr = m.toString().padStart(2, '0');
        return `${displayH}:${minStr} ${period}`;
    }
}

// --- CORE LOGIC ---

function applyLanguage(lang) {
    const t = TRANSLATIONS[lang];
    const langLabel = langToggle.querySelector('.lang-text');
    const flagIcon = langToggle.querySelector('.flag-icon');
    
    if (lang === 'en') {
        flagIcon.textContent = "🇺🇸";
        langLabel.textContent = "EN";
    } else {
        flagIcon.textContent = "🇲🇲";
        langLabel.textContent = "MM";
    }
    
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

    if (isToday) todayBtn.classList.add('active');
    else todayBtn.classList.remove('active');

    // 2. Date Header
    displayDateText.textContent = formatDateHeader(date);
    
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    datePicker.value = `${y}-${m}-${d}`;

    // 3. Determine Pattern
    const anchor = new Date(ANCHOR_DATE);
    anchor.setHours(0,0,0,0);
    const target = new Date(date);
    target.setHours(0,0,0,0);
    const diffTime = target.getTime() - anchor.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    const isAnchorPattern = Math.abs(diffDays) % 2 === 0;

    // 4. Update Colors & Badge based on Pattern
    let patternTitle = "";
    let daySchedule = [];
    
    if (isAnchorPattern) {
        // Pattern A
        patternTitle = t.patternA_title;
        displayPatternBadge.textContent = patternTitle;
        displayPatternBadge.style.backgroundColor = "rgba(255, 69, 58, 0.2)";
        displayPatternBadge.style.color = "var(--accent-red)";
        summaryContainer.style.borderLeftColor = "var(--accent-red)";
        
        daySchedule = [
            { timeKey: '05:00-09:00', start:'05:00', end:'09:00', type: 'grid' },
            { timeKey: '09:00-13:00', start:'09:00', end:'13:00', type: 'outage' },
            { timeKey: '13:00-17:00', start:'13:00', end:'17:00', type: 'grid' },
            { timeKey: '17:00-05:00', start:'17:00', end:'05:00', type: 'grid', nextDay: true }
        ];
    } else {
        // Pattern B
        patternTitle = t.patternB_title;
        displayPatternBadge.textContent = patternTitle;
        displayPatternBadge.style.backgroundColor = "rgba(255, 214, 10, 0.2)";
        displayPatternBadge.style.color = "var(--accent-yellow)";
        summaryContainer.style.borderLeftColor = "var(--accent-yellow)";

        daySchedule = [
            { timeKey: '05:00-07:30', start:'05:00', end:'07:30', type: 'grid' },
            { timeKey: '07:30-09:00', start:'07:30', end:'09:00', type: 'outage' },
            { timeKey: '09:00-13:00', start:'09:00', end:'13:00', type: 'grid' },
            { timeKey: '13:00-17:00', start:'13:00', end:'17:00', type: 'outage' },
            { timeKey: '17:00-09:00', start:'17:00', end:'09:00', type: 'grid', nextDay: true }
        ];
    }

    summaryContainer.innerHTML = isAnchorPattern ? t.patternA_desc : t.patternB_desc;

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

        // Check Main Slot Active State
        let isSlotActive = false;
        let startVal, endVal;

        if (isToday) {
            const [sH, sM] = slot.start.split(':').map(Number);
            const [eH, eM] = slot.end.split(':').map(Number);
            startVal = sH * 60 + sM;
            endVal = eH * 60 + eM;
            
            if (slot.nextDay) {
                if (currentTimeVal >= startVal || currentTimeVal < endVal) isSlotActive = true;
            } else {
                if (currentTimeVal >= startVal && currentTimeVal < endVal) isSlotActive = true;
            }
        }

        if (isSlotActive) {
            card.classList.add('active-now');
            const dot = document.createElement('div');
            dot.className = 'live-dot';
            card.appendChild(dot);
        }

        // Header Section
        let timeDisplay = `${formatTime(slot.start)}${t.range_separator}${formatTime(slot.end)}`;
        if (slot.nextDay) timeDisplay += ` <small>${t.next_day}</small>`;

        let statusBadge = '';
        if (slot.type === 'grid') {
            statusBadge = `<div class="status-pill status-grid-on"><span class="status-icon">${ICONS.bolt}</span> ${t.grid_on}</div>`;
        } else {
            statusBadge = `<div class="status-pill status-outage"><span class="status-icon">${ICONS.power}</span> ${t.power_off}</div>`;
        }

        let innerContent = '';

        if (slot.type === 'outage') {
            const rules = GEN_RULES[slot.timeKey];
            if (rules) {
                innerContent += `<div class="inner-list">`;
                rules.forEach(rule => {
                    // Logic to check if inner rule is active & Calc progress
                    let isInnerActive = false;
                    let percentRemaining = 100; // Default full if future

                    if (isToday) {
                        const [rSH, rSM] = rule.start.split(':').map(Number);
                        const [rEH, rEM] = rule.end.split(':').map(Number);
                        let rStartVal = rSH * 60 + rSM;
                        let rEndVal = rEH * 60 + rEM;
                        
                        if (currentTimeVal >= rStartVal && currentTimeVal < rEndVal) {
                            isInnerActive = true;
                            // Calculate percentage remaining (100% at start, 0% at end)
                            const totalDuration = rEndVal - rStartVal;
                            const elapsed = currentTimeVal - rStartVal;
                            percentRemaining = Math.max(0, 100 - ((elapsed / totalDuration) * 100));
                        } else if (currentTimeVal >= rEndVal) {
                            percentRemaining = 0; // Past
                        }
                    }

                    const isRunning = rule.status === 'Running';
                    const iconBoxClass = isRunning ? 'icon-gen' : 'icon-rest';
                    const iconSvg = isRunning ? ICONS.genBox : ICONS.restBox;
                    const titleText = isRunning ? t.gen_running : t.gen_rest;
                    const rangeText = `${formatTime(rule.start)}${t.range_separator}${formatTime(rule.end)}`;
                    
                    let activeClass = isInnerActive ? 'active-inner' : '';
                    let statusClass = isRunning ? '' : 'status-rest'; 
                    let styleAttr = isInnerActive ? `style="--progress: ${percentRemaining}%"` : '';

                    innerContent += `
                        <div class="inner-card ${activeClass} ${statusClass}" ${styleAttr}>
                            <div class="inner-icon-box ${iconBoxClass}">${iconSvg}</div>
                            <div class="inner-content">
                                <span class="inner-title">${titleText}</span>
                                <span class="inner-desc">${rangeText}</span>
                            </div>
                        </div>
                    `;
                });
                innerContent += `</div>`;
            }
        } else {
            // Electricity Available Inner Card
            // Calculate progress for the main grid block as well if active
            let activeClass = isSlotActive ? 'active-inner status-grid' : '';
            let styleAttr = '';
            
            if (isSlotActive && isToday) {
                 // For nextDay blocks, calc requires offset handling, but simplified here for single day
                 let sVal = startVal;
                 let eVal = endVal;
                 // Handle midnight crossing for calc if needed (simple version)
                 if (eVal < sVal) eVal += 24 * 60;
                 let cVal = currentTimeVal;
                 if (cVal < sVal) cVal += 24 * 60;

                 const totalDuration = eVal - sVal;
                 const elapsed = cVal - sVal;
                 const percentRemaining = Math.max(0, 100 - ((elapsed / totalDuration) * 100));
                 styleAttr = `style="--progress: ${percentRemaining}%"`;
            }

            innerContent += `
                <div class="inner-list">
                    <div class="inner-card ${activeClass}" ${styleAttr}>
                        <div class="inner-icon-box icon-elec">${ICONS.elecBox}</div>
                        <div class="inner-content">
                            <span class="inner-title" style="color:var(--accent-green)">${t.elec_avail}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        card.innerHTML += `
            <div class="slot-header">
                <div class="time-range">${timeDisplay}</div>
                ${statusBadge}
            </div>
            ${innerContent}
        `;
        
        scheduleContainer.appendChild(card);
    });
}
