// --- CONFIGURATION ---
const ANCHOR_DATE = new Date('2025-12-09T00:00:00Z');

const TRANSLATIONS = {
    en: {
        grid_on: "GRID ON",
        power_off: "GRID OFF",
        gen_running: "Generator ON",
        gen_rest: "Generator Rest",
        elec_avail: "Electricity Available",
        next_day: "(Next Day)",
        elevatorLabel: "Elevator:",
        elevatorFee: "10,000 MMK fee",
        today: "Today",
        next_change: "Next change",
        in: "in",
        back_today: "Back to Today",
        months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    },
    mm: {
        grid_on: "မီးလာ",
        power_off: "မီးပျက်",
        gen_running: "မီးစက်မောင်း",
        gen_rest: "မီးစက်နား",
        elec_avail: "မီးလာ (EPC)",
        next_day: "(နောက်နေ့)",
        elevatorLabel: "ဓာတ်လှေကား:",
        elevatorFee: "၁၀,၀၀၀ ကျပ်",
        today: "ဒီနေ့",
        next_change: "နောက်အပြောင်းအလဲ",
        in: "နောက်",
        back_today: "ဒီနေ့ပြန်သွား",
        months: ["ဇန်နဝါရီ", "ဖေဖော်ဝါရီ", "မတ်", "ဧပြီ", "မေ", "ဇွန်", "ဇူလိုင်", "သြဂုတ်", "စက်တင်ဘာ", "အောက်တိုဘာ", "နိုဝင်ဘာ", "ဒီဇင်ဘာ"]
    }
};

const BURMESE_NUMS = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];

// --- DATA ---
const GEN_RULES = {
    '07:30-09:00': [{ s: '07:30', e: '09:00', status: 'Running' }],
    '09:00-13:00': [
        { s: '09:00', e: '11:00', status: 'Running' },
        { s: '11:00', e: '12:00', status: 'Rest' },
        { s: '12:00', e: '13:00', status: 'Running' }
    ],
    '13:00-17:00': [
        { s: '13:00', e: '14:00', status: 'Rest' },
        { s: '14:00', e: '15:00', status: 'Running' },
        { s: '15:00', e: '16:00', status: 'Rest' },
        { s: '16:00', e: '17:00', status: 'Running' }
    ]
};

const SCHEDULE_PATTERNS = {
    A: [
        { s: '05:00', e: '09:00', type: 'grid' },
        { s: '09:00', e: '13:00', type: 'outage', ruleKey: '09:00-13:00' },
        { s: '13:00', e: '17:00', type: 'grid' },
        { s: '17:00', e: '05:00', type: 'grid', nextDay: true }
    ],
    B: [
        { s: '05:00', e: '07:30', type: 'grid' },
        { s: '07:30', e: '09:00', type: 'outage', ruleKey: '07:30-09:00' },
        { s: '09:00', e: '13:00', type: 'grid' },
        { s: '13:00', e: '17:00', type: 'outage', ruleKey: '13:00-17:00' },
        { s: '17:00', e: '09:00', type: 'grid', nextDay: true }
    ]
};

// --- DOM ELEMENTS ---
const datePicker = document.getElementById('date-picker');
const dateText = document.getElementById('display-date-text');
const prevBtn = document.getElementById('prev-day');
const nextBtn = document.getElementById('next-day');
const btnReturnToday = document.getElementById('btn-return-today');
const timelineContainer = document.getElementById('timeline-container');
const langToggle = document.getElementById('lang-toggle');
const heroStatusText = document.getElementById('hero-status-text');
const heroCountdown = document.getElementById('hero-countdown');
const heroIcon = document.getElementById('hero-icon');
const patternName = document.getElementById('pattern-name');
const appBg = document.getElementById('app-background');
const fabNow = document.getElementById('fab-now');
const sheet = document.querySelector('.schedule-sheet');

// --- ICONS (SVG) ---
const ICONS = {
    bolt: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    powerOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>`,
    plug: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10"/><path d="M2 12h20"/><path d="M12 12v10"/></svg>`
};

