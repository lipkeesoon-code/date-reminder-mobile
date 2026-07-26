// app.js - Di Tian Shui BaZi Edition

const State = {
    groups: JSON.parse(localStorage.getItem('ziwi_groups')) || [{ id: 'default', name: '默认群组' }],
    records: JSON.parse(localStorage.getItem('ziwi_records')) || [],
    defaultGroupId: localStorage.getItem('ziwi_default_group') || '',
    currentActiveRecord: null,
    isLoggedIn: localStorage.getItem('ziwi_auth') === 'true',
    lastUsedGroupId: localStorage.getItem('ziwi_last_used_group') || '',
    collapsedGroups: new Set(JSON.parse(localStorage.getItem('ziwi_collapsed_groups')) || []),
    browsingYear: 2026,
    browsingLuckIndex: -1,  // -1 means auto-calculate from browsingYear
    browsingMonthIndex: -1 // -1 means auto-calculate (default to current month)
};


const UI = {
    phoneContainer: document.getElementById('phone-container'),
    bottomNav: document.getElementById('bottom-nav'),
    views: document.querySelectorAll('.app-view'),
    navItems: document.querySelectorAll('.nav-item'),

    // Login
    loginEmail: document.getElementById('login-email'),
    loginPass: document.getElementById('login-pass'),
    btnLogin: document.getElementById('btn-login'),
    loginError: document.getElementById('login-error'),

    // Input
    gregYear: document.getElementById('greg-year'),
    gregMonth: document.getElementById('greg-month'),
    gregDay: document.getElementById('greg-day'),
    gregTime: document.getElementById('greg-time'),
    lunarDisplay: document.getElementById('lunar-date-display'),
    userName: document.getElementById('user-name'),
    btnSaveChart: document.getElementById('btn-save-chart'),
    btnNewChart: document.getElementById('btn-new-chart'),

    // Records
    groupList: document.getElementById('group-list'),
    addGroupBtn: document.getElementById('add-group-btn'),

    // Context Menu
    contextMenu: document.getElementById('context-menu'),
    menuRename: document.getElementById('menu-rename'),
    menuDelete: document.getElementById('menu-delete'),

    // Main Board
    mainBoard: document.getElementById('chart-area-mobile'),
    cName: document.getElementById('c-name'),
    cGregorian: document.getElementById('c-gregorian'),
    cLunar: document.getElementById('c-lunar'),
    cGender: document.getElementById('c-gender'),
    cAge: document.getElementById('c-age'),

    // Global Funcs
    snapshotBtn: document.getElementById('snapshot-btn'),
    backupBtn: document.getElementById('backup-btn'),
    importBtn: document.getElementById('import-btn'),
    importFileInput: document.getElementById('import-file-input'),
    refreshBtn: document.getElementById('refresh-btn'),
    bgChangeBtn: document.getElementById('bg-change-btn'),
    bgUploadInput: document.getElementById('bg-upload-input'),
    bgLayer: document.getElementById('bg-layer'),
    btnLogoutSystem: document.getElementById('btn-logout-system'),

    // BaZi Reverse Search
    revBaziInputs: {
        yStem: document.getElementById('rev-y-stem'),
        yBranch: document.getElementById('rev-y-branch'),
        mStem: document.getElementById('rev-m-stem'),
        mBranch: document.getElementById('rev-m-branch'),
        dStem: document.getElementById('rev-d-stem'),
        dBranch: document.getElementById('rev-d-branch'),
        hStem: document.getElementById('rev-h-stem'),
        hBranch: document.getElementById('rev-h-branch')
    },
    revResultsContainer: document.getElementById('bazi-rev-results'),
    revResultsTitle: document.getElementById('rev-results-title')
};

// --- Context Menu State & Logic ---
const ContextMenuState = {
    visible: false,
    targetType: null, // 'group' or 'record'
    targetData: null,
    longPressTimer: null
};

function showContextMenu(e, type, data) {
    e.preventDefault();
    e.stopPropagation();

    ContextMenuState.visible = true;
    ContextMenuState.targetType = type;
    ContextMenuState.targetData = data;

    UI.contextMenu.style.display = 'block';

    // Position menu
    let x = e.pageX || (e.touches ? e.touches[0].pageX : 0);
    let y = e.pageY || (e.touches ? e.touches[0].pageY : 0);

    // Constrain to screen
    const menuWidth = 120;
    if (x + menuWidth > window.innerWidth) x -= menuWidth;

    UI.contextMenu.style.left = x + 'px';
    UI.contextMenu.style.top = y + 'px';
}

function hideContextMenu() {
    ContextMenuState.visible = false;
    UI.contextMenu.style.display = 'none';
}

function handleManagementEvents(el, type, data) {
    // 1. Right Click (PC)
    el.oncontextmenu = (e) => showContextMenu(e, type, data);

    // 2. Long Press (Mobile)
    el.ontouchstart = (e) => {
        ContextMenuState.longPressTimer = setTimeout(() => {
            showContextMenu(e, type, data);
        }, 600);
    };
    el.ontouchend = () => {
        if (ContextMenuState.longPressTimer) clearTimeout(ContextMenuState.longPressTimer);
    };
    el.ontouchmove = () => {
        if (ContextMenuState.longPressTimer) clearTimeout(ContextMenuState.longPressTimer);
    };
}

function handleRename() {
    const { targetType, targetData } = ContextMenuState;
    if (!targetData) return;

    const oldName = targetType === 'group' ? targetData.name : targetData.name;
    const newName = prompt("请输入新名稱:", oldName);

    if (newName && newName.trim() !== "") {
        if (targetType === 'group') {
            const group = State.groups.find(g => g.id === targetData.id);
            if (group) group.name = newName.trim();
        } else {
            const record = State.records.find(r => r.id === targetData.id);
            if (record) record.name = newName.trim();
        }
        saveState();
        renderGroups();
    }
    hideContextMenu();
}

function handleDelete() {
    const { targetType, targetData } = ContextMenuState;
    if (!targetData) return;

    if (confirm(`确定要刪除 ${targetType === 'group' ? '群组' : '記錄'}: ${targetData.name} 吗？`)) {
        if (targetType === 'group') {
            // Delete the group
            State.groups = State.groups.filter(g => g.id !== targetData.id);
            // Delete records in this group (Delete = Delete)
            State.records = State.records.filter(r => r.groupId !== targetData.id);

            // Clean up lastUsedGroupId
            if (State.lastUsedGroupId === targetData.id) {
                State.lastUsedGroupId = State.groups.length > 0 ? State.groups[0].id : '';
            }
        } else {
            State.records = State.records.filter(r => r.id !== targetData.id);
        }
        saveState();
        renderGroups();
    }
    hideContextMenu();
}

// --- View Router ---
function switchView(viewId) {
    UI.views.forEach(v => v.classList.remove('active'));
    UI.navItems.forEach(item => item.classList.remove('active'));

    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');

    const targetNav = Array.from(UI.navItems).find(i => i.dataset.view === viewId);
    if (targetNav) targetNav.classList.add('active');
}

// --- Auth System (Disabled) ---
function checkAuth() {
    if (UI.bottomNav) {
        UI.bottomNav.style.display = 'flex';
    }
    switchView('view-main');
}

// --- Core Data Logic ---
function saveState() {
    localStorage.setItem('ziwi_groups', JSON.stringify(State.groups));
    localStorage.setItem('ziwi_records', JSON.stringify(State.records));
    localStorage.setItem('ziwi_collapsed_groups', JSON.stringify([...State.collapsedGroups]));
    localStorage.setItem('ziwi_last_used_group', State.lastUsedGroupId || '');
}

const TimePeriods = [
    { zhi: "子", label: "子时 (11pm-1am)" }, { zhi: "丑", label: "丑时 (1am-3am)" },
    { zhi: "寅", label: "寅时 (3am-5am)" }, { zhi: "卯", label: "卯时 (5am-7am)" },
    { zhi: "辰", label: "辰时 (7am-9am)" }, { zhi: "巳", label: "巳时 (9am-11am)" },
    { zhi: "午", label: "午时 (11am-1pm)" }, { zhi: "未", label: "未时 (1pm-3pm)" },
    { zhi: "申", label: "申时 (3pm-5pm)" }, { zhi: "酉", label: "酉时 (5pm-7pm)" },
    { zhi: "戌", label: "戌时 (7pm-9pm)" }, { zhi: "亥", label: "亥时 (9pm-11pm)" }
];

function initDropdowns() {
    for (let y = 1890; y <= 2150; y++) UI.gregYear.add(new Option(y + '年', y));
    for (let m = 1; m <= 12; m++) UI.gregMonth.add(new Option(m + '月', m));
    updateDaysDropdown();
    TimePeriods.forEach(tp => UI.gregTime.add(new Option(tp.label, tp.zhi)));
    [UI.gregYear, UI.gregMonth, UI.gregDay, UI.gregTime].forEach(el => {
        el.addEventListener('change', () => {
            if (el === UI.gregYear || el === UI.gregMonth) updateDaysDropdown();
            updateLunarDisplay();
        });
    });

    initRevBaziDropdowns();
}

