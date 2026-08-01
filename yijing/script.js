document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initLearningPage();
    initDivination();
    initHistory();
});

let isLearningView = false;
function initTabs() {
    const toggleBtn = document.getElementById('learning-toggle-btn');
    const viewPractical = document.getElementById('view-practical');
    const viewLearning = document.getElementById('view-learning');

    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        isLearningView = !isLearningView;
        if (isLearningView) {
            viewPractical.style.display = 'none';
            viewLearning.style.display = 'block';
            toggleBtn.src = "../设计风格/资料On .png";
        } else {
            viewPractical.style.display = 'flex';
            viewLearning.style.display = 'none';
            toggleBtn.src = "../设计风格/资料.png";
        }
    });
}

function initLearningPage() {
    const learningList = document.getElementById('learning-list');
    let html = '';
    
    yijingSummary.forEach(category => {
        html += `<div class="category-group">
            <div class="category-title">${category.category}</div>`;
        
        category.items.forEach(item => {
            const details = typeof hexagramDetails !== 'undefined' && hexagramDetails[item.id] ? hexagramDetails[item.id] : { shortName: "", idiom: "", keyword: "" };
            let idiomText = details.idiom;
            if (details.keyword) idiomText += ` / ${details.keyword}`;
            let extraHtml = details.shortName ? `<span class="hex-short">（${details.shortName}）</span> <span class="hex-idiom">${idiomText}</span>` : '';
            html += `<div class="hex-card">
                <div class="hex-name"><strong>${item.id}. ${item.name}</strong> ${extraHtml}</div>
                <div class="hex-desc">${item.desc}</div>
            </div>`;
        });
        
        html += `</div>`;
    });

    learningList.innerHTML = html;
}

// 占卜核心逻辑
function initDivination() {
    const btn = document.getElementById('btn-divinate');
    const resultContainer = document.getElementById('result-container');
    const clickSound = new Audio('../设计风格/Poker Chips Stack Drop 4 004 Add Big Sound .mp3');
    
    btn.addEventListener('click', () => {
        // 播放音效
        clickSound.currentTime = 0;
        clickSound.play().catch(e => console.log('Audio error:', e));

        // 如果当前在学习页面，先切回占卜页面
        if (isLearningView) {
            isLearningView = false;
            document.getElementById('view-practical').style.display = 'flex';
            document.getElementById('view-learning').style.display = 'none';
            document.getElementById('learning-toggle-btn').src = "../设计风格/资料.png";
        }

        // 添加点击动画
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = '', 150);

        // 显示结果区域
        btn.innerText = '正在感应...';
        btn.style.opacity = '0.7';
        btn.disabled = true;

        setTimeout(() => {
            performDivination();
            resultContainer.style.display = 'block';
            
            btn.innerHTML = '<span class="btn-icon">☯</span> 再次占卜';
            btn.style.opacity = '1';
            btn.disabled = false;
        }, 1000);
    });
}