// --- STATE ---
let currentLang = localStorage.getItem('powerSched_lang') || 'en';
let currentDate = new Date();

// --- INIT ---
init();

function init() {
    applyLanguage(currentLang);
    updateUI();
    
    // Updates
    setInterval(() => {
        const now = new Date();
        // Refresh if minute changes or day matches
        if (currentDate.getDate() === now.getDate()) updateUI();
    }, 60000);

    // Scroll listener for FAB
    sheet.addEventListener('scroll', () => {
        const activeItem = document.querySelector('.timeline-item.active');
        if (activeItem) {
            const rect = activeItem.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
                fabNow.classList.add('show');
            } else {
                fabNow.classList.remove('show');
            }
        }
    });

    fabNow.addEventListener('click', () => {
        vibrate();
        const activeItem = document.querySelector('.timeline-item.active');
        if (activeItem) activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

// --- EVENT LISTENERS ---
langToggle.addEventListener('click', () => {
    vibrate();
    currentLang = currentLang === 'en' ? 'mm' : 'en';
    localStorage.setItem('powerSched_lang', currentLang);
    applyLanguage(currentLang);
    updateUI();
});

datePicker.addEventListener('change', (e) => {
    if(!e.target.value) return;
    const [y, m, d] = e.target.value.split('-').map(Number);
    currentDate = new Date(y, m - 1, d); 
    updateUI();
});

prevBtn.addEventListener('click', () => {
    vibrate();
    currentDate.setDate(currentDate.getDate() - 1);
    updateUI();
});

nextBtn.addEventListener('click', () => {
    vibrate();
    currentDate.setDate(currentDate.getDate() + 1);
    updateUI();
});

btnReturnToday.addEventListener('click', () => {
    vibrate();
    currentDate = new Date();
    updateUI();
});

// --- CORE LOGIC ---

function updateUI() {
    const t = TRANSLATIONS[currentLang];
    const now = new Date();
    
    // 1. Header & Date
    const isToday = isSameDay(currentDate, now);
    dateText.textContent = formatDate(currentDate);
    
    // Toggle "Back to Today" button
    if(isToday) {
        btnReturnToday.classList.remove('visible');
    } else {
        btnReturnToday.textContent = t.back_today;
        btnReturnToday.classList.add('visible');
    }
    
    // Sync Date Picker
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    datePicker.value = `${y}-${m}-${d}`;

    // 2. Pattern
    const diffDays = dayDiffUTC(ANCHOR_DATE, currentDate);
    const isPatternA = Math.abs(diffDays) % 2 === 0;
    patternName.textContent = isPatternA ? "Pattern A" : "Pattern B";

    // 3. Build Schedule
    const rawPattern = isPatternA ? SCHEDULE_PATTERNS.A : SCHEDULE_PATTERNS.B;
    const schedule = buildScheduleObjects(rawPattern, currentDate);

    // 4. Render
    renderTimeline(schedule, isToday, now);
    updateHeroStatus(schedule, isToday, now);
}

function buildScheduleObjects(pattern, date) {
    return pattern.map(slot => {
        const { start, end } = makeInterval(date, slot.s, slot.e, slot.nextDay);
        let subRules = [];
        if (slot.ruleKey && GEN_RULES[slot.ruleKey]) {
            subRules = GEN_RULES[slot.ruleKey].map(r => {
                const rInt = makeInterval(start, r.s, r.e, false);
                return { ...r, start: rInt.start, end: rInt.end };
            });
        }
        return { ...slot, start, end, subRules };
    });
}

function renderTimeline(schedule, isToday, now) {
    timelineContainer.innerHTML = '';
    const t = TRANSLATIONS[currentLang];

    schedule.forEach(slot => {
        const isActive = isToday && now >= slot.start && now < slot.end;
        // Inverted logic is handled inside getProgressPct
        const progress = isActive ? getProgressPct(now, slot.start, slot.end) : 0;
        
        let themeClass = slot.type === 'grid' ? 'status-grid' : 'status-outage';
        
        const item = document.createElement('div');
        item.className = `timeline-item ${isActive ? 'active' : ''} ${themeClass}`;
        
        const timeStr = `${formatTime(slot.start)} - ${formatTime(slot.end)}`;
        const label = slot.type === 'grid' ? t.grid_on : t.power_off;
        
        let subHtml = '';
        if (slot.subRules.length > 0) {
            subHtml = `<div class="sub-timeline">`;
            slot.subRules.forEach(r => {
                const subActive = isToday && now >= r.start && now < r.end;
                const rStatus = r.status === 'Running' ? 'status-gen' : 'status-rest';
                const rLabel = r.status === 'Running' ? t.gen_running : t.gen_rest;
                
                subHtml += `
                    <div class="sub-item ${subActive ? 'active-sub' : ''}" style="--sub-color: var(--c-${rStatus === 'status-gen' ? 'yellow' : 'text-sec'})">
                        <span>${rLabel}</span>
                        <span>${formatTime(r.start)}</span>
                    </div>
                `;
            });
            subHtml += `</div>`;
        }

        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="time-label">${timeStr}</div>
            <div class="card-bubble">
                <div class="card-title">
                    ${slot.type === 'grid' ? ICONS.bolt : ICONS.powerOff}
                    <span>${label}</span>
                </div>
                ${isActive ? `<div class="progress-container"><div class="progress-bar" style="--prog:${progress}%"></div></div>` : ''}
                ${subHtml}
            </div>
        `;
        
        timelineContainer.appendChild(item);
        
        if (isActive) {
            setTimeout(() => item.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }
    });
}

function updateHeroStatus(schedule, isToday, now) {
    const t = TRANSLATIONS[currentLang];
    
    if (!isToday) {
        setHeroTheme('neutral', "Future Date", "");
        return;
    }

    let activeSlot = null;
    let nextEventTime = null;
    let nextEventLabel = "";
    
    // Use standard loop to allow look-ahead by index
    for (let i = 0; i < schedule.length; i++) {
        const slot = schedule[i];

        if (now >= slot.start && now < slot.end) {
            activeSlot = slot;
            
            if (slot.type === 'grid') {
                // FIXED LOGIC: Look ahead for consecutive 'grid' slots
                let effectiveEndTime = slot.end;
                let nextIdx = i + 1;
                
                // If next slot exists and is also grid, use its end time instead
                while(nextIdx < schedule.length && schedule[nextIdx].type === 'grid') {
                    effectiveEndTime = schedule[nextIdx].end;
                    nextIdx++;
                }

                nextEventTime = effectiveEndTime;
                nextEventLabel = t.power_off;
                setHeroTheme('grid', t.grid_on, ICONS.bolt);
            } else {
                let subActive = null;
                for (const r of slot.subRules) {
                    if (now >= r.start && now < r.end) {
                        subActive = r;
                        nextEventTime = r.end;
                        nextEventLabel = r.status === 'Running' ? t.gen_rest : t.gen_running;
                        if (r === slot.subRules[slot.subRules.length - 1]) nextEventLabel = t.grid_on;
                        break;
                    }
                }
                
                if (subActive) {
                    if (subActive.status === 'Running') {
                        setHeroTheme('gen', t.gen_running, ICONS.plug);
                    } else {
                        setHeroTheme('rest', t.gen_rest, ICONS.powerOff);
                    }
                } else {
                    nextEventTime = slot.end;
                    nextEventLabel = t.grid_on;
                    setHeroTheme('outage', t.power_off, ICONS.powerOff);
                }
            }
            break;
        } else if (now < slot.start && !nextEventTime) {
            nextEventTime = slot.start;
            nextEventLabel = slot.type === 'grid' ? t.grid_on : t.power_off;
            setHeroTheme('neutral', "Waiting...", ICONS.powerOff);
        }
    }

    if (nextEventTime) {
        const diffMins = Math.ceil((nextEventTime - now) / 60000);
        heroCountdown.textContent = formatCountdown(diffMins, nextEventLabel);
    } else {
        heroCountdown.textContent = t.today;
    }
}

// --- HELPERS ---

function setHeroTheme(type, text, iconHtml) {
    heroStatusText.textContent = text;
    if (iconHtml) heroIcon.innerHTML = iconHtml;
    
    let color = '#8e8e93';
    let glow = '#333';
    
    if (type === 'grid') { color = 'var(--c-green)'; glow = 'var(--c-green-glow)'; }
    else if (type === 'outage' || type === 'rest') { color = 'var(--c-red)'; glow = 'var(--c-red-glow)'; }
    else if (type === 'gen') { color = 'var(--c-yellow)'; glow = 'var(--c-yellow-glow)'; }
    
    document.querySelector('.status-header').style.color = color;
    appBg.style.setProperty('--bg-glow', glow);
}

function formatCountdown(mins, label) {
    const t = TRANSLATIONS[currentLang];
    
    if (currentLang === 'mm') {
        let timeStr = "";
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0) timeStr += `${toBurmeseNum(h)} နာရီ`;
        if (m > 0) timeStr += ` ${toBurmeseNum(m)} မိနစ်`;
        if (h===0 && m===0) return "အခုပြောင်းမယ်";
        if (timeStr === "") timeStr = `${toBurmeseNum(mins)} မိနစ်`;
        return `နောက် ${timeStr} တွင် ${label}မည်`;
    } else {
        let timeStr = mins < 60 ? `${mins} min` : `${Math.floor(mins/60)} hr ${mins%60} min`;
        return `${t.next_change}: ${label} ${t.in} ${timeStr}`;
    }
}

function applyLanguage(lang) {
    const t = TRANSLATIONS[lang];
    langToggle.querySelector('.flag').textContent = lang === 'en' ? "🇺🇸" : "🇲🇲";
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (t[key]) el.textContent = t[key];
    });
}

function vibrate() {
    if (navigator.vibrate) navigator.vibrate(10);
}

function dayDiffUTC(a, b) {
    const au = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
    const bu = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((bu - au) / 86400000);
}

function makeInterval(base, s, e, next) {
    const [sH, sM] = s.split(':').map(Number);
    const [eH, eM] = e.split(':').map(Number);
    const start = new Date(base); start.setHours(sH, sM, 0, 0);
    const end = new Date(base); end.setHours(eH, eM, 0, 0);
    if (next || end <= start) end.setDate(end.getDate() + 1);
    return { start, end };
}

function getProgressPct(now, start, end) {
    const total = end - start;
    const elapsed = now - start;
    const pct = (elapsed / total) * 100;
    
    // Return REMAINING percentage (Like a battery draining, starts at 100 goes to 0)
    return Math.max(0, Math.min(100, 100 - pct));
}

function isSameDay(d1, d2) {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
}

function formatDate(date) {
    const t = TRANSLATIONS[currentLang];
    const day = date.getDate();
    const month = t.months[date.getMonth()];
    const weekday = new Intl.DateTimeFormat(currentLang === 'mm' ? 'my-MM' : 'en-US', { weekday: 'short' }).format(date);
    
    return currentLang === 'mm' 
        ? `${weekday}၊ ${month} ${toBurmeseNum(day)}`
        : `${weekday}, ${month} ${day}`;
}

function formatTime(d) {
    let h = d.getHours();
    let m = d.getMinutes();
    const t = TRANSLATIONS[currentLang];
    
    let period = h >= 12 ? "PM" : "AM";
    if (currentLang === 'mm') {
         if (h >= 5 && h < 12) period = "မနက်";
        else if (h >= 12 && h < 17) period = "နေ့လည်";
        else if (h >= 17 && h < 22) period = "ညနေ";
        else period = "ည";
    }
    
    let dh = h % 12 || 12;
    if (currentLang === 'mm') {
        return `${period} ${toBurmeseNum(dh)}${m > 0 ? ':'+toBurmeseNum(m) : ''}`;
    }
    return `${dh}:${m.toString().padStart(2,'0')} ${period}`;
}

function toBurmeseNum(n) {
    return n.toString().split('').map(c => BURMESE_NUMS[parseInt(c)] || c).join('');
}