function initRevBaziDropdowns() {
    const GAN = BaziUtils.GAN;
    const ZHI = BaziUtils.ZHI;

    const stems = [UI.revBaziInputs.yStem, UI.revBaziInputs.mStem, UI.revBaziInputs.dStem, UI.revBaziInputs.hStem];
    const branches = [UI.revBaziInputs.yBranch, UI.revBaziInputs.mBranch, UI.revBaziInputs.dBranch, UI.revBaziInputs.hBranch];

    const getHexColor = (char) => {
        const el = BaziUtils.ELEMENTS[char];
        if (el === '木') return '#6e943d';
        if (el === '火') return '#f06595';
        if (el === '土') return '#a67b51';
        if (el === '金') return '#fab041';
        if (el === '水') return '#1688b5';
        return '#1688b5';
    };

    stems.forEach(s => {
        s.add(new Option('-', ''));
        GAN.forEach(g => {
            const opt = new Option(g, g);
            opt.style.color = getHexColor(g);
            s.add(opt);
        });
        s.onchange = triggerBaziSearch;
    });

    branches.forEach(b => {
        b.add(new Option('-', ''));
        ZHI.forEach(z => {
            const opt = new Option(z, z);
            opt.style.color = getHexColor(z);
            b.add(opt);
        });
        b.onchange = triggerBaziSearch;
    });

    resetRevBaziInputs();
}

function resetRevBaziInputs() {
    Object.values(UI.revBaziInputs).forEach(s => {
        s.value = '';
        s.className = 'bazi-select default-color';
    });
    UI.revResultsContainer.innerHTML = '';
    UI.revResultsTitle.style.display = 'none';
}

function triggerBaziSearch(e) {
    // Update color of the changed select box
    if (e && e.target) {
        const char = e.target.value;
        e.target.className = 'bazi-select ' + (char ? getElementClass(char) : 'default-color');
    }

    const inputs = UI.revBaziInputs;
    const val = {
        ys: inputs.yStem.value, yb: inputs.yBranch.value,
        ms: inputs.mStem.value, mb: inputs.mBranch.value,
        ds: inputs.dStem.value, db: inputs.dBranch.value,
        hs: inputs.hStem.value, hb: inputs.hBranch.value
    };

    // Only search if all 8 are selected
    if (Object.values(val).every(v => v !== '')) {
        const matches = findDatesByBazi(val);
        renderRevResults(matches);
    } else {
        UI.revResultsContainer.innerHTML = '';
        UI.revResultsTitle.style.display = 'none';
    }
}

function findDatesByBazi(target) {
    const matches = [];
    const currentYear = 2026;
    
    // Range 1906 to currentYear (Limit to 120 years old)
    for (let y = 1906; y <= currentYear; y++) {
        for (let m = 1; m <= 12; m++) {
            const daysInMonth = new Date(y, m, 0).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                // Optimization: Pre-check Day Stem/Branch? 
                // calculatePillars is fast enough for 500k iterations? Let's check.
                // Actually 136 * 365 * 12 = 595,680.
                
                for (let hz of BaziUtils.ZHI) {
                    const bazi = BaziUtils.calculatePillars(y, m, d, hz);
                    if (bazi.year.stem === target.ys && bazi.year.branch === target.yb &&
                        bazi.month.stem === target.ms && bazi.month.branch === target.mb &&
                        bazi.day.stem === target.ds && bazi.day.branch === target.db &&
                        bazi.hour.stem === target.hs && bazi.hour.branch === target.hb) {
                        
                        const age = currentYear - y + 1;
                        if (age <= 120) {
                            matches.push({ y, m, d, hz });
                        }
                    }
                }
            }
        }
    }
    return matches;
}

function renderRevResults(matches) {
    UI.revResultsContainer.innerHTML = '';
    if (matches.length === 0) {
        UI.revResultsTitle.style.display = 'block';
        UI.revResultsTitle.textContent = '西曆選擇 (未找到匹配日期)';
        return;
    }

    UI.revResultsTitle.style.display = 'block';
    UI.revResultsTitle.textContent = '西曆選擇';

    const currentYear = 2026;

    matches.forEach(m => {
        const age = currentYear - m.y + 1;
        const btn = document.createElement('button');
        btn.className = 'rev-result-card';
        
        const targetZhi = m.hz;
        const timeLabel = TimePeriods.find(tp => tp.zhi === targetZhi)?.label.split(' ')[0] || targetZhi + '時';
        
        const shortTime = m.hz === '子' ? '11pm' : 
                         m.hz === '丑' ? '1am' :
                         m.hz === '寅' ? '3am' :
                         m.hz === '卯' ? '5am' :
                         m.hz === '辰' ? '7am' :
                         m.hz === '巳' ? '9am' :
                         m.hz === '午' ? '11am' :
                         m.hz === '未' ? '1pm' :
                         m.hz === '申' ? '3pm' :
                         m.hz === '酉' ? '5pm' :
                         m.hz === '戌' ? '7pm' : '9pm';

        btn.innerHTML = `<span class="rev-age-badge">${age}歲</span> ${m.y}年 ${m.m}月 ${m.d}日 ${shortTime}`;
        
        btn.onclick = () => {
            UI.gregYear.value = m.y;
            UI.gregMonth.value = m.m;
            updateDaysDropdown();
            UI.gregDay.value = m.d;
            UI.gregTime.value = targetZhi;
            updateLunarDisplay();
            
            // Scroll back up to the top of input panel
            document.querySelector('#view-input .view-content').scrollTo({ top: 0, behavior: 'smooth' });
        };
        
        UI.revResultsContainer.appendChild(btn);
    });
}

function updateDaysDropdown() {
    const y = parseInt(UI.gregYear.value);
    const m = parseInt(UI.gregMonth.value);
    const daysInMonth = new Date(y, m, 0).getDate() || 31;
    const currentDay = parseInt(UI.gregDay.value) || 1;
    UI.gregDay.innerHTML = '';
    for (let d = 1; d <= daysInMonth; d++) UI.gregDay.add(new Option(d + '日', d));
    if (currentDay <= daysInMonth) UI.gregDay.value = currentDay;
}

function updateLunarDisplay() {
    const y = parseInt(UI.gregYear.value);
    const m = parseInt(UI.gregMonth.value);
    const d = parseInt(UI.gregDay.value);
    const hourZhi = UI.gregTime.value;

    try {
        const bazi = BaziUtils.calculatePillars(y, m, d, hourZhi);
        const lunar = LunarTools.solar2lunar(y, m, d);

        const dateObj = new Date(y, m - 1, d);
        const dayOfWeek = dateObj.getDay();
        const dayNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

        let weekdayClass = 'wd-weekday';
        if (dayOfWeek === 0) weekdayClass = 'wd-sun';
        else if (dayOfWeek === 6) weekdayClass = 'wd-sat';

        UI.lunarDisplay.innerHTML = `
            <div class="lunar-date-row">${bazi.year.stem}${bazi.year.branch}年 ${lunar.lMonth}月 ${lunar.lDay}日 ${hourZhi}時</div>
            <div class="lunar-weekday-row ${weekdayClass}">${dayNames[dayOfWeek]} ${bazi.isYearTransition ? '<span style="color:red; margin-left:8px;">今日立春</span>' : ''}</div>
        `;
    } catch (e) {
        UI.lunarDisplay.textContent = '---';
    }
}

function resetToToday() {
    const today = new Date();
    if (today.getHours() === 23) {
        today.setDate(today.getDate() + 1);
    }
    
    UI.gregYear.value = today.getFullYear();
    UI.gregMonth.value = today.getMonth() + 1;
    updateDaysDropdown();
    UI.gregDay.value = today.getDate();
    let zhiIndex = Math.floor((today.getHours() + 1) / 2) % 12;
    let currentTimeZhi = TimePeriods[zhiIndex].zhi;
    UI.gregTime.value = currentTimeZhi;
    UI.userName.value = '未知';
    resetRevBaziInputs();
    updateLunarDisplay();
}