function performDivination(providedOriginalLines = null, providedChangingLinesIndex = null, skipSave = false) {
    // 随机生成 6 个爻 (1 = 阳, 0 = 阴)
    // 随机生成 0 到 2 个动爻
let originalLines = [];
    let changingLinesIndex = [];
    
    if (providedOriginalLines && providedChangingLinesIndex) {
        originalLines = [...providedOriginalLines];
        changingLinesIndex = [...providedChangingLinesIndex];
    } else {
        for (let i = 0; i < 6; i++) {
            originalLines.push(Math.random() > 0.5 ? 1 : 0);
        }
        
        let numChanging = Math.random() > 0.8 ? (Math.random() > 0.5 ? 2 : 0) : 1;
        let availableIndices = [0, 1, 2, 3, 4, 5];
        for (let i = 0; i < numChanging; i++) {
            let randIdx = Math.floor(Math.random() * availableIndices.length);
            changingLinesIndex.push(availableIndices[randIdx]);
            availableIndices.splice(randIdx, 1);
        }
        changingLinesIndex.sort();
    }

    // 变卦
    let changedLines = [...originalLines];
    changingLinesIndex.forEach(idx => {
        changedLines[idx] = changedLines[idx] === 1 ? 0 : 1;
    });

    // 互卦 (第 2,3,4 爻为下卦，第 3,4,5 爻为上卦)
    // 注意：数组索引是从0开始，0是初爻，1是二爻... 5是上爻
    let nuclearLines = [
        originalLines[1], // 互卦初爻 (原二爻)
        originalLines[2], // 互卦二爻 (原三爻)
        originalLines[3], // 互卦三爻 (原四爻)
        originalLines[2], // 互卦四爻 (原三爻)
        originalLines[3], // 互卦五爻 (原四爻)
        originalLines[4]  // 互卦上爻 (原五爻)
    ];

    const origStr = originalLines.join('');
    const changedStr = changedLines.join('');
    const nuclearStr = nuclearLines.join('');

    const origName = hexagramDict[origStr] || "未知卦象";
    const changedName = hexagramDict[changedStr] || "未知卦象";
    const nuclearName = hexagramDict[nuclearStr] || "未知卦象";

    // 建立解释映射
    let hexDescMap = {};
    let hexIdMap = {};
    if (typeof yijingSummary !== 'undefined') {
        yijingSummary.forEach(category => {
            category.items.forEach(item => {
                hexDescMap[item.name] = item.desc;
                hexIdMap[item.name] = item.id;
            });
        });
    }

    const origDesc = hexDescMap[origName] || "此卦象深奥，需结合实际体悟。";
    const changedDesc = hexDescMap[changedName] || "此卦象深奥，需结合实际体悟。";
    const nuclearDesc = hexDescMap[nuclearName] || "此卦象深奥，需结合实际体悟。";

    const formatNameHtml = (name) => {
        let id = hexIdMap[name];
        if (!id) return name;
        const details = typeof hexagramDetails !== 'undefined' && hexagramDetails[id] ? hexagramDetails[id] : { shortName: "", idiom: "", keyword: "" };
        let shortNameHtml = details.shortName ? `<span class="res-hex-short">（${details.shortName}）</span>` : '';
        let idiomText = details.idiom;
        if (details.keyword) idiomText += ` / ${details.keyword}`;
        let idiomHtml = idiomText ? `<div class="res-hex-idiom">${idiomText}</div>` : '';
        
        return `<div class="res-name-block">
            <div class="res-name-line1"><strong>${id} ${name}</strong> ${shortNameHtml}</div>
            ${idiomHtml}
        </div>`;
    };

    // 更新 UI
    document.getElementById('res-original-name').innerHTML = formatNameHtml(origName);
    document.getElementById('res-nuclear-name').innerHTML = formatNameHtml(nuclearName);
    document.getElementById('res-changed-name').innerHTML = formatNameHtml(changedName);
    
    document.getElementById('res-original-desc').innerHTML = `<strong>释义：</strong>${origDesc}`;
    document.getElementById('res-nuclear-desc').innerHTML = `<strong>释义：</strong>${nuclearDesc}`;
    document.getElementById('res-changed-desc').innerHTML = `<strong>释义：</strong>${changedDesc}`;
    
    // 动爻说明
    let changingDesc = "此卦无动爻，宜静守本分，按照本卦行事。";
    let yaoNameStr = "无变爻";
    if (changingLinesIndex.length > 0) {
        let yaoNames = changingLinesIndex.map(idx => {
            let num = idx + 1;
            let val = originalLines[idx] === 1 ? '九' : '六';
            if (num === 1) return `初${val}`;
            if (num === 6) return `上${val}`;
            return `${val}${num === 2 ? '二' : num === 3 ? '三' : num === 4 ? '四' : '五'}`;
        });
        changingDesc = `代表事情正在发生转折，需注意相关的行动指导，参考变卦。`;
        yaoNameStr = yaoNames.join('、');
        document.getElementById('res-changing-line-name').innerText = yaoNameStr;
    } else {
        document.getElementById('res-changing-line-name').innerText = "无变爻";
    }
    document.getElementById('res-changing-line-desc').innerHTML = `<strong>释义：</strong>${changingDesc}`;

// 绘制符号
    drawHexagramSymbol('res-original-symbol', originalLines, changingLinesIndex);
    drawHexagramSymbol('res-nuclear-symbol', nuclearLines, []);
    drawHexagramSymbol('res-changed-symbol', changedLines, []);

    // 保存历史记录
    if (!skipSave) {
        let changingText = changingLinesIndex.length > 0 ? (typeof yaoNameStr !== 'undefined' ? yaoNameStr : "变爻") : "无变爻";
        saveHistoryRecord(originalLines, changingLinesIndex, origName, nuclearName, changingText, changedName);
    }
}

