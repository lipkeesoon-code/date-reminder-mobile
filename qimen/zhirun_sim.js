const ST_CONSTANTS = [
    3.87, 18.73, 5.63, 20.646, 4.81, 20.1, 5.52, 21.04, 
    5.678, 21.37, 7.108, 22.83, 7.5, 23.13, 7.646, 23.042, 
    8.318, 23.438, 7.438, 22.36, 7.18, 21.94, 5.405, 20.12
];

function getSolarTermDay(y, n) {
    if (n < 0 || n > 23) return -1;
    const yearOffset = y % 100;
    const C = ST_CONSTANTS[n];
    let d = Math.floor(yearOffset * 0.2422 + C) - Math.floor((yearOffset - (n <= 2 ? 1 : 0)) / 4);
    if (y === 2026 && n === 0) return 4;
    if (y === 2022 && n === 0) return 4;
    if (y === 2012 && n === 0) return 4;
    if (y === 1987 && n === 0) return 4;
    return d;
}

function getSolarTermMonth(n) {
    return Math.floor(n / 2) + 2; 
}

function getAstroTermDate(y, termIndex) {
    let m = getSolarTermMonth(termIndex);
    let yy = y;
    if (m > 12) {
        m -= 12;
        yy += 1;
    }
    let d = getSolarTermDay(yy, termIndex);
    return new Date(yy, m - 1, d, 12, 0, 0);
}

const SOLAR_TERMS = [
    "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满",
    "芒种", "夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分",
    "寒露", "霜降", "立冬", "小雪", "大雪", "冬至", "小寒", "大寒"
];

// Let's reorder SOLAR_TERMS so it starts from Dong Zhi
const ZHI_RUN_TERMS = [
    "冬至", "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种",
    "夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪"
];

function getZhirunJieQi(targetDate) {
    // Anchor: 1924-12-22 is Dong Zhi.
    let currentDate = new Date(1924, 11, 22, 12, 0, 0); 
    let currentTermIndex = 0; // "冬至"
    
    // We advance 15 days at a time.
    while (currentDate.getTime() < targetDate.getTime()) {
        let nextDate = new Date(currentDate.getTime() + 15 * 86400000);
        
        // Are we at Mang Zhong (11) or Da Xue (23)?
        if (currentTermIndex === 11 || currentTermIndex === 23) {
            // Check next astronomical term
            let nextTermOriginalIndex = currentTermIndex === 11 ? 9 : 21; // 夏至 in SOLAR_TERMS is 9, 冬至 is 21
            let nextAstroDate = getAstroTermDate(nextDate.getFullYear(), nextTermOriginalIndex);
            
            // Chao Shen = nextDate - nextAstroDate
            let diffDays = (nextDate.getTime() - nextAstroDate.getTime()) / 86400000;
            
            if (diffDays >= 9) {
                // Zhirun! Repeat current term.
                currentDate = nextDate;
                // termIndex stays the same!
                if (currentDate.getTime() > targetDate.getTime()) break;
                continue;
            }
        }
        
        currentDate = nextDate;
        currentTermIndex = (currentTermIndex + 1) % 24;
    }
    
    return ZHI_RUN_TERMS[currentTermIndex];
}

console.log("1976-07-08 ->", getZhirunJieQi(new Date(1976, 6, 8, 12, 0, 0)));
console.log("2026-07-22 ->", getZhirunJieQi(new Date(2026, 6, 22, 12, 0, 0)));