function renderGroups() {
    if (!UI.groupList) return;
    UI.groupList.innerHTML = '';

    State.groups.forEach(g => {
        const groupRecords = State.records.filter(r => r.groupId === g.id);
        const gWrapper = document.createElement('div');
        gWrapper.className = 'group-wrapper';
        const isCollapsed = State.collapsedGroups.has(g.id);
        const isActive = State.lastUsedGroupId === g.id;

        const gHeader = document.createElement('div');
        gHeader.className = `group-header ${isCollapsed ? 'collapsed' : ''}`;
        gHeader.innerHTML = `<span class="group-radio-dot ${isActive ? 'active' : ''}"></span> 📂 ${g.name}`;

        gHeader.onclick = (e) => {
            if (e.target.classList.contains('group-radio-dot')) {
                State.lastUsedGroupId = g.id;
                saveState(); renderGroups();
                return;
            }
            if (State.collapsedGroups.has(g.id)) State.collapsedGroups.delete(g.id);
            else State.collapsedGroups.add(g.id);
            saveState(); renderGroups();
        };

        gWrapper.appendChild(gHeader);
        handleManagementEvents(gHeader, 'group', g);

        if (!isCollapsed) {
            groupRecords.forEach(r => {
                const rDiv = document.createElement('div');
                rDiv.className = `record-item ${State.currentActiveRecord?.id === r.id ? 'active' : ''}`;
                const genderTag = r.gender === 'M' ? '<span class="gender-m">(男)</span>' : '<span class="gender-f">(女)</span>';


                rDiv.innerHTML = `
                    <div class="record-info">
                        <div class="name-row">📄 ${r.name} ${genderTag}</div>
                        <div class="date-row">${r.gregYear}年${r.gregMonth}月${r.gregDay}日 ${r.gregTime}時</div>
                    </div>
                `;
                rDiv.onclick = () => {
                    switchView('view-main');
                    setTimeout(() => renderMainBoard(r), 60);
                };
                handleManagementEvents(rDiv, 'record', r);
                gWrapper.appendChild(rDiv);
            });
        }
        UI.groupList.appendChild(gWrapper);
    });
}

UI.addGroupBtn.onclick = () => {
    const name = prompt("请输入新群组名稱:");
    if (name) {
        State.groups.push({ id: 'g_' + Date.now(), name: name });
        saveState();
        renderGroups();
    }
};

// --- Rendering Logic (Qi Men Dun Jia Edition) ---
function getElemColorClass(elem) {
    const map = { "木": "color-wood", "火": "color-fire", "土": "color-earth", "金": "color-metal", "水": "color-water" };
    return map[elem] || "";
}

function renderMainBoard(record) {
    if (!record) return;
    State.currentActiveRecord = record;

    let qimenData;
    try {
        const now = new Date();
        const y = parseInt(record.gregYear) || now.getFullYear();
        const m = parseInt(record.gregMonth) || (now.getMonth() + 1);
        const d = parseInt(record.gregDay) || now.getDate();

        // 转换小時文本到数字 (如 "未" -> 13)
        const hourZhiMap = { "子": 0, "丑": 1, "寅": 3, "卯": 5, "辰": 7, "巳": 9, "午": 11, "未": 13, "申": 15, "酉": 17, "戌": 19, "亥": 21 };
        let hourZhi = record.gregTime || "子";
        const h = hourZhiMap[hourZhi] !== undefined ? hourZhiMap[hourZhi] : 0;
        const juOverride = document.getElementById("juOverride") ? document.getElementById("juOverride").value : "auto";

        let baziY = y;
        let baziM = m;
        let baziD = d;

        // 处理晚子时（23:00-23:59）：偷偷将四柱排盘日期加一天，但UI西历保留原日期
        let isLateZi = false;
        if (hourZhi === "子") {
            if (record.realHour !== undefined && record.realHour >= 23) {
                isLateZi = true;
            } else if (y === now.getFullYear() && m === (now.getMonth() + 1) && d === now.getDate() && now.getHours() >= 23) {
                isLateZi = true;
            }
        }

        if (isLateZi) {
            let nextDay = new Date(y, m - 1, d + 1);
            baziY = nextDay.getFullYear();
            baziM = nextDay.getMonth() + 1;
            baziD = nextDay.getDate();
        }

        qimenData = QimenEngine.buildChart({
            year: baziY,
            month: baziM,
            day: baziD,
            hour: h,
            minute: 0,
            name: record.name || "未知",
            gender: record.gender || "M"
        });
    } catch (e) {
        console.error("Qimen calculation error:", e);
        return;
    }

    // 1. 更新四柱 (時 日 月 年)
    const { pillars } = qimenData;

    const updatePillarUI = (prefix, pillarData) => {
        if (!pillarData) return;
        const sEl = document.getElementById(`qm-${prefix}-stem`);
        const bEl = document.getElementById(`qm-${prefix}-branch`);
        const cEl = document.getElementById(`qm-${prefix}-cang`);
        if (sEl) {
            sEl.textContent = pillarData.stem || '甲';
            sEl.className = 'qimen-stem ' + getElemColorClass(BaziUtils.ELEMENTS[pillarData.stem]);
        }
        if (bEl) {
            bEl.textContent = pillarData.branch || '子';
            bEl.className = 'qimen-branch ' + getElemColorClass(BaziUtils.ELEMENTS[pillarData.branch]);
        }
        if (cEl) {
            cEl.textContent = pillarData.cang || '';
        }
    };

    updatePillarUI('h', pillars.hour);
    updatePillarUI('d', pillars.day);
    updatePillarUI('m', pillars.month);
    updatePillarUI('y', pillars.year);

    // 2. 同步与更新 Header 西曆/時间/格局三框控制
    syncQimenHeaderSelects(record);

    const gejuEl = document.getElementById('qm-geju-text');
    if (gejuEl) gejuEl.textContent = qimenData.geJuText || '局勢平穩';

    // 3. 渲染奇門九宫格 3x3 矩陣 (按照洛书方位分布)
    // 布局序列：4(巽), 9(离), 2(坤), 3(震), 5(中), 7(兑), 8(艮), 1(坎), 6(乾)
    const matrixPalaces = [4, 9, 2, 3, 5, 7, 8, 1, 6];
    const gridContainer = document.getElementById('qimen-grid-matrix');

    if (gridContainer) {
        gridContainer.innerHTML = '';

        matrixPalaces.forEach(pNum => {
            const pData = (qimenData && qimenData.palaces) ? qimenData.palaces[pNum] : null;
            if (!pData) return;
            const cell = document.createElement('div');
            cell.className = 'qimen-cell';
            cell.setAttribute('data-palace', pNum);

            // 如果是 5 宫 (寄坤2宫)
            if (pNum === 5) {
                const tStemColor = getElemColorClass(BaziUtils.ELEMENTS[pData.tStem] || 'earth');
                const dStemColor = getElemColorClass(BaziUtils.ELEMENTS[pData.dStem] || 'earth');
                
                cell.innerHTML = `
                    <div class="qimen-cell-top">
                        <span class="qimen-palace-name color-earth">坤</span>
                        <span class="qimen-cell-tag color-earth" style="line-height: 1.1; text-align: center;">寄<br>天<br>芮</span>
                    </div>
                    <div class="qimen-tstem-row ${tStemColor}">
                        ${(pData.isJiXing || pData.isRuMu) ? `
                            <div class="qimen-tstem-tags-stack">
                                ${pData.isJiXing ? `<span class="qimen-jixing-tag ${!pData.isRuMu ? 'single' : ''}">刑</span>` : ''}
                                ${pData.isRuMu ? `<span class="qimen-rumu-tag ${!pData.isJiXing ? 'single' : ''}">墓</span>` : ''}
                            </div>
                        ` : ''}
                        <span>${pData.tStem || '戊'}</span>
                    </div>
                    <div class="qimen-door-box-wrap">
                        <div class="qimen-door-square color-earth">時</div>
                    </div>
                    <div class="qimen-dstem-row">
                        <div class="qimen-dstem-wrap">
                            <span class="${dStemColor}">${pData.dStem || '戊'}</span>
                            <span class="qimen-energy-symbol ${dStemColor} ${pData.energySymbol === '○' ? 'circle-small' : 'circle-large'}">${pData.energySymbol}</span>
                        </div>
                    </div>
                    <div class="qimen-star-left color-earth"><span>天</span><span>禽</span></div>
                    <div class="qimen-zhan-text">和戰</div>
                    <div class="qimen-num-bottomright">${pData.ziBai}</div>
                `;
            } else {
                const tStemColor = getElemColorClass(BaziUtils.ELEMENTS[pData.tStem]);
                const dStemColor = getElemColorClass(BaziUtils.ELEMENTS[pData.dStem]);
                const doorColor = getElemColorClass(pData.doorElem);
                const starColor = getElemColorClass(pData.starElem);
                const palaceColor = getElemColorClass(pData.element);

                // 拆分九星/八門两字竖排
                const starStr = pData.star || '';
                const starChars = starStr.split('');
                const starHtml = starChars.map(c => `<span>${c}</span>`).join('');

                const godStr = pData.god || '';
                const godChars = godStr.split('');
                const godHtml = godChars.map(c => `<span>${c}</span>`).join('');

                // 戰格文字
                const zhanHtml = pData.zhan ? `<div class="qimen-zhan-text">${pData.zhan}</div>` : '';

                // 吉凶角标
                const badgeHtml = pData.badges && pData.badges.length > 0
                    ? `<div class="qimen-badge-stack">${pData.badges.map(b => `<span class="qimen-badge-item">${b}</span>`).join('')}</div>`
                    : '';

                cell.innerHTML = `
                    ${pData.isInnerPlate ? '<div class="qimen-inner-triangle"></div>' : ''}
                    <div class="qimen-cell-top">
                        <span class="qimen-palace-name ${palaceColor}">${pData.name}</span>
                        ${pData.extraTag ? `<span class="qimen-cell-tag">${pData.extraTag}</span>` : ''}
                    </div>
                    <div class="qimen-tstem-row ${tStemColor}">
                        ${pData.parasiteStem ? `<span class="qimen-parasite-stem-inline ${(pData.isJiXing || pData.isRuMu) ? 'shifted' : ''} ${getElemColorClass(BaziUtils.ELEMENTS[pData.parasiteStem])}">${pData.parasiteStem}</span>` : ''}
                        ${(pData.isJiXing || pData.isRuMu) ? `
                            <div class="qimen-tstem-tags-stack">
                                ${pData.isJiXing ? `<span class="qimen-jixing-tag ${!pData.isRuMu ? 'single' : ''}">刑</span>` : ''}
                                ${pData.isRuMu ? `<span class="qimen-rumu-tag ${!pData.isJiXing ? 'single' : ''}">墓</span>` : ''}
                            </div>
                        ` : ''}
                        <span>${pData.tStem}</span>
                    </div>
                    <div class="qimen-door-box-wrap">
                        <div class="qimen-door-square ${doorColor}">
                            ${pData.door}
                            ${pData.isMenPo ? '<span class="qimen-menpo-inner-tag">迫</span>' : ''}
                        </div>
                    </div>
                    <div class="qimen-dstem-row">
                        <div class="qimen-dstem-wrap">
                            <span class="${dStemColor}">${pData.dStem}</span>
                            <span class="qimen-energy-symbol ${dStemColor} ${pData.energySymbol === '○' ? 'circle-small' : 'circle-large'}">${pData.energySymbol}</span>
                        </div>
                    </div>
                    <div class="qimen-star-left ${starColor}">${starHtml}</div>
                    ${pData.parasiteStar ? `<div class="qimen-parasite-star">${pData.parasiteStar.split('').map(c => `<span class="qimen-star-char">${c}</span>`).join('')}</div>` : ''}
                    <div class="qimen-god-right">${godHtml}</div>
                    ${zhanHtml}
                    ${badgeHtml}
                    <div class="qimen-num-bottomright">${pData.ziBai}</div>
                `;
            }

            // 绑定点击详情（用户要求移除点击弹窗功能）
            // cell.onclick = () => {
            //     showPalaceModal(pData);
            // };

            gridContainer.appendChild(cell);
        });
    }

    // 4. 绑定与加载記事本内容
    const notesInput = document.getElementById('qimen-notes-input');
    if (notesInput) {
        notesInput.value = record.notes || '';
        notesInput.dispatchEvent(new Event('input'));
        notesInput.oninput = () => {
            record.notes = notesInput.value;
            const rec = State.records.find(r => r.id === record.id);
            if (rec) rec.notes = notesInput.value;
            saveState();
        };
    }
}