function drawHexagramSymbol(containerId, lines, changingIndices) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    // 从上到下绘制 (索引 5 到 0)
    for (let i = 5; i >= 0; i--) {
        const val = lines[i];
        const isChanging = changingIndices.includes(i);
        const div = document.createElement('div');
        div.className = 'yao-line ' + (val === 1 ? 'yao-yang' : 'yao-yin');
        if (isChanging) div.classList.add('yao-changing');
        container.appendChild(div);
    }
}

// --- 历史记录逻辑 ---
const HISTORY_COLORS = [
    '#ed7d9c', '#d35272', '#b68344', '#a1833c', '#d99745',
    '#e09f48', '#387399', '#25708f', '#6da246', '#60a649',
    '#e07583', '#d96475', '#ba8a38'
];

function initHistory() {
    const historyBtn = document.getElementById('history-toggle-btn');
    const historyPopup = document.getElementById('history-popup');
    if (!historyBtn || !historyPopup) return;

    historyBtn.addEventListener('click', () => {
        historyPopup.classList.toggle('open');
        if (historyPopup.classList.contains('open')) {
            renderHistory();
        }
    });
}

function saveHistoryRecord(origLines, changingIdx, origName, nucName, changingText, changedName) {
    let history = JSON.parse(localStorage.getItem('yijingHistory') || '[]');
    let record = {
        origLines,
        changingIdx,
        text: `${origName} | ${nucName} | ${changingText} | ${changedName}`,
        timestamp: new Date().getTime()
    };
    
    history.unshift(record);
    if (history.length > 13) {
        history.pop();
    }
    localStorage.setItem('yijingHistory', JSON.stringify(history));
}

function renderHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;
    
    let history = JSON.parse(localStorage.getItem('yijingHistory') || '[]');
    if (history.length === 0) {
        list.innerHTML = '<div style="padding: 15px; text-align: center; color: #999;">暂无占卜记录</div>';
        return;
    }

    let html = '';
    history.forEach((item, index) => {
        let color = HISTORY_COLORS[index % HISTORY_COLORS.length];
        html += `<div class="history-item" onclick="restoreHistory(${index})">
            <div class="history-badge" style="background-color: ${color};">${index + 1}</div>
            <div class="history-text">${item.text}</div>
        </div>`;
    });
    list.innerHTML = html;
}

function restoreHistory(index) {
    let history = JSON.parse(localStorage.getItem('yijingHistory') || '[]');
    let record = history[index];
    if (record) {
        // 关闭历史弹窗
        document.getElementById('history-popup').classList.remove('open');
        
        // 切换到占卜页面 (如果当前在学习页面)
        if (isLearningView) {
            isLearningView = false;
            document.getElementById('view-practical').style.display = 'flex';
            document.getElementById('view-learning').style.display = 'none';
            document.getElementById('learning-toggle-btn').src = "../设计风格/资料.png";
        }
        
        const btn = document.getElementById('btn-divinate');
        const resultContainer = document.getElementById('result-container');
        
        btn.innerText = '正在回放...';
        btn.style.opacity = '0.7';
        btn.disabled = true;

        setTimeout(() => {
            performDivination(record.origLines, record.changingIdx, true); // skipSave = true
            resultContainer.style.display = 'block';
            
            btn.innerHTML = '<span class="btn-icon">☯</span> 再次占卜';
            btn.style.opacity = '1';
            btn.disabled = false;
        }, 500);
    }
}
