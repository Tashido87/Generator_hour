// Configuration
// Anchor date: Dec 9, 2025 (Today)
// Pattern A (Today): Outage 9am-1pm.
const ANCHOR_DATE = new Date('2025-12-09T00:00:00');

// Generator Rules
// Updated: 5am-9am slot now shows the 1-hour rest at the start.
const GEN_RULES = {
    '05:00-09:00': [
        { start: '05:00', end: '06:00', status: 'Rest' },
        { start: '06:00', end: '09:00', status: 'Running' }
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

// DOM Elements
const datePicker = document.getElementById('date-picker');
const prevBtn = document.getElementById('prev-day');
const nextBtn = document.getElementById('next-day');
const summaryContainer = document.getElementById('daily-summary');
const scheduleContainer = document.getElementById('schedule-container');

// Initialize with Today
let currentDate = new Date();
updateUI(currentDate);

// Event Listeners
datePicker.addEventListener('change', (e) => {
    const parts = e.target.value.split('-');
    // Create date using local time parts to avoid timezone shifts
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

// Helper: Convert 24h time string to AM/PM
function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; 
    return `${h}:${minutes} ${ampm}`;
}

// Main Logic
function updateUI(date) {
    // 1. Update Date Picker
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    datePicker.value = `${year}-${month}-${day}`;

    // 2. Determine Pattern
    const anchor = new Date(ANCHOR_DATE);
    anchor.setHours(0,0,0,0);
    
    const target = new Date(date);
    target.setHours(0,0,0,0);

    const diffTime = target.getTime() - anchor.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    
    // Even days = Pattern A (Today Dec 9)
    // Odd days = Pattern B (Tomorrow Dec 10)
    const isAnchorPattern = Math.abs(diffDays) % 2 === 0;

    let daySchedule = [];
    let patternTitle = "";
    let patternDesc = "";

    if (isAnchorPattern) {
        // TODAY (Dec 9)
        // Tomorrow cuts at 5 AM
        patternTitle = "Late Morning Schedule";
        patternDesc = "Outage: 9:00 AM - 1:00 PM Only";
        
        daySchedule = [
            { timeKey: '05:00-09:00', display: '5:00 AM - 9:00 AM', type: 'grid' },
            { timeKey: '09:00-13:00', display: '9:00 AM - 1:00 PM', type: 'outage' },
            { timeKey: '13:00-17:00', display: '1:00 PM - 5:00 PM', type: 'grid' },
            { timeKey: '17:00-05:00', display: '5:00 PM - 5:00 AM (Next Day)', type: 'grid' }
        ];
    } else {
        // TOMORROW (Dec 10)
        // Next day cuts at 9 AM
        patternTitle = "Early Morning & Afternoon Schedule";
        patternDesc = "Outage: 5:00 AM - 9:00 AM & 1:00 PM - 5:00 PM";
        
        daySchedule = [
            { timeKey: '05:00-09:00', display: '5:00 AM - 9:00 AM', type: 'outage' },
            { timeKey: '09:00-13:00', display: '9:00 AM - 1:00 PM', type: 'grid' },
            { timeKey: '13:00-17:00', display: '1:00 PM - 5:00 PM', type: 'outage' },
            { timeKey: '17:00-09:00', display: '5:00 PM - 9:00 AM (Next Day)', type: 'grid' }
        ];
    }

    renderSummary(patternTitle, patternDesc, isAnchorPattern);
    renderScheduleList(daySchedule);
}

function renderSummary(title, desc, isAnchor) {
    summaryContainer.innerHTML = `
        <h2 style="color: var(--text-main)">${title}</h2>
        <span>${desc}</span>
    `;
    summaryContainer.style.borderLeftColor = isAnchor ? "var(--accent-red)" : "var(--accent-yellow)";
}

function renderScheduleList(schedule) {
    scheduleContainer.innerHTML = ''; 

    schedule.forEach(slot => {
        const card = document.createElement('div');
        card.className = 'time-slot';

        // Header Section
        let statusBadge = '';
        if (slot.type === 'grid') {
            statusBadge = `<span class="status-badge status-grid-on">Grid Power ON</span>`;
        } else {
            statusBadge = `<span class="status-badge status-outage">Power OFF</span>`;
        }

        let htmlContent = `
            <div class="slot-header">
                <span class="time-range">${slot.display}</span>
                ${statusBadge}
            </div>
        `;

        // Generator Section
        if (slot.type === 'outage') {
            const rules = GEN_RULES[slot.timeKey];
            if (rules) {
                htmlContent += `<div class="gen-info">`;
                rules.forEach(rule => {
                    let dotClass = rule.status === 'Running' ? 'dot-yellow' : 'dot-grey';
                    let textStyle = rule.status === 'Running' ? 'color: var(--accent-yellow)' : 'color: var(--text-muted)';
                    
                    const startAMPM = formatTime(rule.start);
                    const endAMPM = formatTime(rule.end);

                    htmlContent += `
                        <div class="gen-row">
                            <span class="dot ${dotClass}"></span>
                            <span style="${textStyle}">
                                <strong>${startAMPM} - ${endAMPM}:</strong> Generator ${rule.status}
                            </span>
                        </div>
                    `;
                });
                htmlContent += `</div>`;
            }
        } else {
            // Grid ON
            htmlContent += `
                <div class="gen-info">
                    <div class="gen-row">
                        <span class="dot dot-green"></span>
                        <span style="color: var(--accent-green)">Electricity Available</span>
                    </div>
                </div>
            `;
        }

        card.innerHTML = htmlContent;
        scheduleContainer.appendChild(card);
    });
}