// 弹窗展示宫位詳解
function showPalaceModal(pData) {
    const mask = document.getElementById('qimen-modal-mask');
    const title = document.getElementById('qimen-modal-title');
    const body = document.getElementById('qimen-modal-body');
    const closeBtn = document.getElementById('qimen-modal-close');

    if (!mask || !title || !body) return;

    title.textContent = `${pData.name}宫 (${pData.direction}·${pData.element} - 洛书${pData.num}宫)`;

    body.innerHTML = `
        <div style="margin-bottom:8px;"><strong>天盘奇仪：</strong><span class="${getElemColorClass(BaziUtils.ELEMENTS[pData.tStem])}">${pData.tStem}</span></div>
        <div style="margin-bottom:8px;"><strong>地盘奇仪：</strong><span class="${getElemColorClass(BaziUtils.ELEMENTS[pData.dStem])}">${pData.dStem}</span></div>
        <div style="margin-bottom:8px;"><strong>落宮九星：</strong>${pData.star} (${pData.starElem})</div>
        <div style="margin-bottom:8px;"><strong>落宮八門：</strong>${pData.door} (${pData.doorElem})</div>
        <div style="margin-bottom:8px;"><strong>八神加臨：</strong>${pData.god}</div>
        <div style="margin-bottom:8px;"><strong>門宫戰格：</strong>${pData.zhan || '和戰'}</div>
        <div style="margin-bottom:8px;"><strong>神煞标示：</strong>${pData.extraTag || '無'}</div>
        <div style="margin-bottom:8px;"><strong>格局与克應：</strong>${pData.badges && pData.badges.length > 0 ? pData.badges.join('、') : '平穩'}</div>
    `;

    mask.style.display = 'flex';

    if (closeBtn) {
        closeBtn.onclick = () => { mask.style.display = 'none'; };
    }
    mask.onclick = (e) => {
        if (e.target === mask) mask.style.display = 'none';
    };
}



