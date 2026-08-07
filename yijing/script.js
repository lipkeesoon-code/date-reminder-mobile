document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initLearningPage();
    initDivination();
    initHistory();
    initSnapshot();
    initDIYModal();
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
    
    const categoryColors = {
        "【上上卦 / 发展顺遂，大吉之象】": "#6e943d",
        "【中平卦 / 需待时机，稳中求胜】": "#fab041",
        "【动荡卦 / 充满变数，需谨慎应对】": "#1688b5",
        "【下下卦 / 陷入困境，警惕危机】": "#f06595",
        "【其他具有特殊启示的卦】": "#866aa9"
    };

    let allItems = [];
    yijingSummary.forEach(category => {
        const color = categoryColors[category.category] || "#43335c";
        category.items.forEach(item => {
            allItems.push({ ...item, color: color });
        });
    });

    allItems.sort((a, b) => a.id - b.id);

    let html = '<div class="category-group">';
    
    allItems.forEach(item => {
        const details = typeof hexagramDetails !== 'undefined' && hexagramDetails[item.id] ? hexagramDetails[item.id] : { shortName: "", idiom: "", keyword: "" };
        let idiomText = details.idiom;
        if (details.keyword) idiomText += `/${details.keyword}`;
        let imgHtml = `<img src="images/gua_crop/${item.id}.jpg" class="learning-hex-img" alt="${item.name}" onerror="this.style.display='none'">`;
        
        let extraHtml = details.shortName ? `<span class="hex-short" style="color: ${item.color} !important;">(${details.shortName})</span><span class="hex-idiom" style="color: ${item.color} !important;">${idiomText}</span>` : '';
        html += `<div class="hex-card">
            ${imgHtml}
            <div class="hex-name" style="color: ${item.color} !important;"><strong>${item.id}.${item.name}</strong>${extraHtml}</div>
            <div class="hex-desc">${item.desc}</div>
            <div style="clear: both;"></div>
        </div>`;
    });
    
    html += `</div>`;

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