function renderFiveElementsChart(scores, dayStem) {
    const container = document.getElementById('bazi-elements-chart');
    if (!container) return;
    container.innerHTML = '';

    const selfElement = BaziUtils.ELEMENTS[dayStem];
    const elementsOrder = ['土', '金', '水', '木', '火']; // Generation clockwise loop
    // Re-order to start from Self
    const selfBaseIdx = elementsOrder.indexOf(selfElement);
    const displayOrder = [];
    for (let i = 0; i < 5; i++) {
        displayOrder.push(elementsOrder[(selfBaseIdx + i) % 5]);
    }

    const elementToGods = {
        '木': ['甲', '乙'], '火': ['丙', '丁'], '土': ['戊', '己'],
        '金': ['庚', '辛'], '水': ['壬', '癸']
    };

    const chartWidth = 175;
    const chartHeight = 150;
    const centerX = chartWidth / 2;
    const centerY = chartHeight / 2;
    const r = 36; // Proportional doughnut radius
    const selfScore = scores[selfElement];

    // Logic: Center the Self element at Top (-90 deg)
    let currentAngle = -90 - (selfScore / 2);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", chartWidth);
    svg.setAttribute("height", chartHeight);
    svg.setAttribute("viewBox", `0 0 ${chartWidth} ${chartHeight}`);
    svg.classList.add("chart-svg");

    const labelsLayer = document.createElement('div');
    labelsLayer.className = 'chart-labels-layer';

    const getPoint = (angle, radius) => {
        const rad = (angle * Math.PI) / 180;
        return {
            x: centerX + radius * Math.cos(rad),
            y: centerY + radius * Math.sin(rad)
        };
    };

    // Background Circle
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bg.setAttribute("cx", centerX); bg.setAttribute("cy", centerY);
    bg.setAttribute("r", r); bg.classList.add("chart-bg-circle");
    svg.appendChild(bg);

    // Elegant Double-Line Inner Borders
    const lb1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    lb1.setAttribute("cx", centerX); lb1.setAttribute("cy", centerY);
    lb1.setAttribute("r", r - 6); lb1.classList.add("chart-inner-border");
    svg.appendChild(lb1);

    const lb2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    lb2.setAttribute("cx", centerX); lb2.setAttribute("cy", centerY);
    lb2.setAttribute("r", r - 8); lb2.classList.add("chart-inner-border");
    svg.appendChild(lb2);

    // 1. Calculate each slice's ideal center angle
    const slices = [];
    let tempAngle = currentAngle;
    displayOrder.forEach((el, i) => {
        const score = scores[el];
        slices.push({
            el: el,
            targetMid: tempAngle + (score / 2),
            score: score
        });
        tempAngle += score;
    });

    // 2. 2D Centroid Physics Engine (方格重心物理引擎)
    const boxW = 56, boxH = 30; // Virtual bounding box per label
    const boxes = slices.map((s, i) => {
        const rad = (s.targetMid * Math.PI) / 180;
        const initialR = r + 16; // Start very close
        return {
            x: centerX + initialR * Math.cos(rad),
            y: centerY + initialR * Math.sin(rad),
            angle: s.targetMid,
            isSelf: i === 0
        };
    });

    for (let iter = 0; iter < 100; iter++) { // 100 iterations for rock-solid stability
        boxes.forEach((b1, i) => {
            const rad = Math.atan2(b1.y - centerY, b1.x - centerX);
            const cosA = Math.abs(Math.cos(rad));
            const sinA = Math.abs(Math.sin(rad));

            // DYNAMIC SAFETY RADIUS (方格对角线防撞)
            const halfBoxRadial = cosA * (boxW / 2) + sinA * (boxH / 2);
            const minAllowed = r + halfBoxRadial + 6;

            // A. Attraction: Pull toward Cake Center (贴合大圆轨道)
            const dist = Math.sqrt((b1.x - centerX) ** 2 + (b1.y - centerY) ** 2);
            const targetR = minAllowed + 1;
            const attraction = (dist - targetR) * 0.2;
            const dirX = (b1.x - centerX) / dist;
            const dirY = (b1.y - centerY) / dist;
            b1.x -= dirX * attraction;
            b1.y -= dirY * attraction;

            // B. Spring: Pull toward ideal angle
            let aDiff = rad - (b1.angle * Math.PI) / 180;
            while (aDiff > Math.PI) aDiff -= Math.PI * 2;
            while (aDiff < -Math.PI) aDiff += Math.PI * 2;
            const sForce = 0.12; // Increased for tighter alignment
            const currentDist = Math.sqrt((b1.x - centerX) ** 2 + (b1.y - centerY) ** 2);
            const newAngle = rad - aDiff * sForce;
            b1.x = centerX + currentDist * Math.cos(newAngle);
            b1.y = centerY + currentDist * Math.sin(newAngle);

            // C. Collision: Push apart from other boxes
            for (let j = i + 1; j < boxes.length; j++) {
                const b2 = boxes[j];
                const dx = b1.x - b2.x;
                const dy = b1.y - b2.y;
                const minDX = boxW + 4;
                const minDY = boxH + 2;
                if (Math.abs(dx) < minDX && Math.abs(dy) < minDY) {
                    const ox = minDX - Math.abs(dx);
                    const oy = minDY - Math.abs(dy);
                    if (ox < oy) {
                        const push = (dx > 0 ? 1 : -1) * ox * 0.5;
                        b1.x += push; b2.x -= push;
                    } else {
                        const push = (dy > 0 ? 1 : -1) * oy * 0.5;
                        b1.y += push; b2.y -= push;
                    }
                }
            }

            // D. Cake Constraint: HARD Inner Barrier
            const dInner = Math.sqrt((b1.x - centerX) ** 2 + (b1.y - centerY) ** 2);
            if (dInner < minAllowed) {
                const ratio = minAllowed / dInner;
                b1.x = centerX + (b1.x - centerX) * ratio;
                b1.y = centerY + (b1.y - centerY) * ratio;
            }

            // E. Containment Walls (防出界“硬围墙”)
            // Card boundaries (175x150 relative to chart area)
            // Top Wall: prevent clipping at the card header
            if (b1.y < 18) b1.y = 18;
            // Right Wall: prevent clipping at phone edge
            if (b1.x > 168) b1.x = 168;
            // Bottom Wall
            if (b1.y > 135) b1.y = 135;

            // F. Anchor Self strictly to the Top
            if (b1.isSelf) {
                b1.x = centerX + (b1.x - centerX) * 0.05;
                if (b1.y > centerY - minAllowed) b1.y = centerY - minAllowed;
            }
        });
    }

    // 3. Render slices and place labels
    let tempSumAngle = currentAngle;
    displayOrder.forEach((el, i) => {
        const score = scores[el];
        const box = boxes[i];
        const start = getPoint(tempSumAngle, r);
        const end = getPoint(tempSumAngle + score, r);
        const d = `M ${start.x} ${start.y} A ${r} ${r} 0 ${score <= 180 ? 0 : 1} 1 ${end.x} ${end.y}`;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.classList.add("chart-inner-ring", "stroke-" + getElementClassFromText(el));
        svg.appendChild(path);
        tempSumAngle += score;

        const labelDiv = document.createElement('div');
        labelDiv.className = `element-label el-${getElementClassFromText(el)}`;
        labelDiv.style.left = `${box.x - (boxW / 2)}px`;
        labelDiv.style.top = `${box.y - (boxH / 2)}px`;
        labelDiv.style.width = `${boxW}px`;

        const relX = box.x - centerX;
        const relY = box.y - centerY;
        let textAlign = (Math.abs(relX) < 15 && relY < 0) ? 'center' : (relX >= 0 ? 'left' : 'right');

        // FIXED TEN GOD ORDER LOGIC (强制统一行规)
        const stems = elementToGods[el];
        let g1 = BaziUtils.getTenGod(dayStem, stems[0]);
        let g2 = BaziUtils.getTenGod(dayStem, stems[1]);
        const ROW1_TYPES = ['劫财', '傷官', '正财', '正官', '正印'];
        if (ROW1_TYPES.includes(g2) && !ROW1_TYPES.includes(g1)) {
            [g1, g2] = [g2, g1];
        }

        labelDiv.innerHTML = `
            <div class="text-group" style="text-align: ${textAlign}">
                <div class="god-row">
                    <span class="god-name">${g1}</span>
                    <div class="chart-color-box bg-${getElementClassFromText(el)}"></div>
                </div>
                <div class="god-row">
                    <span class="god-name">${g2}</span>
                    <span class="score-text">${score}</span>
                </div>
            </div>
        `;
        labelsLayer.appendChild(labelDiv);
    });

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", centerX); text.setAttribute("y", centerY);
    text.classList.add("chart-center-text", "fill-" + getElementClassFromText(selfElement));
    text.textContent = dayStem + selfElement;
    svg.appendChild(text);

    container.appendChild(svg); container.appendChild(labelsLayer);
}

function getElementClassFromText(el) {
    if (el === '木') return 'wood';
    if (el === '火') return 'fire';
    if (el === '土') return 'earth';
    if (el === '金') return 'metal';
    if (el === '水') return 'water';
    return '';
}

function getElementClass(char) {
    const el = BaziUtils.ELEMENTS[char];
    if (el === '木') return 'wood';
    if (el === '火') return 'fire';
    if (el === '土') return 'earth';
    if (el === '金') return 'metal';
    if (el === '水') return 'water';
    return '';
}

function renderLuckCycles(record, bazi) {
    const luckList = document.getElementById('luck-list');
    if (!luckList) return;
    luckList.innerHTML = '';

    const luckResult = BaziUtils.calculateGreatLuck(
        record.gender,
        bazi.year.stem, bazi.month.stem, bazi.month.branch,
        parseInt(record.gregYear), parseInt(record.gregMonth), parseInt(record.gregDay)
    );

    const actualCurrentYear = 2026;
    const currentAge2026 = actualCurrentYear - parseInt(record.gregYear) + 1;
    const actualActiveLuckIndex = luckResult.cycles.findIndex(lc => currentAge2026 >= lc.age && currentAge2026 < lc.age + 10);

    // Browsing focus
    let luckIndexToUse = State.browsingLuckIndex;
    if (luckIndexToUse === -1) {
        const browsingAge = State.browsingYear - parseInt(record.gregYear) + 1;
        luckIndexToUse = luckResult.cycles.findIndex(lc => browsingAge >= lc.age && browsingAge < lc.age + 10);
    }

    luckResult.cycles.forEach((luck, idx) => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'luck-item-wrapper';

        const isActualCurrent = idx === actualActiveLuckIndex;
        const isBrowsingFocus = idx === luckIndexToUse;
        const isBrowsingMode = !isActualCurrent || State.browsingLuckIndex !== -1;

        let highlightClass = '';
        if (isBrowsingFocus) {
            highlightClass = isActualCurrent ? 'active-fire' : 'active-water';
        }
        // If it isActualCurrent but NOT isBrowsingFocus, it stays empty (disappears as requested)

        itemWrapper.innerHTML = `
            <div class="luck-info-age ${luck.age >= 100 ? 'age-mini' : ''}">${luck.age}歲</div>
            <div class="luck-info-year">${luck.year}</div>
            <div class="luck-box ${highlightClass}">
                <div class="luck-god-mini ${getElementClass(luck.stem)}">${luck.stemGod}</div>
                <div class="luck-char-main ${getElementClass(luck.stem)}">${luck.stem}</div>
                <div class="luck-char-main ${getElementClass(luck.branch)}">${luck.branch}</div>
                <div class="luck-god-mini ${getElementClass(luck.branch)}">${luck.branchGod}</div>
            </div>
        `;

        itemWrapper.onclick = () => {
            State.browsingYear = luck.year;
            State.browsingLuckIndex = idx;
            renderMainBoard(record);
        };

        luckList.appendChild(itemWrapper);
    });
}

function renderAnnualLuck(record, bazi) {
    const annualList = document.getElementById('annual-list');
    if (!annualList) return;
    annualList.innerHTML = '';

    // Determine the start year based on the selected Great Luck
    const luckResult = BaziUtils.calculateGreatLuck(
        record.gender,
        bazi.year.stem, bazi.month.stem, bazi.month.branch,
        parseInt(record.gregYear), parseInt(record.gregMonth), parseInt(record.gregDay)
    );

    let luckIndexToUse = State.browsingLuckIndex;
    if (luckIndexToUse === -1) {
        const browsingAge = State.browsingYear - parseInt(record.gregYear) + 1;
        luckIndexToUse = luckResult.cycles.findIndex(lc => browsingAge >= lc.age && browsingAge < lc.age + 10);
    }
    const startYear = luckResult.cycles[luckIndexToUse]?.year || 2026;

    const annualResults = BaziUtils.calculateAnnualLuck(
        bazi.day.stem,
        startYear,
        10,
        parseInt(record.gregYear)
    );

    annualResults.forEach((yearLuck) => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'luck-item-wrapper';

        const isActualCurrentYear = yearLuck.year === 2026;
        const isBrowsingYear = yearLuck.year === State.browsingYear;

        let highlightClass = '';
        if (isBrowsingYear) {
            highlightClass = isActualCurrentYear ? 'active-fire' : 'active-water';
        }
        // If isActualCurrentYear but NOT isBrowsingYear, it stays empty

        itemWrapper.innerHTML = `
            <div class="luck-info-year">${yearLuck.year}</div>
            <div class="luck-box ${highlightClass}">
                <div class="luck-god-mini ${getElementClass(yearLuck.stem)}">${yearLuck.stemGod}</div>
                <div class="luck-char-main ${getElementClass(yearLuck.stem)}">${yearLuck.stem}</div>
                <div class="luck-char-main ${getElementClass(yearLuck.branch)}">${yearLuck.branch}</div>
                <div class="luck-god-mini ${getElementClass(yearLuck.branch)}">${yearLuck.branchGod}</div>
            </div>
        `;

        itemWrapper.onclick = () => {
            State.browsingYear = yearLuck.year;
            // BrowsingLuckIndex remains the same as we are in the same 10-year cycle
            renderMainBoard(record);
        };

        annualList.appendChild(itemWrapper);
    });
}

function renderMonthlyLuck(record, bazi) {
    const monthlyList = document.getElementById('monthly-list');
    if (!monthlyList) return;
    monthlyList.innerHTML = '';

    // Calculate current real-time BaZi month for comparison
    const now = new Date();
    const currentPillars = BaziUtils.calculatePillars(now.getFullYear(), now.getMonth() + 1, now.getDate(), "子");
    const currentMonthGz = currentPillars.month.stem + currentPillars.month.branch;
    const isCurrentYear = State.browsingYear === now.getFullYear();

    // Calculate month pillars for the currently browsed year
    const yearGz = BaziUtils.getYearGanZhi(State.browsingYear);
    const months = BaziUtils.calculateMonthlyLuck(bazi.day.stem, yearGz.stem);

    months.forEach((m) => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'luck-item-wrapper';

        const isNowMonth = isCurrentYear && (m.stem + m.branch === currentMonthGz);
        const isBrowsingMonth = (m.index === State.browsingMonthIndex);

        let highlightClass = '';
        if (isBrowsingMonth) {
            highlightClass = 'active-water';
        } else if (isNowMonth && State.browsingMonthIndex === -1) {
            highlightClass = 'active-fire';
        }

        let monthNameStr = m.index <= 10 ? ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][m.index - 1] + '月' : m.index + '月';

        itemWrapper.innerHTML = `
            <div class="luck-info-age">${monthNameStr}</div>
            <div class="luck-box ${highlightClass}">
                <div class="luck-god-mini ${getElementClass(m.stem)}">${m.stemGod}</div>
                <div class="luck-char-main ${getElementClass(m.stem)}">${m.stem}</div>
                <div class="luck-char-main ${getElementClass(m.branch)}">${m.branch}</div>
                <div class="luck-god-mini ${getElementClass(m.branch)}">${m.branchGod}</div>
            </div>
        `;

        itemWrapper.onclick = () => {
            State.browsingMonthIndex = m.index;
            renderMainBoard(record);
        };

        monthlyList.appendChild(itemWrapper);
    });
}

function renderSolarTerms(record, bazi) {
    const solarList = document.getElementById('solar-list');
    if (!solarList) return;
    solarList.innerHTML = '';

    const now = new Date();
    const isBrowsingCurrentYear = State.browsingYear === now.getFullYear();

    // Detect the current real-time solar term index (0-23)
    let currentTermIdx = -1;
    if (isBrowsingCurrentYear || State.browsingYear === now.getFullYear() - 1) {
        // We check the terms of the currently ACTIVE BaZi year
        const baZiYear = State.browsingYear;
        for (let i = 23; i >= 0; i--) {
            let ty = baZiYear;
            if (i >= 22) ty += 1; // High index terms are in Jan of NEXT year
            const d = BaziUtils.getSolarTermDay(ty, i);
            const m = BaziUtils.getSolarTermMonth(i);
            const termDate = new Date(ty, m - 1, d);
            if (now >= termDate) {
                // If we are browsing the year that contains 'now'
                if (baZiYear === now.getFullYear() || (baZiYear === now.getFullYear() - 1 && i >= 22)) {
                    currentTermIdx = i;
                    break;
                }
            }
        }
    }

    for (let c = 0; c < 12; c++) {
        const pairDiv = document.createElement('div');
        pairDiv.className = 'solar-pair';

        for (let j = 0; j < 2; j++) {
            const i = c * 2 + j;
            const name = BaziUtils.SOLAR_TERMS[i];

            const item = document.createElement('div');
            item.className = 'solar-item';

            let seasonClass = '';
            if (i < 6) seasonClass = 'color-spring';
            else if (i < 12) seasonClass = 'color-summer';
            else if (i < 18) seasonClass = 'color-autumn';
            else seasonClass = 'color-winter';

            // BaZi year starting in 'browsingYear' (Feb) ends in 'browsingYear + 1' (Jan)
            let targetYear = State.browsingYear;
            if (i >= 22) targetYear += 1;

            const day = BaziUtils.getSolarTermDay(targetYear, i);
            const month = BaziUtils.getSolarTermMonth(i);

            const isActive = isBrowsingCurrentYear && i === currentTermIdx;
            const activeClass = isActive ? 'active-solar-fire' : '';

            const monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const displayMonth = month > 12 ? month - 12 : month;
            const monthAbbr = monthAbbrs[displayMonth - 1];

            item.innerHTML = `
                <div class="solar-name-box ${seasonClass} ${activeClass}">${name}</div>
                <div class="solar-date"><span class="solar-day">${day}</span><span class="solar-mon">${monthAbbr}</span></div>

            `;


            pairDiv.appendChild(item);
        }
        solarList.appendChild(pairDiv);
    }
}



// --- Qimen Header Control Logic ---
const monthAbbrs = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function initQimenHeaderControls() {
    const sYear = document.getElementById('qm-select-year');
    const sMonth = document.getElementById('qm-select-month');
    const sDay = document.getElementById('qm-select-day');
    const sTime = document.getElementById('qm-select-time');
    const btnKaipan = document.getElementById('qm-btn-kaipan');

    if (!sYear || !sMonth || !sDay || !sTime) return;

    // 填充年份 1890 ~ 2150
    let yearOpts = '';
    for (let y = 1890; y <= 2150; y++) {
        yearOpts += `<option value="${y}">${y}</option>`;
    }
    sYear.innerHTML = yearOpts;

    // 填充月份
    let monthOpts = '';
    for (let m = 1; m <= 12; m++) {
        monthOpts += `<option value="${m}">${m} ${monthAbbrs[m - 1]}</option>`;
    }
    sMonth.innerHTML = monthOpts;

    // 联动更新日
    const updateDays = () => {
        const y = parseInt(sYear.value) || 2026;
        const m = parseInt(sMonth.value) || 7;
        const daysInMonth = new Date(y, m, 0).getDate() || 31;
        const curDay = parseInt(sDay.value) || 1;
        let dayOpts = '';
        for (let d = 1; d <= daysInMonth; d++) {
            dayOpts += `<option value="${d}">${d}</option>`;
        }
        sDay.innerHTML = dayOpts;
        if (curDay <= daysInMonth) sDay.value = curDay;
    };

    const markDirty = () => {
        if (btnKaipan) btnKaipan.classList.add('dirty-state');
    };

    sYear.addEventListener('change', updateDays);
    sMonth.addEventListener('change', updateDays);
    
    sYear.addEventListener('change', markDirty);
    sMonth.addEventListener('change', markDirty);
    sDay.addEventListener('change', markDirty);
    sTime.addEventListener('change', markDirty);

    updateDays();

    // 填充時间時辰列表
    let timeOpts = '';
    TimePeriods.forEach(tp => {
        timeOpts += `<option value="${tp.zhi}">${tp.label}</option>`;
    });
    sTime.innerHTML = timeOpts;

    // 绑定【開盘】按钮逻辑
    if (btnKaipan) {
        btnKaipan.onclick = () => {
            btnKaipan.classList.remove('dirty-state');
            const y = sYear.value;
            const m = sMonth.value;
            const d = sDay.value;
            const t = sTime.value;

            const updatedRecord = {
                id: State.currentActiveRecord ? State.currentActiveRecord.id : ('r_' + Date.now()),
                name: State.currentActiveRecord ? State.currentActiveRecord.name : '即時開盘',
                gregYear: y,
                gregMonth: m,
                gregDay: d,
                gregTime: t,
                gender: State.currentActiveRecord ? State.currentActiveRecord.gender : 'M',
                notes: State.currentActiveRecord ? State.currentActiveRecord.notes : ''
            };

            // 重新调用排盤渲染
            renderMainBoard(updatedRecord);
        };
    }
}