function initDIYModal() {
    const diyToggleBtn = document.getElementById('diy-toggle-btn');
    const diyModal = document.getElementById('diy-modal');
    const diyCloseBtn = document.getElementById('diy-close-btn');
    const diyHexSelect = document.getElementById('diy-hex-select');
    const diyConfirmBtn = document.getElementById('diy-confirm-btn');

    if (!diyToggleBtn || !diyModal) return;

    // Hardcoded 64 hexagrams in exact King Wen sequence (IDs 1 to 64)
    const allHexNames = [
        "乾为天", "坤为地", "水雷屯", "山水蒙", "水天需", "天水讼", "地水师", "水地比",
        "风天小畜", "天泽履", "地天泰", "天地否", "天火同人", "火天大有", "地山谦", "雷地豫",
        "泽雷随", "山风蛊", "地泽临", "风地观", "火雷噬嗑", "山火贲", "山地剥", "地雷复",
        "天雷无妄", "山天大畜", "山雷颐", "泽风大过", "坎为水", "离为火", "泽山咸", "雷风恒",
        "天山遁", "雷天大壮", "火地晋", "地火明夷", "风火家人", "火泽睽", "水山蹇", "雷水解",
        "山泽损", "风雷益", "泽天夬", "天风姤", "泽地萃", "地风升", "泽水困", "水风井",
        "泽火革", "火风鼎", "震为雷", "艮为山", "风山渐", "雷泽归妹", "雷火丰", "火山旅",
        "巽为风", "兑为泽", "风水涣", "水泽节", "风泽中孚", "雷山小过", "水火既济", "火水未济"
    ];

    allHexNames.forEach((name, index) => {
        let option = document.createElement('option');
        option.value = name;
        option.textContent = `${index + 1}. ${name}`;
        diyHexSelect.appendChild(option);
    });

    // Hack: Add empty options at the bottom to bypass a known Chrome DevTools 
    // bug where the native select scrollbar cuts off the last few items in mobile simulator.
    for (let i = 0; i < 3; i++) {
        let dummyOpt = document.createElement('option');
        dummyOpt.value = "";
        dummyOpt.textContent = " ";
        dummyOpt.disabled = true;
        diyHexSelect.appendChild(dummyOpt);
    }

    diyToggleBtn.addEventListener('click', () => {
        diyModal.style.display = 'flex';
    });

    diyCloseBtn.addEventListener('click', () => {
        diyModal.style.display = 'none';
    });

    diyConfirmBtn.addEventListener('click', () => {
        const selectedHexName = diyHexSelect.value;
        const selectedYao = parseInt(document.querySelector('input[name="diy_yao"]:checked').value);
        
        // Find binary lines for the selected hexagram
        let binaryStr = "";
        for (const [bin, name] of Object.entries(hexagramDict)) {
            if (name === selectedHexName) {
                binaryStr = bin;
                break;
            }
        }
        
        if (!binaryStr) return;
        
        // originalLines is array of 0s and 1s, from bottom (0) to top (5)
        let originalLines = binaryStr.split('').map(Number);
        let changingLinesIndex = [selectedYao]; // The index from 0 (bottom) to 5 (top)
        
        diyModal.style.display = 'none';
        
        const resultContainer = document.getElementById('result-container');
        resultContainer.style.display = 'none';
        
        const clickSound = new Audio('../设计风格/Poker Chips Stack Drop 4 004 Add Big Sound .mp3');
        clickSound.play().catch(e => console.log('Audio error:', e));
        
        setTimeout(() => {
            performDivination(originalLines, changingLinesIndex, false);
            resultContainer.style.display = 'block';
        }, 500);
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
    let hexColorMap = {};
    
    const categoryColors = {
        "【上上卦 / 发展顺遂，大吉之象】": "#6e943d",
        "【中平卦 / 需待时机，稳中求胜】": "#fab041",
        "【动荡卦 / 充满变数，需谨慎应对】": "#1688b5",
        "【下下卦 / 陷入困境，警惕危机】": "#f06595",
        "【其他具有特殊启示的卦】": "#866aa9"
    };

    if (typeof yijingSummary !== 'undefined') {
        yijingSummary.forEach(category => {
            const catColor = categoryColors[category.category] || "#43335c";
            category.items.forEach(item => {
                hexDescMap[item.name] = item.desc;
                hexIdMap[item.name] = item.id;
                hexColorMap[item.name] = catColor;
            });
        });
    }

    const origDesc = hexDescMap[origName] || "此卦象深奥，需结合实际体悟。";
    const changedDesc = hexDescMap[changedName] || "此卦象深奥，需结合实际体悟。";
    const nuclearDesc = hexDescMap[nuclearName] || "此卦象深奥，需结合实际体悟。";

    const formatNameHtml = (name) => {
        let id = hexIdMap[name];
        let color = hexColorMap[name] || "#43335c";
        if (!id) return name;
        const details = typeof hexagramDetails !== 'undefined' && hexagramDetails[id] ? hexagramDetails[id] : { shortName: "", idiom: "", keyword: "" };
        let shortNameHtml = details.shortName ? `<span class="res-hex-short" style="color: ${color} !important;">（${details.shortName}）</span>` : '';
        let idiomText = details.idiom;
        if (details.keyword) idiomText += ` / ${details.keyword}`;
        let idiomHtml = idiomText ? `<div class="res-hex-idiom" style="color: ${color} !important;">${idiomText}</div>` : '';
        
        return `<div class="res-name-block" style="color: ${color} !important;">
            <div class="res-name-line1" style="color: ${color} !important;"><strong>${id} ${name}</strong> ${shortNameHtml}</div>
            ${idiomHtml}
        </div>`;
    };

    // 更新 UI
    document.getElementById('res-original-name').innerHTML = formatNameHtml(origName);
    document.getElementById('res-nuclear-name').innerHTML = formatNameHtml(nuclearName);
    document.getElementById('res-changed-name').innerHTML = formatNameHtml(changedName);
    
    const getImgSrc = (id) => {
        if (typeof hexagramImagesBase64 !== 'undefined' && hexagramImagesBase64[id]) {
            return hexagramImagesBase64[id];
        }
        return `images/gua_crop/${id}.jpg`;
    };

    if (hexIdMap[origName]) {
        document.getElementById('res-original-img').src = getImgSrc(hexIdMap[origName]);
        document.getElementById('res-original-img').style.display = 'block';
    }
    if (hexIdMap[nuclearName]) {
        document.getElementById('res-nuclear-img').src = getImgSrc(hexIdMap[nuclearName]);
        document.getElementById('res-nuclear-img').style.display = 'block';
    }
    if (hexIdMap[changedName]) {
        document.getElementById('res-changed-img').src = getImgSrc(hexIdMap[changedName]);
        document.getElementById('res-changed-img').style.display = 'block';
    }
    
    document.getElementById('res-original-desc').innerHTML = `<strong>释义：</strong>${origDesc}`;
    document.getElementById('res-nuclear-desc').innerHTML = `<strong>释义：</strong>${nuclearDesc}`;
    document.getElementById('res-changed-desc').innerHTML = `<strong>释义：</strong>${changedDesc}`;
    
    // 动爻说明
    let yaoNameStr = "无变爻";
    if (changingLinesIndex.length > 0) {
        let yaoNames = changingLinesIndex.map(idx => {
            let num = idx + 1;
            let val = originalLines[idx] === 1 ? '九' : '六';
            if (num === 1) return `初${val}`;
            if (num === 6) return `上${val}`;
            return `${val}${num === 2 ? '二' : num === 3 ? '三' : num === 4 ? '四' : '五'}`;
        });
        yaoNameStr = yaoNames.join('、');
    }

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

    document.addEventListener('click', (e) => {
        if (!historyBtn.contains(e.target) && !historyPopup.contains(e.target)) {
            historyPopup.classList.remove('open');
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


// --- 截图功能逻辑 ---
function initSnapshot() {
    const snapBtn = document.getElementById('snapshot-btn');
    if (!snapBtn) return;
    
    // Preload audio
    const shutterSound = new Audio('shutter_sound.mp3');
    
    snapBtn.addEventListener('click', () => {
        const container = document.getElementById('result-container');
        if (!container || container.style.display === 'none') {
            alert('请先进行占卜再截图！');
            return;
        }

        const remarkBox = document.getElementById('divination-remark');
        const remarkContainer = remarkBox ? remarkBox.parentElement : null;
        
        let isRemarkEmpty = !remarkBox || !remarkBox.value.trim();
        
        // Hide remark if empty
        if (isRemarkEmpty && remarkContainer) {
            remarkContainer.style.display = 'none';
        }
        
        // Temporarily style container for snapshot to include background
        const origBg = container.style.background;
        const origPadding = container.style.padding;
        const origBorderRadius = container.style.borderRadius;
        const origMarginTop = container.style.marginTop;
        const origMargin = container.style.margin;
        
        container.style.background = 'linear-gradient(135deg, #e6e3f0 0%, #f6ecf0 100%)';
        container.style.padding = '20px 15px';
        container.style.borderRadius = '0px'; // No border radius for full page look
        container.style.margin = '0px';
        
        // CRITICAL FIX: html2canvas clones the DOM, which RESTARTS CSS animations in the hidden iframe!
        // This causes the snapshot to capture the container at opacity 0.2 (start of fadeIn animation).
        const origAnimation = container.style.animation;
        container.style.animation = 'none';

        // html2canvas BUG FIX: backdrop-filter makes cards blurry/transparent.
        // We must temporarily replace it with a solid background.
        const cards = container.querySelectorAll('.result-card');
        const origCardStyles = [];
        cards.forEach(card => {
            origCardStyles.push({
                background: card.style.background,
                backdropFilter: card.style.backdropFilter
            });
            card.style.background = '#ffffff'; // Solid white background
            card.style.backdropFilter = 'none';
        });
        
        // Disable pointer events on remark box so cursor doesn't show in screenshot
        if (remarkBox) {
            remarkBox.setAttribute('value', remarkBox.value);
            remarkBox.style.pointerEvents = 'none';
            remarkBox.blur(); 
        }

        // Wait a small delay to ensure DOM updates, then snapshot
        setTimeout(() => {
            html2canvas(container, {
                scale: 4, // Ultra high resolution
                useCORS: true,
                backgroundColor: '#e6e3f0',
            }).then(canvas => {
                // Restore styles
                container.style.background = origBg;
                container.style.padding = origPadding;
                container.style.borderRadius = origBorderRadius;
                container.style.marginTop = origMarginTop;
                container.style.margin = origMargin;
                container.style.animation = origAnimation;
                
                cards.forEach((card, i) => {
                    card.style.background = origCardStyles[i].background;
                    card.style.backdropFilter = origCardStyles[i].backdropFilter;
                });
                if (remarkBox) remarkBox.style.pointerEvents = 'auto';
                
                if (isRemarkEmpty && remarkContainer) {
                    remarkContainer.style.display = '';
                }
                
                // Play shutter sound and flash
                shutterSound.currentTime = 0;
                shutterSound.play().catch(e => console.log("Audio play blocked by browser", e));
                
                
                
                // Format filename: YiJing 0001, YiJing 0002, etc.
                let snapshotCount = parseInt(localStorage.getItem('yijingSnapshotCount') || '1', 10);
                let paddedCount = String(snapshotCount).padStart(4, '0');
                let filename = `YiJing ${paddedCount}.jpg`;
                localStorage.setItem('yijingSnapshotCount', snapshotCount + 1);
                
                // Trigger download as JPG
                let link = document.createElement('a');
                link.download = filename;
                let dataUrl = canvas.toDataURL("image/jpeg", 1.0);
                link.href = dataUrl;
                link.click();
                
            }).catch(err => {
                console.error("Snapshot failed: ", err);
                alert("截图生成失败，可能是浏览器安全限制（如双击打开本地文件）。建议将文件放在服务器或使用本地服务器(如Live Server)运行。错误详情：" + err);
                // Restore styles on error too
                container.style.background = origBg;
                container.style.padding = origPadding;
                container.style.borderRadius = origBorderRadius;
                container.style.marginTop = origMarginTop;
                container.style.margin = origMargin;
                container.style.animation = origAnimation;
                if (remarkBox) remarkBox.style.pointerEvents = 'auto';
                if (isRemarkEmpty && remarkContainer) {
                    remarkContainer.style.display = '';
                }
            });
        }, 100);
    });
}