function syncQimenHeaderSelects(record) {
    const sYear = document.getElementById('qm-select-year');
    const sMonth = document.getElementById('qm-select-month');
    const sDay = document.getElementById('qm-select-day');
    const sTime = document.getElementById('qm-select-time');

    if (!sYear || !sMonth || !sDay || !sTime) return;

    if (record.gregYear) sYear.value = record.gregYear;
    if (record.gregMonth) sMonth.value = record.gregMonth;

    // 触發 days 更新
    const y = parseInt(sYear.value) || 2026;
    const m = parseInt(sMonth.value) || 7;
    const daysInMonth = new Date(y, m, 0).getDate() || 31;
    let dayOpts = '';
    for (let d = 1; d <= daysInMonth; d++) {
        dayOpts += `<option value="${d}">${d}</option>`;
    }
    sDay.innerHTML = dayOpts;

    if (record.gregDay) sDay.value = record.gregDay;
    if (record.gregTime) {
        sTime.value = record.gregTime;
    }
    const sJu = document.getElementById('juOverride');
    if (sJu && record.juOverride) {
        sJu.value = record.juOverride;
    } else if (sJu) {
        sJu.value = 'auto';
    }
}

// --- Global System Funcs ---
function init() {
    try { initDropdowns(); } catch (e) { console.error('initDropdowns error', e); alert('initDropdowns error: ' + e.message); }
    try { initQimenHeaderControls(); } catch (e) { console.error('initQimen error', e); alert('initQimen error: ' + e.message); }
    try { resetToToday(); } catch (e) { console.error('resetToToday error', e); alert('resetToToday error: ' + e.message); }
    try { renderGroups(); } catch (e) { console.error('renderGroups error', e); alert('renderGroups error: ' + e.message); }
    try { checkAuth(); } catch (e) { console.error('checkAuth error', e); alert('checkAuth error: ' + e.message); }
    try { initBackgroundSystem(); } catch (e) { console.error('initBackgroundSystem error', e); alert('initBackgroundSystem error: ' + e.message); }

    // 每次打開软件，自動排好当下真实時刻的奇門陽盘時盘
    try {
        const today = new Date();
        let zhiIndex = Math.floor((today.getHours() + 1) / 2) % 12;
        const nowRecord = {
            id: 'now_time_chart',
            name: '当下時盘',
            gregYear: today.getFullYear().toString(),
            gregMonth: (today.getMonth() + 1).toString(),
            gregDay: today.getDate().toString(),
            gregTime: document.getElementById('greg-time').value,
            gender: 'M'
        };
        renderMainBoard(nowRecord);
    } catch (e) {
        console.error('renderMainBoard init error', e);
        alert('renderMainBoard init error: ' + e.message);
    }

    UI.navItems.forEach(item => {
        item.addEventListener('click', function () {
            this.blur(); // Force clear focus to prevent stuck hover/active states
            if (item.dataset.view) switchView(item.dataset.view);
        });
    });

    if (UI.btnSaveChart) {
        UI.btnSaveChart.onclick = () => {
            const record = {
                id: 'r_' + Date.now(),
                name: UI.userName.value || '未知',
                gregYear: UI.gregYear.value,
                gregMonth: UI.gregMonth.value,
                gregDay: UI.gregDay.value,
                gregTime: UI.gregTime.value,
                juOverride: document.getElementById('juOverride') ? document.getElementById('juOverride').value : 'auto',
                gender: document.querySelector('input[name="gender"]:checked').value,
                groupId: ''
            };

            // Ensure we have at least one group to save to
            if (State.groups.length === 0) {
                const newGroup = { id: 'default', name: '默认群组' };
                State.groups.push(newGroup);
                record.groupId = 'default';
                State.lastUsedGroupId = 'default';
            } else {
                record.groupId = State.lastUsedGroupId || State.groups[0].id;
            }

            State.records.push(record);
            saveState(); renderGroups();
            switchView('view-main');
            renderMainBoard(record);
        };
    }

    if (UI.btnNewChart) UI.btnNewChart.onclick = () => resetToToday();

    if (UI.btnLogoutSystem) {
        UI.btnLogoutSystem.onclick = () => {
            if (confirm("确定要退出系统吗？")) {
                State.isLoggedIn = false;
                localStorage.removeItem('ziwi_auth');
                checkAuth();
            }
        };
    }

    // Using document delegation or dynamic lookup for the button to ensure it doesn't get lost
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#btn-yongshen');
        if (btn) {
            e.preventDefault();
            const yongshenOverlay = document.getElementById('yongshen-overlay');
            const img = btn.querySelector('img');
            if (yongshenOverlay) {
                if (yongshenOverlay.style.display === 'none' || yongshenOverlay.style.display === '') {
                    yongshenOverlay.style.display = 'block';
                    if (img) img.src = 'img/资料On .png';
                } else {
                    yongshenOverlay.style.display = 'none';
                    if (img) img.src = 'img/资料.png';
                }
            }
        }
    });

    if (UI.snapshotBtn) {
        UI.snapshotBtn.onclick = () => {
            const record = State.currentActiveRecord;
            if (!record) return;

            const shutter = new Audio('img/Canon DSLR Shutter Sound.mp3');
            shutter.play().catch(e => console.log("Audio play failed:", e));

            let flash = document.querySelector('.camera-flash');
            if (!flash) {
                flash = document.createElement('div');
                flash.className = 'camera-flash';
                document.body.appendChild(flash);
            }
            flash.classList.remove('flash-active');
            void flash.offsetWidth;
            flash.classList.add('flash-active');

            let counter = parseInt(localStorage.getItem('qimen_snapshot_counter_v2') || '231', 10);
            if (counter < 231) counter = 231;
            const fileName = String(counter).padStart(6, '0') + '.jpg';
            localStorage.setItem('qimen_snapshot_counter_v2', (counter + 1).toString());

            const target = document.getElementById('qimen-capture-area') || document.getElementById('qimen-board-print');
            target.classList.add('capturing');

            // Check Notes
            const notesSection = target.querySelector('.qimen-notes-section');
            const notesInput = document.getElementById('qimen-notes-input');
            let notesHidden = false;
            let mockDiv = null;

            if (notesSection && notesInput) {
                if (notesInput.value.trim() === '') {
                    notesSection.style.display = 'none';
                    notesHidden = true;
                } else {
                    // html2canvas has issues with textarea, create a mock div
                    mockDiv = document.createElement('div');
                    mockDiv.className = notesInput.className;
                    // DO NOT copy raw cssText as it can break styles in some browsers
                    mockDiv.style.width = notesInput.offsetWidth + 'px';
                    mockDiv.style.boxSizing = 'border-box';
                    mockDiv.style.height = 'auto';
                    mockDiv.style.minHeight = notesInput.offsetHeight + 'px';
                    mockDiv.style.whiteSpace = 'pre-wrap';
                    mockDiv.style.wordWrap = 'break-word';
                    mockDiv.style.overflow = 'hidden';
                    // Apply essential text styles explicitly just in case class is not enough
                    mockDiv.style.fontSize = notesInput.style.fontSize || '26px';
                    mockDiv.style.lineHeight = notesInput.style.lineHeight || '37px';
                    mockDiv.innerText = notesInput.value;
                    notesInput.style.display = 'none';
                    notesSection.appendChild(mockDiv);
                }
            }

            // Hide refresh button to prevent canvas tainting from local image
            const btnQuickNow = document.getElementById('btn-quick-now');
            if (btnQuickNow) btnQuickNow.style.display = 'none';

            // Scroll to top to avoid scroll offset bugs in html2canvas
            const originalScrollY = window.scrollY;
            window.scrollTo(0, 0);
            
            const scrollWrapper = target.closest('.scroll-y');
            let originalWrapperScrollY = 0;
            if (scrollWrapper) {
                originalWrapperScrollY = scrollWrapper.scrollTop;
                scrollWrapper.scrollTop = 0;
            }

            const restoreUI = () => {
                if (notesHidden && notesSection) notesSection.style.display = '';
                if (mockDiv) {
                    mockDiv.remove();
                    notesInput.style.display = '';
                }
                if (btnQuickNow) btnQuickNow.style.display = ''; // Restore flex layout
                
                window.scrollTo(0, originalScrollY);
                if (scrollWrapper) {
                    scrollWrapper.scrollTop = originalWrapperScrollY;
                }
                target.classList.remove('capturing');
            };

            // Wait for DOM layout to update before capturing to prevent cut-offs
            setTimeout(() => {
                html2canvas(target, {
                    useCORS: true,
                    scale: 3, 
                    backgroundColor: "#ffffff",
                    scrollY: 0,
                    scrollX: 0,
                    windowWidth: target.scrollWidth,
                    windowHeight: target.scrollHeight
                }).then(canvas => {
                    const link = document.createElement('a');
                    link.download = fileName;
                    link.href = canvas.toDataURL("image/jpeg", 0.9);
                    link.click();
                    restoreUI();
                }).catch(err => {
                    console.error("Screenshot failed:", err);
                    alert("截图失败，请重试！\n错误信息: " + err.message);
                    restoreUI();
                });
            }, 100);
        };
    }

    // Import Buttons
    if (UI.importBtn) {
        UI.importBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (UI.importFileInput) UI.importFileInput.click();
        };
    }

    if (UI.importFileInput) {
        UI.importFileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                handleImport(event.target.result);
                e.target.value = '';
            };
            reader.readAsText(file);
        };
    }

    // Context Menu Buttons
    if (UI.menuRename) UI.menuRename.onclick = (e) => { e.stopPropagation(); handleRename(); };
    if (UI.menuDelete) UI.menuDelete.onclick = (e) => { e.stopPropagation(); handleDelete(); };
}

function handleImport(content) {
    if (!content) return;

    // Clean redundant markers from group names as requested
    const cleanGroupName = (name) => {
        // Remove "Folder", "Group", "名稱", "群组" and common separators
        return name.replace(/(Folder|Group|名稱|群组|[:：])/gi, '').trim();
    };

    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");
    let currentGroupId = State.groups.length > 0 ? State.groups[0].id : 'default';
    let importCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Record Detection Logic:
        // A record has 3 lines: Name, Gender (男/女), and Date (YYYY年M月D日 時辰)
        // If the NEXT line is exactly "男" or "女", then this current line is a person's name.
        if (i + 1 < lines.length && (lines[i + 1] === "男" || lines[i + 1] === "女")) {
            const name = line;
            const gender = lines[i + 1] === "男" ? "M" : "F";
            const dateLine = (i + 2 < lines.length) ? lines[i + 2] : "";

            // Parse Date: "1960年4月8日 卯時"
            const dateMatch = dateLine.match(/(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日\s*(.*)/);
            if (dateMatch) {
                const year = dateMatch[1];
                const month = dateMatch[2];
                const day = dateMatch[3];
                let timeRaw = dateMatch[4].trim();

                // Extract the Time Zhi (e.g., from "卯時")
                const timeZhiMatch = timeRaw.match(/[子丑寅卯辰巳午未申酉戌亥]/);
                const timeZhi = timeZhiMatch ? timeZhiMatch[0] : "子";

                const record = {
                    id: 'r_' + Date.now() + Math.random().toString(36).substr(2, 5),
                    name: name,
                    gender: gender,
                    gregYear: year,
                    gregMonth: month,
                    gregDay: day,
                    gregTime: timeZhi,
                    groupId: currentGroupId
                };

                // Avoid perfect duplicates in same group
                const exists = State.records.find(r =>
                    r.name === record.name &&
                    r.gregYear === record.gregYear &&
                    r.gregMonth === record.gregMonth &&
                    r.gregDay === record.gregDay &&
                    r.gregTime === record.gregTime &&
                    r.groupId === record.groupId
                );

                if (!exists) {
                    State.records.push(record);
                    importCount++;
                }
                i += 2; // Jump past Gender and Date lines
                continue;
            }
        }

        // Group Detection Logic:
        // If it's not a record and doesn't look like a date/gender, it's a Group Name
        if (line && !line.includes("年") && line !== "男" && line !== "女" && !line.includes("---")) {
            const gName = cleanGroupName(line);
            if (gName) {
                let group = State.groups.find(g => g.name === gName);
                if (!group) {
                    group = { id: 'g_' + Date.now() + Math.random().toString(36).substr(2, 5), name: gName };
                    State.groups.push(group);
                }
                currentGroupId = group.id;
            }
        }
    }

    saveState();
    renderGroups();
    alert(`成功导入 ${importCount} 条数据。`);
}

function handleBackup() {
    const CRLF = "\r\n";

    // Filter out records that don't belong to any active group
    const validGroupIds = new Set(State.groups.map(g => g.id));
    const validRecords = State.records.filter(r => validGroupIds.has(r.groupId));

    if (validRecords.length === 0) {
        alert("没有命盘数据可備份。");
        return;
    }

    let content = "【 地天髓八字 - 数据備份 】" + CRLF;
    content += "导出時间: " + new Date().toLocaleString() + CRLF;
    content += "------------------------------------------" + CRLF + CRLF;

    // Group valid records
    const grouped = {};
    validRecords.forEach(r => {
        if (!grouped[r.groupId]) grouped[r.groupId] = [];
        grouped[r.groupId].push(r);
    });

    // Iterate through groups
    State.groups.forEach(group => {
        const recs = grouped[group.id] || [];
        if (recs.length === 0) return;

        // Clean group name (just in case there are markers left)
        const gName = group.name.replace(/(Folder|Group|名稱|群组|[:：])/gi, '').trim();
        content += `${gName}${CRLF}${CRLF}`;

        recs.forEach(r => {
            const genderText = r.gender === 'M' ? '男' : '女';
            const branchName = (r.gregTime || "未知");
            const timeStr = branchName.includes("時") ? branchName : (branchName + "時");

            content += `${r.name}${CRLF}`;
            content += `${genderText}${CRLF}`;
            content += `${r.gregYear}年${r.gregMonth}月${r.gregDay}日 ${timeStr}${CRLF}${CRLF}`;
        });
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BaZi_Backup_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

window.onclick = (e) => {
    // Only hide if we're not clicking inside the menu itself
    if (UI.contextMenu && !UI.contextMenu.contains(e.target)) {
        hideContextMenu();
    }
};

function initBackgroundSystem() {
    const applyBg = (src) => {
        if (!src) UI.bgLayer.style.backgroundImage = 'none';
        else UI.bgLayer.style.backgroundImage = `url("${src}")`;
    };
    const savedBg = localStorage.getItem('ziwi_bg_image');
    if (savedBg) applyBg(savedBg);

    // FIXED: Use a cleaner event binding to prevent "hyperactive" background picker
    if (UI.bgChangeBtn) {
        UI.bgChangeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (UI.bgUploadInput) UI.bgUploadInput.click();
        };
    }

    if (UI.bgUploadInput) {
        UI.bgUploadInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target.result;
                localStorage.setItem('ziwi_bg_image', dataUrl);
                applyBg(dataUrl);
            };
            reader.readAsDataURL(file);
        };
    }
}

function initNotesTextarea() {
    const textarea = document.getElementById('qimen-notes-input');
    if (!textarea) return;

    // Force styles via JS to bypass caching
    textarea.style.overflow = 'hidden'; // Hide scrollbar since we auto-expand
    textarea.style.resize = 'none';
    textarea.style.fontSize = '26px';
    textarea.style.lineHeight = '37px';
    
    const adjustHeight = function() {
        // Use 'auto' to allow shrinking without hard jumps that break mobile keyboards
        textarea.style.height = 'auto'; 
        // scrollHeight includes padding but not borders. Add 2px for top/bottom borders.
        const newHeight = textarea.scrollHeight + 2;
        textarea.style.height = newHeight + 'px';
    };

    // Use both input and keyup to ensure we catch all deletions (Backspace on mobile)
    textarea.addEventListener('input', adjustHeight);
    textarea.addEventListener('keyup', adjustHeight);
    
    // Check initial content
    setTimeout(adjustHeight, 0); // Allow DOM to render first
}

init();
document.addEventListener('DOMContentLoaded', initNotesTextarea);

// Quick Refresh Now logic
document.addEventListener('DOMContentLoaded', () => {
    const btnQuickNow = document.getElementById('btn-quick-now');
    if (btnQuickNow) {
        btnQuickNow.addEventListener('click', () => {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const day = today.getDate();
            const hour = today.getHours();
            
            const zhiHourMap = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
            let zhiIndex = Math.floor((hour + 1) / 2) % 12;
            const hourZhi = zhiHourMap[zhiIndex];
            
            const tempRecord = {
                id: 'temp_now',
                name: '当前時间',
                gender: 'M',
                gregYear: year,
                gregMonth: month,
                gregDay: day,
                gregTime: hourZhi,
                realHour: hour,
                notes: ''
            };
            
            // Switch to the main board if not already there
            switchView('view-main');
            renderMainBoard(tempRecord);
        });
    }
});
