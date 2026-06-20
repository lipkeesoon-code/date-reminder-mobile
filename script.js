let isCalcSoundOn = true;
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function playCalcBeep() {
    if (!isCalcSoundOn) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}
document.addEventListener("DOMContentLoaded", () => {
    // 默认展示的年份与月份（设定为今日日期）
    const todayObj = new Date();
    let currentYear = todayObj.getFullYear();
    // 限制在 2026 至 2126 年的范围内
    if (currentYear < 2026) currentYear = 2026;
    if (currentYear > 2126) currentYear = 2126;
    let currentMonth = todayObj.getMonth();
    let currentDay = todayObj.getDate();
    let highlightedDate = null; // 用于记录双击卡片定位日期的高亮状态
    let isTouchDevice = false;
    document.addEventListener("touchstart", () => {
        isTouchDevice = true;
    }, { passive: true });


    // ==========================================================================
    // 手机网络版专属视图切换与工具逻辑
    // ==========================================================================
    const viewFolders = document.getElementById("view-folders");
    const viewCalendar = document.getElementById("view-calendar");
    const navBtnList = document.getElementById("nav-btn-list");
    const navBtnCalendar = document.getElementById("nav-btn-calendar");

    // 全局 Toast 提示框方法
    const showToast = (msg) => {
        const toast = document.getElementById("toast-container");
        if (!toast) return;
        toast.textContent = msg;
        toast.style.display = "block";
        
        // 强制触发 reflow 使 transition 生效
        toast.offsetHeight; 
        toast.classList.add("show");

        if (window.toastTimeout) clearTimeout(window.toastTimeout);
        window.toastTimeout = setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => {
                toast.style.display = "none";
            }, 200);
        }, 1500);
    };

    if (navBtnList && navBtnCalendar) {
        navBtnList.addEventListener("click", () => {
            viewFolders.classList.add("active");
            viewCalendar.classList.remove("active");
            navBtnList.classList.add("active");
            navBtnCalendar.classList.remove("active");

            // 按钮物理点击微动动画
            navBtnList.classList.add("clicked");
            setTimeout(() => navBtnList.classList.remove("clicked"), 300);

            // 弹出数据提醒 toast
            showToast("数据提醒");
        });

        navBtnCalendar.addEventListener("click", () => {
            viewCalendar.classList.add("active");
            viewFolders.classList.remove("active");
            navBtnCalendar.classList.add("active");
            navBtnList.classList.remove("active");

            // 按钮物理点击微动动画
            navBtnCalendar.classList.add("clicked");
            setTimeout(() => navBtnCalendar.classList.remove("clicked"), 300);

            // 切换到日历页面时触发重新渲染以防宽高不对齐
            setTimeout(() => {
                renderCalendar(currentYear, currentMonth);
            }, 50);
        });
    }

    // (Restored Add Card logic)
    const btnAddCardTop = document.getElementById("btn-add-card-top");
    const addCardPanel = document.getElementById("add-card-panel");
    const mobileCardTitleInput = document.getElementById("mobile-card-title-input");
    const mobileCardDay = document.getElementById("mobile-card-day");
    const mobileCardMonth = document.getElementById("mobile-card-month");
    const mobileCardYear = document.getElementById("mobile-card-year");
    const mobileCardEndDay = document.getElementById("mobile-card-end-day");
    const mobileCardEndMonth = document.getElementById("mobile-card-end-month");
    const mobileCardEndYear = document.getElementById("mobile-card-end-year");
    const btnMobileSaveCard = document.getElementById("btn-mobile-save-card");

    if (btnAddCardTop && addCardPanel) {
        btnAddCardTop.addEventListener("click", () => {
            // 切换新增面板的显示与隐藏
            if (addCardPanel.style.display === "none") {
                addCardPanel.style.display = "block";
                // 按钮图标高亮
                btnAddCardTop.classList.add("active");
                // 初始化下拉框选项
                initMobileCardFormSelectors();
            } else {
                addCardPanel.style.display = "none";
                btnAddCardTop.classList.remove("active");
            }
        });
    }

    if (btnMobileSaveCard) {
        btnMobileSaveCard.addEventListener("click", () => {
            if (typeof saveMobileReminder === "function") {
                saveMobileReminder();
            }
        });
    }

    const initMobileCardFormSelectors = () => {
        if (!mobileCardYear || !mobileCardDay) return;
        
        // 年份：无年 和 2026-2126
        mobileCardYear.innerHTML = '<option value="">无年</option>';
        if (mobileCardEndYear) mobileCardEndYear.innerHTML = '<option value="">无年</option>';
        for (let y = 2026; y <= 2126; y++) {
            const opt = document.createElement("option");
            opt.value = y;
            opt.textContent = y;
            mobileCardYear.appendChild(opt);
            
            if (mobileCardEndYear) {
                const endOpt = document.createElement("option");
                endOpt.value = y;
                endOpt.textContent = y;
                mobileCardEndYear.appendChild(endOpt);
            }
        }
        mobileCardYear.value = currentYear;
        if (mobileCardEndYear) mobileCardEndYear.value = currentYear;

        // 日期：无日 和 1-31
        mobileCardDay.innerHTML = '';
        if (mobileCardEndDay) mobileCardEndDay.innerHTML = '';
        for (let d = 1; d <= 31; d++) {
            const opt = document.createElement("option");
            opt.value = d;
            opt.textContent = String(d).padStart(2, "0");
            mobileCardDay.appendChild(opt);
            
            if (mobileCardEndDay) {
                const endOpt = document.createElement("option");
                endOpt.value = d;
                endOpt.textContent = String(d).padStart(2, "0");
                mobileCardEndDay.appendChild(endOpt);
            }
        }
        mobileCardDay.value = currentDay;
        if (mobileCardEndDay) mobileCardEndDay.value = currentDay;

        // 月份默认当月
        if (mobileCardMonth) mobileCardMonth.value = currentMonth;
        if (mobileCardEndMonth) mobileCardEndMonth.value = currentMonth;
    };


    // 手机触屏长按手势检测
    const addLongPressListener = (el, callback) => {
        let timer = null;
        let isMoving = false;
        
        const start = (e) => {
            isMoving = false;
            // 600 毫秒视为长按
            timer = setTimeout(() => {
                if (!isMoving) {
                    callback(e);
                }
            }, 600);
        };
        
        const cancel = () => {
            if (timer) clearTimeout(timer);
        };
        
        el.addEventListener("touchstart", start, { passive: true });
        el.addEventListener("touchend", cancel);
        el.addEventListener("touchmove", () => {
            isMoving = true;
            cancel();
        });
        el.addEventListener("touchcancel", cancel);
    };

    // 手机触屏双阶手势检测 (100ms 和 3000ms)
    const addDualPressListener = (el, cb100, cb3000, fire100OnEnd = false) => {
        let timer100 = null;
        let timer3000 = null;
        let isMoving = false;
        let fired100 = false;
        let fired3000 = false;
        let startX = 0;
        let startY = 0;
        
        const start = (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
            if (e.touches && e.touches.length > 0) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }
            isMoving = false;
            fired100 = false;
            fired3000 = false;
            
            timer100 = setTimeout(() => {
                if (!isMoving) {
                    fired100 = true;
                    if (!fire100OnEnd && cb100) {
                        cb100(e);
                    } else if (fire100OnEnd) {
                        el.style.opacity = "0.6"; // Visual cue
                    }
                }
            }, 100);
            
            timer3000 = setTimeout(() => {
                if (!isMoving) {
                    fired3000 = true;
                    if (fire100OnEnd) el.style.opacity = "";
                    if (cb3000) cb3000(e);
                }
            }, 3000);
        };
        
        const end = (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
            if (timer100) clearTimeout(timer100);
            if (timer3000) clearTimeout(timer3000);
            if (fire100OnEnd) el.style.opacity = "";
            
            if (fire100OnEnd) {
                // 抬手触发模式：只要松手前没怎么滑动，且没有触发 3 秒长按，就立刻响应短按 (无 100ms 门槛限制)
                if (!isMoving && !fired3000) {
                    if (cb100) cb100(e);
                }
            }

            if (fired3000) {
                // 如果已经触发了 3 秒事件（弹出了菜单），放开手指时阻止生成 click 事件，避免菜单瞬间被全局 click 监听器关掉。
                if (e.cancelable) e.preventDefault();
            }
        };
        
        const cancel = () => {
            if (timer100) clearTimeout(timer100);
            if (timer3000) clearTimeout(timer3000);
            if (fire100OnEnd) el.style.opacity = "";
        };
        
        // 注意：如果要阻止默认事件，passive 必须为 false
        el.addEventListener("touchstart", start, { passive: false });
        el.addEventListener("touchend", end, { passive: false });
        el.addEventListener("touchmove", (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
            if (e.touches && e.touches.length > 0) {
                const dx = Math.abs(e.touches[0].clientX - startX);
                const dy = Math.abs(e.touches[0].clientY - startY);
                // 允许手指有 15px 以内的微小晃动，不取消长按
                if (dx > 15 || dy > 15) {
                    isMoving = true;
                    cancel();
                }
            } else {
                isMoving = true;
                cancel();
            }
        }, { passive: true });
        el.addEventListener("touchcancel", cancel);
    };

    // 默认文件夹与卡片初始数据
    const defaultFolders = [
        {
            id: "group-tasks",
            name: "任务提醒",
            collapsed: false,
            cards: [
                { id: "c1", title: "还妈妈保险 RM5800", dateStr: "1 June" },
                { id: "c2", title: "还地税", dateStr: "1 Jan" },
                { id: "c3", title: "去KL Meet Joyce & Balamur", dateStr: "27 Oct 2026" },
                { id: "c4", title: "去Kelly2女儿 Pudu Bomba 生日会", dateStr: "31 Oct 2026" }
            ]
        },
        {
            id: "group-birthdays",
            name: "生日提醒",
            collapsed: false,
            cards: [
                { id: "c5", title: "Eric Thong 男", dateStr: "1984 May 15 寅时" },
                { id: "c6", title: "八字 Kelly 女", dateStr: "1988 June 3 卯时" },
                { id: "c7", title: "Kari Pop 女", dateStr: "2021 September 24 酉时" }
            ]
        },
        {
            id: "group-festivals",
            name: "节日提醒",
            collapsed: false,
            cards: [
                { id: "c8", title: "情人节 Valentine's Day", dateStr: "14 Feb" },
                { id: "c9", title: "世界地球日 (Earth Day)", dateStr: "4月22日" },
                { id: "c10", title: "卫塞节 浴佛", dateStr: "5月12日" }
            ]
        }
    ];

    // 初始化加载数据
    let foldersData = null;
    try {
        const storedData = localStorage.getItem("reminders_folders");
        if (storedData) {
            foldersData = JSON.parse(storedData);
        }
    } catch (e) {
        console.error("Failed to parse local storage:", e);
    }

    // 如果没有数据(比如第一次访问)，则使用默认数据
    // 注意：如果用户删除了所有文件夹（foldersData 是空数组 []），则保留为空数组，不再强制恢复默认数据
    if (foldersData === null || !Array.isArray(foldersData)) {
        foldersData = JSON.parse(JSON.stringify(defaultFolders));
    }

    // 上次选中的存盘 Folder ID
    let selectedSaveGroupId = localStorage.getItem("selected_save_group_id");
    if (!selectedSaveGroupId && foldersData.length > 0) {
        selectedSaveGroupId = foldersData[0].id;
    }

    const selectYear = document.getElementById("select-year");
    const selectMonth = document.getElementById("select-month");
    const selectDay = document.getElementById("select-day");
    const calendarDays = document.getElementById("calendar-days");
    const lunarHeader = document.getElementById("lunar-info-header");
    const foldersContainer = document.getElementById("sidebar-folders-container");
    const btnNewGroup = document.getElementById("btn-new-group");

    // 自定义右键菜单元素（文件夹）
    const contextMenu = document.getElementById("folder-context-menu");
    const menuRename = document.getElementById("menu-rename");
    const menuDelete = document.getElementById("menu-delete");
    let activeRightClickedFolderId = null;

    // 自定义右键菜单元素（提醒卡片）
    const cardContextMenu = document.getElementById("card-context-menu");
    const cardMenuRename = document.getElementById("card-menu-rename");
    const cardMenuDelete = document.getElementById("card-menu-delete");
    let activeRightClickedCardId = null;
    let activeRightClickedCardGroupId = null;

    // 常用英文月份缩写与全称
    const monthNamesAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthFullNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

    // 判断群组类型的辅助函数
    const isBirthdayGroup = (g) => {
        if (!g) return false;
        const name = (g.name || "").toLowerCase();
        const id = (g.id || "").toLowerCase();
        return id === "group-birthdays" || name.includes("生日") || name.includes("birthday");
    };

    const isFestivalGroup = (g) => {
        if (!g) return false;
        const name = (g.name || "").toLowerCase();
        const id = (g.id || "").toLowerCase();
        return id === "group-festivals" || name.includes("节日") || name.includes("festival");
    };

    const isTaskGroup = (g) => {
        if (!g) return false;
        const name = (g.name || "").toLowerCase();
        const id = (g.id || "").toLowerCase();
        return id === "group-tasks" || name.includes("任务") || name.includes("task");
    };

    // 华人节日及二十四节气数据 (用于公历节日渲染)
    const festivals = [
        { month: 0, day: 1, name: "元旦新年" },
        { month: 1, day: 14, name: "情人节" },
        { month: 3, day: 22, name: "世界地球日" },
        { month: 4, day: 1, name: "劳动节" },
        { month: 4, day: 12, name: "卫塞节 浴佛" },
        { month: 4, day: 31, name: "端午节" },
        { month: 5, day: 15, name: "父亲节" },
        { month: 7, day: 31, name: "国庆日" },
        { month: 8, day: 16, name: "马来西亚成立日" },
        { month: 9, day: 6, name: "中秋节" },
        { month: 9, day: 31, name: "万圣节" },
        { month: 11, day: 25, name: "圣诞节" }
    ];

    // 格式化卡片的日期为显示文本
    const formatDateStr = (year, month, day) => {
        if (day !== null && day !== undefined) {
            return `${day} ${monthNamesAbbr[month]} ${year}`;
        } else {
            return `${monthNamesAbbr[month]} ${year}`;
        }
    };

    // 精准解析单个日期字符串的辅助函数
    const parseSingleDate = (str, defaultYear) => {
        let year = defaultYear;
        let hasYear = false;
        let month = 0;
        let hasMonth = false;
        let day = null;

        const yearMatch = str.match(/\b(19\d{2}|20\d{2}|21\d{2})\b/);
        if (yearMatch) {
            year = parseInt(yearMatch[1]);
            hasYear = true;
        }

        let foundMonth = false;
        for (let i = 0; i < 12; i++) {
            if (str.includes(monthNamesAbbr[i].toLowerCase()) || str.includes(monthFullNames[i])) {
                month = i;
                foundMonth = true;
                break;
            }
        }
        if (!foundMonth) {
            const cnMonthMatch = str.match(/(\d{1,2})\s*月/);
            if (cnMonthMatch) {
                const mVal = parseInt(cnMonthMatch[1]);
                if (mVal >= 1 && mVal <= 12) {
                    month = mVal - 1;
                    foundMonth = true;
                }
            }
        }
        if (!foundMonth) {
            const cnNumsMap = {
                "一": 0, "二": 1, "三": 2, "四": 3, "五": 4, "六": 5,
                "七": 6, "八": 7, "九": 8, "十": 9, "十一": 10, "十二": 11,
                "正": 0, "冬": 10, "腊": 11
            };
            const cnMonthWordMatch = str.match(/([一二三四五六七八九十十一十二正冬腊]+)\s*月/);
            if (cnMonthWordMatch) {
                const mStr = cnMonthWordMatch[1];
                if (cnNumsMap[mStr] !== undefined) {
                    month = cnNumsMap[mStr];
                    foundMonth = true;
                }
            }
        }
        hasMonth = foundMonth;

        let cleanStr = str;
        if (yearMatch) {
            cleanStr = str.replace(yearMatch[0], "");
        }
        
        const cnDayMatch = cleanStr.match(/(\d{1,2})\s*日/);
        if (cnDayMatch) {
            day = parseInt(cnDayMatch[1]);
        } else {
            const numbers = cleanStr.match(/\b\d{1,2}\b/g);
            if (numbers && numbers.length > 0) {
                const dVal = parseInt(numbers[0]);
                if (dVal >= 1 && dVal <= 31) {
                    day = dVal;
                }
            }
        }

        return { year, month, day, hasYear, hasMonth };
    };

    // 精准解析卡片中的日期格式，支持 "~" 或 "到" 分隔的区间
    const parseCardDate = (dateStr, defaultYear) => {
        if (!dateStr) return { year: defaultYear, month: 0, day: 1, hasYear: false, hasEndDate: false };
        let str = dateStr.toLowerCase().trim();
        
        let startStr = str;
        let endStr = null;
        
        if (str.includes("~")) {
            const parts = str.split("~");
            startStr = parts[0];
            endStr = parts[1];
        } else if (str.includes("到")) {
            const parts = str.split("到");
            startStr = parts[0];
            endStr = parts[1];
        } else if (str.includes("-")) {
            const parts = str.split("-");
            startStr = parts[0];
            endStr = parts[1];
        } else if (str.includes("至")) {
            const parts = str.split("至");
            startStr = parts[0];
            endStr = parts[1];
        }
        
        const startParsed = parseSingleDate(startStr, defaultYear);
        const result = {
            year: startParsed.year,
            month: startParsed.month,
            day: startParsed.day,
            hasYear: startParsed.hasYear,
            hasEndDate: false
        };
        
        if (endStr) {
            const endParsed = parseSingleDate(endStr, defaultYear);
            result.hasEndDate = true;
            result.endYear = endParsed.hasYear ? endParsed.year : result.year;
            result.endMonth = endParsed.hasMonth ? endParsed.month : result.month;
            result.endDay = endParsed.day;
            result.hasEndYear = endParsed.hasYear;
        }
        
        return result;
    };

    // 使用 lunar-javascript 获取精准农历日期
    const getLunarDateStr = (y, m, d) => {
        try {
            const solar = Solar.fromYmd(y, m + 1, d);
            const lunar = solar.getLunar();
            const lDay = lunar.getDayInChinese();
            // 在初一时显示月份（例如“正月”、“五月”等）
            if (lDay === "初一") {
                const mName = lunar.getMonthInChinese();
                // 农历11月和12月由于字数较多，省略“月”字以保持两字对齐
                if (mName === "冬" || mName === "十一") {
                    return { text: "十一", isMonthStart: true };
                }
                if (mName === "腊" || mName === "十二") {
                    return { text: "十二", isMonthStart: true };
                }
                if (mName === "闰冬" || mName === "闰十一") {
                    return { text: "闰十一", isMonthStart: true };
                }
                if (mName === "闰腊" || mName === "闰十二") {
                    return { text: "闰十二", isMonthStart: true };
                }
                return { text: mName + "月", isMonthStart: true };
            }
            return { text: lDay, isMonthStart: false };
        } catch (e) {
            console.error("Lunar conversion error:", e);
            return { text: "初一", isMonthStart: true };
        }
    };

    // 保存数据到 LocalStorage
    const saveData = () => {
        localStorage.setItem("reminders_folders", JSON.stringify(foldersData));
        localStorage.setItem("selected_save_group_id", selectedSaveGroupId);
    };

    // 渲染左侧的文件夹及卡片
    const renderFolders = () => {
        foldersContainer.innerHTML = "";
        
        foldersData.forEach(group => {
            if (group.visible === undefined) {
                group.visible = true;
            }
            const groupEl = document.createElement("div");
            groupEl.className = `reminder-group ${group.collapsed ? "collapsed" : ""} ${group.visible ? "" : "hidden-reminders"}`;
            groupEl.id = group.id;

            // 文件夹头部 (Folder Title)
            const titleEl = document.createElement("div");
            titleEl.className = "group-title";

            // 左侧折叠图标与名称
            const titleLeft = document.createElement("div");
            titleLeft.className = "folder-title-left";
            titleLeft.innerHTML = `<span class="folder-icon">📂</span> <span class="folder-name-text">${group.name}</span>`;
            
            // 隐藏/开启日期提醒开关
            const visibilityToggle = document.createElement("span");
            visibilityToggle.className = `folder-visibility-toggle ${group.visible ? "visible" : "hidden"}`;
            visibilityToggle.title = group.visible ? "点击关闭此群组的日期提醒" : "点击开启此群组的日期提醒";
            visibilityToggle.innerHTML = group.visible ? "👁️" : "🙈";

            // 右侧空点圈 (单点击选中作为存盘目的地)
            const circleSelect = document.createElement("span");
            circleSelect.className = `folder-circle-select ${selectedSaveGroupId === group.id ? "selected" : ""}`;
            circleSelect.title = "设为存盘在此分组";

            titleEl.appendChild(titleLeft);
            titleEl.appendChild(visibilityToggle);
            titleEl.appendChild(circleSelect);
            groupEl.appendChild(titleEl);

            // 卡片容器
            const cardListEl = document.createElement("div");
            cardListEl.className = "card-list";
            
            group.cards.forEach(card => {
                const cardEl = document.createElement("div");
                cardEl.className = "reminder-card";
                cardEl.id = card.id; // 赋予 DOM id，方便重命名操作时提取
                cardEl.innerHTML = `
                    <div class="card-info">
                        <div class="card-title">${card.title}</div>
                        <div class="card-date">${card.dateStr}</div>
                    </div>
                `;
                
                const trackToCalendar = (showMenu) => {
                    const parsed = parseCardDate(card.dateStr, currentYear);
                    const isRecur = !parsed.hasYear || isBirthdayGroup(group) || isFestivalGroup(group);
                    if (!isRecur) {
                        currentYear = parsed.year;
                    }
                    currentMonth = parsed.month;
                    currentDay = (parsed.day !== null && parsed.day !== undefined) ? parsed.day : 1;
                    
                    // 记录当前卡片需要高亮的特定日期
                    highlightedDate = {
                        year: currentYear,
                        month: currentMonth,
                        day: (parsed.day !== null && parsed.day !== undefined) ? parsed.day : null,
                        isRecurring: isRecur,
                        hasEndDate: parsed.hasEndDate,
                        endYear: parsed.endYear,
                        endMonth: parsed.endMonth,
                        endDay: parsed.endDay
                    };

                    // 同步更新顶部选择下拉框
                    selectYear.value = currentYear;
                    selectMonth.value = currentMonth;
                    initDaySelect(currentDay);
                    selectDay.value = currentDay;
                    
                    // 自动切换到日历视图
                    viewFolders.classList.remove("active");
                    viewCalendar.classList.add("active");
                    navBtnList.classList.remove("active");
                    navBtnCalendar.classList.add("active");

                    // 重新渲染该月日历
                    renderCalendar(currentYear, currentMonth);

                    if (showMenu) {
                        setTimeout(() => {
                            const targetCell = document.querySelector(".day-cell.highlighted-target");
                            if (targetCell) {
                                activeRightClickedCardId = card.id;
                                activeRightClickedCardGroupId = group.id;

                                const rect = targetCell.getBoundingClientRect();
                                const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                                const scrollY = window.pageYOffset || document.documentElement.scrollTop;

                                contextMenu.style.display = "none";
                                cardContextMenu.style.display = "block";
                                cardContextMenu.style.left = `${rect.left + rect.width / 2 + scrollX}px`;
                                cardContextMenu.style.top = `${rect.top + rect.height / 2 + scrollY}px`;
                            }
                        }, 120);
                    } else {
                        contextMenu.style.display = "none";
                        cardContextMenu.style.display = "none";
                    }
                };

                // 单击卡片自动跳转日历到对应的年月及日子
                cardEl.addEventListener("click", (e) => {
                    const tag = e.target.tagName.toLowerCase();
                    if (tag === "input" || tag === "button") return;
                    trackToCalendar(false);
                });

                // 右键上下文菜单事件 -> 追踪到日历，并在高亮的日期格子上弹出菜单
                cardEl.addEventListener("contextmenu", (e) => {
                    const tag = e.target.tagName.toLowerCase();
                    if (tag === "input" || tag === "button") return;
                    e.preventDefault();
                    e.stopPropagation(); // 阻止事件冒泡到父文件夹
                    if (!isTouchDevice) {
                        trackToCalendar(true);
                    }
                });

                // 手机端手势：3秒弹出重命名/删除菜单
                addDualPressListener(cardEl, 
                    null,
                    (e) => {
                        e.stopPropagation();
                        activeRightClickedCardId = card.id;
                        activeRightClickedCardGroupId = group.id;
                        
                        // 由于 3 秒后 e.touches 往往已经清空（浏览器回收了事件对象），
                        // 这里直接使用卡片元素的中心位置来弹出菜单，这是最稳妥的！
                        const rect = cardEl.getBoundingClientRect();
                        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

                        contextMenu.style.display = "none";
                        cardContextMenu.style.display = "block";
                        cardContextMenu.style.left = `${rect.left + rect.width / 2 + scrollX}px`;
                        cardContextMenu.style.top = `${rect.top + rect.height / 2 + scrollY}px`;
                    },
                    true // fire100OnEnd
                );

                cardListEl.appendChild(cardEl);
            });

            groupEl.appendChild(cardListEl);
            foldersContainer.appendChild(groupEl);

            // === 绑定文件夹交互事件 ===

            // 1. 单击文件夹行：既切换折叠/展开状态，又选择其为存盘目的地
            titleEl.addEventListener("click", (e) => {
                if (e.target.classList.contains("folder-circle-select") || e.target.classList.contains("folder-visibility-toggle")) return;
                
                // 选择存盘目的地
                selectedSaveGroupId = group.id;
                document.querySelectorAll(".folder-circle-select").forEach(el => {
                    el.classList.remove("selected");
                });
                circleSelect.classList.add("selected");

                // 切换折叠/展开状态
                group.collapsed = !group.collapsed;
                groupEl.classList.toggle("collapsed", group.collapsed);
                
                saveData();
            });

            // 3. 点击空点圈作为存档地
            circleSelect.addEventListener("click", (e) => {
                e.stopPropagation();
                selectedSaveGroupId = group.id;
                saveData();
                document.querySelectorAll(".folder-circle-select").forEach(el => {
                    el.classList.remove("selected");
                });
                circleSelect.classList.add("selected");
            });

            // 4. 点击开关控制日期提醒
            visibilityToggle.addEventListener("click", (e) => {
                e.stopPropagation();
                group.visible = !group.visible;
                saveData();
                renderFolders();
                renderCalendar(currentYear, currentMonth);
            });

            // 5. 右键菜单
            titleEl.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                if (!isTouchDevice) {
                    activeRightClickedFolderId = group.id;
                    contextMenu.style.display = "block";
                    contextMenu.style.left = `${e.pageX}px`;
                    contextMenu.style.top = `${e.pageY}px`;
                }
            });

            // 5. 手机长按菜单
            addLongPressListener(titleEl, (e) => {
                const touch = e.touches[0];
                activeRightClickedFolderId = group.id;
                contextMenu.style.display = "block";
                contextMenu.style.left = `${touch.pageX}px`;
                contextMenu.style.top = `${touch.pageY}px`;
            });
        });
    };

    // 新增群组功能
    btnNewGroup.addEventListener("click", () => {
        if (foldersContainer.querySelector(".new-group-input-row")) return;

        const inputRow = document.createElement("div");
        inputRow.className = "new-group-input-row";
        inputRow.innerHTML = `
            <span class="folder-icon">📁</span>
            <input type="text" class="new-group-name-input" placeholder="输入群组名称..." maxlength="30" autofocus />
            <button class="new-group-confirm-btn" title="确认">✔</button>
            <button class="new-group-cancel-btn" title="取消">✖</button>
        `;
        foldersContainer.insertBefore(inputRow, foldersContainer.firstChild);

        const nameInput = inputRow.querySelector(".new-group-name-input");
        const confirmBtn = inputRow.querySelector(".new-group-confirm-btn");
        const cancelBtn = inputRow.querySelector(".new-group-cancel-btn");

        nameInput.focus();

        const confirmCreate = () => {
            const groupName = nameInput.value.trim();
            if (!groupName) {
                nameInput.focus();
                nameInput.style.border = "2px solid var(--color-sunday)";
                return;
            }
            const newId = `group-${Date.now()}`;
            foldersData.push({
                id: newId,
                name: groupName,
                collapsed: false,
                cards: []
            });
            selectedSaveGroupId = newId;
            saveData();
            renderFolders();
        };

        const cancelCreate = () => {
            inputRow.remove();
        };

        confirmBtn.addEventListener("click", confirmCreate);
        cancelBtn.addEventListener("click", cancelCreate);

        nameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") confirmCreate();
            if (e.key === "Escape") cancelCreate();
        });
    });

    // 右键重命名
    menuRename.addEventListener("click", () => {
        if (!activeRightClickedFolderId) return;
        contextMenu.style.display = "none";

        const targetGroup = foldersData.find(g => g.id === activeRightClickedFolderId);
        if (!targetGroup) return;

        const groupEl = document.getElementById(activeRightClickedFolderId);
        if (!groupEl) return;
        const nameSpan = groupEl.querySelector(".folder-name-text");
        if (!nameSpan) return;

        const oldName = targetGroup.name;
        const renameInput = document.createElement("input");
        renameInput.type = "text";
        renameInput.className = "new-group-name-input";
        renameInput.value = oldName;
        renameInput.style.width = "110px";
        nameSpan.replaceWith(renameInput);
        renameInput.focus();
        renameInput.select();

        const applyRename = () => {
            const newName = renameInput.value.trim();
            targetGroup.name = newName || oldName;
            saveData();
            renderFolders();
        };

        renameInput.addEventListener("blur", applyRename);
        renameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") renameInput.blur();
            if (e.key === "Escape") {
                targetGroup.name = oldName;
                renderFolders();
            }
        });
    });

    // 右键删除
    menuDelete.addEventListener("click", () => {
        if (!activeRightClickedFolderId) return;
        const targetGroup = foldersData.find(g => g.id === activeRightClickedFolderId);
        if (targetGroup) {
            if (confirm(`确定要删除 Folder "${targetGroup.name}" 及其所有数据吗？`)) {
                foldersData = foldersData.filter(g => g.id !== activeRightClickedFolderId);
                if (selectedSaveGroupId === activeRightClickedFolderId) {
                    selectedSaveGroupId = foldersData.length > 0 ? foldersData[0].id : null;
                }
                saveData();
                renderFolders();
            }
        }
        contextMenu.style.display = "none";
    });

    // 提醒卡片右键重命名 (原地双输入框无缝修改标题和时间)
    cardMenuRename.addEventListener("click", () => {
        if (!activeRightClickedCardId || !activeRightClickedCardGroupId) return;
        cardContextMenu.style.display = "none";

        const targetGroup = foldersData.find(g => g.id === activeRightClickedCardGroupId);
        if (!targetGroup) return;
        const targetCard = targetGroup.cards.find(c => c.id === activeRightClickedCardId);
        if (!targetCard) return;

        const cardEl = document.getElementById(activeRightClickedCardId);
        if (!cardEl) return;

        const titleEl = cardEl.querySelector(".card-title");
        const dateEl = cardEl.querySelector(".card-date");
        if (!titleEl || !dateEl) return;

        const oldTitle = targetCard.title;
        const oldDate = targetCard.dateStr;

        // 原地快速替换为输入编辑框
        const titleInput = document.createElement("input");
        titleInput.type = "text";
        titleInput.className = "new-group-name-input";
        titleInput.value = oldTitle;
        titleInput.style.width = "100%";
        titleInput.style.marginBottom = "4px";

        const dateInput = document.createElement("input");
        dateInput.type = "text";
        dateInput.className = "new-group-name-input";
        dateInput.value = oldDate;
        dateInput.style.width = "100%";

        const actionsRow = document.createElement("div");
        actionsRow.style.display = "flex";
        actionsRow.style.gap = "6px";
        actionsRow.style.marginTop = "6px";
        actionsRow.style.justifyContent = "flex-end";

        const btnConfirm = document.createElement("button");
        btnConfirm.textContent = "完成";
        btnConfirm.className = "cute-btn";
        btnConfirm.style.backgroundColor = "var(--color-weekday)";
        btnConfirm.style.color = "#fff";
        btnConfirm.style.border = "none";
        btnConfirm.style.padding = "4px 10px";

        const btnCancel = document.createElement("button");
        btnCancel.textContent = "取消";
        btnCancel.className = "cute-btn";
        btnCancel.style.backgroundColor = "#eee";
        btnCancel.style.color = "#666";
        btnCancel.style.border = "none";
        btnCancel.style.padding = "4px 10px";

        actionsRow.appendChild(btnCancel);
        actionsRow.appendChild(btnConfirm);

        titleEl.replaceWith(titleInput);
        dateEl.replaceWith(dateInput);
        
        const cardInfo = cardEl.querySelector(".card-info");
        cardInfo.appendChild(actionsRow);

        titleInput.focus();
        titleInput.select();

        let finished = false;
        let isCancelling = false;

        const applyEdit = () => {
            if (finished) return;
            finished = true;

            const newTitle = titleInput.value.trim();
            const newDate = dateInput.value.trim();

            targetCard.title = newTitle || oldTitle;
            targetCard.dateStr = newDate || oldDate;

            saveData();
            renderFolders();
            renderCalendar(currentYear, currentMonth); // 同步刷新右侧日历
        };

        const cancelEdit = () => {
            if (finished) return;
            finished = true;
            renderFolders();
        };

        btnCancel.addEventListener("mousedown", () => { isCancelling = true; });
        btnCancel.addEventListener("touchstart", () => { isCancelling = true; }, {passive: true});
        btnCancel.addEventListener("click", cancelEdit);

        btnConfirm.addEventListener("mousedown", () => { isCancelling = false; });
        btnConfirm.addEventListener("touchstart", () => { isCancelling = false; }, {passive: true});
        btnConfirm.addEventListener("click", applyEdit);

        const checkBlur = () => {
            setTimeout(() => {
                if (!isCancelling && document.activeElement !== titleInput && document.activeElement !== dateInput) {
                    applyEdit();
                }
            }, 150);
        };

        titleInput.addEventListener("blur", checkBlur);
        dateInput.addEventListener("blur", checkBlur);

        const handleKeys = (e) => {
            if (e.key === "Enter") applyEdit();
            if (e.key === "Escape") cancelEdit();
        };
        titleInput.addEventListener("keydown", handleKeys);
        dateInput.addEventListener("keydown", handleKeys);
    });

    // 提醒卡片右键删除
    cardMenuDelete.addEventListener("click", () => {
        if (!activeRightClickedCardId || !activeRightClickedCardGroupId) return;
        cardContextMenu.style.display = "none";

        const targetGroup = foldersData.find(g => g.id === activeRightClickedCardGroupId);
        if (targetGroup) {
            const targetCard = targetGroup.cards.find(c => c.id === activeRightClickedCardId);
            const cardName = targetCard ? targetCard.title : "此卡片";
            if (confirm(`确定要删除提醒卡片 "${cardName}" 吗？`)) {
                targetGroup.cards = targetGroup.cards.filter(c => c.id !== activeRightClickedCardId);
                saveData();
                renderFolders();
                renderCalendar(currentYear, currentMonth); // 同步更新日历渲染
            }
        }
    });

    // 点击空白处关闭所有自定义右键上下文菜单，同时清除左栏卡片高亮
    document.addEventListener("click", () => {
        contextMenu.style.display = "none";
        cardContextMenu.style.display = "none";
        document.querySelectorAll(".reminder-card.sidebar-highlight").forEach(el => {
            el.classList.remove("sidebar-highlight");
        });
        const tooltip = document.getElementById("event-tag-tooltip");
        if (tooltip) {
            tooltip.style.opacity = "0";
            setTimeout(() => { tooltip.style.display = "none"; }, 150);
        }
    });

    // 根据月份判断节气主题色 (不显示标签，暗地里计算)
    const getJieQiColorTheme = (solar) => {
        // solar.getMonth() 返回 1-12，对应 1月到12月
        const m = solar.getMonth(); 
        if (m === 2 || m === 3 || m === 4) {
            return "wood";  // 春季：2月(立春/雨水), 3月(惊蛰/春分), 4月(清明/谷雨)
        } else if (m === 5 || m === 6 || m === 7) {
            return "fire";  // 夏季：5月(立夏/小满), 6月(芒种/夏至), 7月(小暑/大暑)
        } else if (m === 8 || m === 9 || m === 10) {
            return "gold";  // 秋季：8月(立秋/处暑), 9月(白露/秋分), 10月(寒露/霜降)
        } else {
            return "water"; // 冬季：11月(立冬/小雪), 12月(大雪/冬至), 1月(小寒/大寒)
        }
    };

    // 根据具体每一天精准计算所在节气的颜色（精确到天，不随月份一刀切）
    const getPreciseJieQiColor = (solar) => {
        try {
            const lunar = solar.getLunar();
            const jqTable = lunar.getJieQiTable(); 
            
            const liChun = jqTable["立春"];
            const liXia = jqTable["立夏"];
            const liQiu = jqTable["立秋"];
            const liDong = jqTable["立冬"];
            
            if (liChun && liXia && liQiu && liDong) {
                const currentDate = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay()).getTime();
                const dLiChun = new Date(liChun.getYear(), liChun.getMonth() - 1, liChun.getDay()).getTime();
                const dLiXia = new Date(liXia.getYear(), liXia.getMonth() - 1, liXia.getDay()).getTime();
                const dLiQiu = new Date(liQiu.getYear(), liQiu.getMonth() - 1, liQiu.getDay()).getTime();
                const dLiDong = new Date(liDong.getYear(), liDong.getMonth() - 1, liDong.getDay()).getTime();
                
                if (currentDate >= dLiChun && currentDate < dLiXia) {
                    return "wood";
                } else if (currentDate >= dLiXia && currentDate < dLiQiu) {
                    return "fire";
                } else if (currentDate >= dLiQiu && currentDate < dLiDong) {
                    return "gold";
                } else {
                    return "water";
                }
            }
        } catch (e) {
            console.error("JieQi table error:", e);
        }
        
        // 兜底方案
        const m = solar.getMonth(); 
        const d = solar.getDay();
        const val = m * 100 + d;
        if (val >= 204 && val < 505) {
            return "wood"; 
        } else if (val >= 505 && val < 807) {
            return "fire"; 
        } else if (val >= 807 && val < 1107) {
            return "gold"; 
        } else {
            return "water"; 
        }
    };

    let currentMonthMultiDayTracksMap = {};

    // 渲染右侧日历网格
    const renderCalendar = (year, month) => {
        // --- 预处理当前月所有跨天事件，分配固定 Color Index ---
        currentMonthMultiDayTracksMap = {};
        
        const monthStart = new Date(year, month, 1).getTime();
        const monthEnd = new Date(year, month + 1, 0).getTime();
        
        let activeMultiDayEvents = [];
        
        foldersData.forEach(group => {
            if (group.visible === false) return;
            group.cards.forEach(card => {
                const parsed = parseCardDate(card.dateStr, year);
                if (!parsed.hasEndDate) return;
                
                const isRecurring = !parsed.hasYear || isBirthdayGroup(group) || isFestivalGroup(group);
                
                const sYear = isRecurring ? year : parsed.year;
                const sMonth = parsed.month;
                const sDay = parsed.day || 1;

                let eYear = isRecurring ? year : parsed.endYear;
                const eMonth = parsed.endMonth;
                const eDay = parsed.endDay || 1;
                
                if (isRecurring && eMonth < sMonth) {
                    if (month <= eMonth) eYear = year;
                    else eYear = year + 1;
                }

                const startTime = new Date(isRecurring && month <= eMonth && eMonth < sMonth ? year - 1 : sYear, sMonth, sDay).getTime();
                const endTime = new Date(eYear, eMonth, eDay).getTime();

                // 2天以上的行程才加入高亮
                const durationDays = Math.round((endTime - startTime) / (24 * 60 * 60 * 1000)) + 1;
                if (durationDays < 2) return;

                if (endTime >= monthStart && startTime <= monthEnd) {
                    activeMultiDayEvents.push({
                        id: card.id,
                        startTime: startTime,
                        endTime: endTime,
                        colorIndex: 0
                    });
                }
            });
        });

        // 排序规则：先按开始时间，然后按结束时间
        activeMultiDayEvents.sort((a, b) => {
            if (a.startTime !== b.startTime) return a.startTime - b.startTime;
            return a.endTime - b.endTime;
        });

        activeMultiDayEvents.forEach((evt, idx) => {
            evt.colorIndex = (idx % 5) + 1;
            currentMonthMultiDayTracksMap[evt.id] = evt;
        });
        // --- 预处理结束 ---
        // 根据当月1号动态计算并更新对应的节气色主题类名
        try {
            const solar = Solar.fromYmd(year, month + 1, 1);
            const theme = getJieQiColorTheme(solar);
            const borderWrapper = document.querySelector(".calendar-border-wrapper");
            if (borderWrapper) {
                borderWrapper.classList.remove("theme-wood", "theme-fire", "theme-gold", "theme-water");
                borderWrapper.classList.add(`theme-${theme}`);
            }
        } catch (e) {
            console.error("Error setting JieQi theme:", e);
        }

        calendarDays.innerHTML = "";

        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const prevTotalDays = new Date(year, month, 0).getDate();

        let startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

        // 动态计算本月实际需要几列（几周）
        const numWeeks = Math.ceil((startOffset + totalDays) / 7);
        const totalCells = numWeeks * 7;

        // 动态更新 grid 列数（1 星期表头列 + numWeeks 数据列）
        calendarDays.style.gridTemplateColumns = `32px repeat(${numWeeks}, 1fr)`;

        // 构建扁平数据数组（精确格子数）
        const daysData = [];

        // 1. 填充上月余格
        for (let i = startOffset - 1; i >= 0; i--) {
            const dayNum = prevTotalDays - i;
            const prevMonth = month === 0 ? 11 : month - 1;
            const prevYear = month === 0 ? year - 1 : year;
            daysData.push({ year: prevYear, month: prevMonth, day: dayNum, isDimmed: true });
        }

        // 2. 填充当月
        for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
            daysData.push({ year: year, month: month, day: dayNum, isDimmed: false });
        }

        // 3. 填充下月余格（只填到 totalCells，不再硬编码 42）
        const remainingCells = totalCells - startOffset - totalDays;
        for (let i = 1; i <= remainingCells; i++) {
            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;
            daysData.push({ year: nextYear, month: nextMonth, day: i, isDimmed: true });
        }

        // 以星期几分行构建：7行，每行 1(表头) + numWeeks(周跨度格子)
        const weekDayNames = ["一", "二", "三", "四", "五", "六", "日"];
        const cssWeekClasses = ["weekday-1", "weekday-2", "weekday-3", "weekday-4", "weekday-5", "weekday-6", "weekday-0"];

        for (let r = 0; r < 7; r++) {
            // 插入最左侧的竖排星期标题格
            const rowHeader = document.createElement("div");
            rowHeader.className = `week-row-header ${cssWeekClasses[r]}`;
            rowHeader.innerHTML = `星<br>期<br>${weekDayNames[r]}`;
            calendarDays.appendChild(rowHeader);

            // 插入本行对应的 numWeeks 个日历格
            for (let c = 0; c < numWeeks; c++) {
                const cellData = daysData[c * 7 + r];
                createDayCell(cellData.year, cellData.month, cellData.day, cellData.isDimmed);
            }
        }

        updateLunarHeader(year, month, currentDay);
    };

    const createDayCell = (year, month, day, isDimmed) => {
        const cell = document.createElement("div");
        cell.className = "day-cell";
        if (isDimmed) {
            cell.classList.add("dimmed");
            // 用户要求不要显示上月或下月的日期和内容，直接渲染空白格子
            calendarDays.appendChild(cell);
            return;
        }

        const dateObj = new Date(year, month, day);
        const dayOfWeek = dateObj.getDay();

        if (dayOfWeek === 6) {
            cell.classList.add("sat");
        } else if (dayOfWeek === 0) {
            cell.classList.add("sun");
        }

        const today = new Date();
        if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day && !isDimmed) {
            cell.classList.add("today");
        }

        // 检查该格子是否是双击定位的卡片提醒日期，并添加高亮标记
        if (highlightedDate && !isDimmed) {
            let isMatch = false;
            if (highlightedDate.isRecurring) {
                // 生日与节日：跨年重复，只匹配月份和日子
                isMatch = (highlightedDate.month === month && highlightedDate.day === day);
            } else {
                // 任务卡片等常规提醒：精确匹配年、月、日，或日期区间
                if (highlightedDate.hasEndDate && highlightedDate.day && highlightedDate.endDay) {
                    const currentCellTime = new Date(year, month, day).getTime();
                    const startTime = new Date(highlightedDate.year, highlightedDate.month, highlightedDate.day).getTime();
                    const endTime = new Date(highlightedDate.endYear, highlightedDate.endMonth, highlightedDate.endDay).getTime();
                    isMatch = (currentCellTime >= startTime && currentCellTime <= endTime);
                } else {
                    isMatch = (highlightedDate.year === year && highlightedDate.month === month && highlightedDate.day === day);
                }
            }
            if (isMatch) {
                cell.classList.add("highlighted-target");
            }
        }

        const header = document.createElement("div");
        header.className = "day-header";

        const solarSpan = document.createElement("span");
        solarSpan.className = "solar-date";
        solarSpan.textContent = String(day).padStart(2, "0");

        const lunarData = getLunarDateStr(year, month, day);
        const lunarSpan = document.createElement("span");
        lunarSpan.className = "lunar-date";
        if (lunarData.isMonthStart) {
            lunarSpan.classList.add("is-month-start");
        }
        lunarSpan.textContent = lunarData.text;

        header.appendChild(solarSpan);
        header.appendChild(lunarSpan);
        cell.appendChild(header);

        // 渲染标签的容器
        const tagsContainer = document.createElement("div");
        tagsContainer.className = "event-tags-container";

        // 1. 匹配并收集当前日期的用户卡片提醒
        const activeCards = [];
        const dayHighlights = []; // 收集当日所有跨天高亮颜色索引

        foldersData.forEach(group => {
            if (group.visible === false) return;
            group.cards.forEach(card => {
                const parsed = parseCardDate(card.dateStr, year);
                
                // 如果卡片没有指定年份，或者属于生日群组，判定为每年重复
                const isRecurring = !parsed.hasYear || isBirthdayGroup(group) || isFestivalGroup(group);
                
                let matchesStart = false;
                let isInRange = false;

                const currentDateTime = new Date(year, month, day).getTime();

                if (parsed.hasEndDate) {
                    // 从预处理中获取事件的分配
                    const trackInfo = currentMonthMultiDayTracksMap[card.id];
                    if (trackInfo && currentDateTime >= trackInfo.startTime && currentDateTime <= trackInfo.endTime) {
                        isInRange = true;
                        dayHighlights.push(trackInfo.colorIndex); // 收集底色
                        if (currentDateTime === trackInfo.startTime) {
                            matchesStart = true;
                        }
                    }
                } else {
                    // 单天判断
                    if (isRecurring) {
                        if (parsed.day !== null && parsed.day !== undefined) {
                            matchesStart = (parsed.month === month && parsed.day === day);
                        } else {
                            matchesStart = (parsed.month === month && day === 1);
                        }
                    } else {
                        if (parsed.day !== null && parsed.day !== undefined) {
                            matchesStart = (parsed.year === year && parsed.month === month && parsed.day === day);
                        } else {
                            matchesStart = (parsed.year === year && parsed.month === month && day === 1);
                        }
                    }
                    if (matchesStart) isInRange = true;
                }

                if (!isDimmed) {
                    if (isInRange) {
                        // 只有符合开始日期时才推入 activeCards 以渲染标签
                        if (!parsed.hasEndDate || matchesStart) {
                            activeCards.push({
                                title: card.title,
                                group: group,
                                cardId: card.id
                            });
                        }
                    }
                }
            });
        });

        // 渲染高亮叠色遮罩（仅限非 dimmed 格子）
        if (!isDimmed && dayHighlights.length > 0) {
            dayHighlights.forEach(colorIdx => {
                const hlDiv = document.createElement("div");
                hlDiv.className = `day-cell-highlight multi-day-highlight-${colorIdx}`;
                cell.appendChild(hlDiv);
            });
        }

        // 2. 渲染用户卡片提醒
        activeCards.forEach(card => {
            const tag = document.createElement("span");
            tag.className = "event-tag";
            
            // 获取该天精确的节气颜色 (不受月份的一刀切影响)
            const solarDay = Solar.fromYmd(year, month + 1, day);
            const preciseTheme = getPreciseJieQiColor(solarDay);
            if (preciseTheme === "wood") {
                tag.style.backgroundColor = "#6e943d";
            } else if (preciseTheme === "fire") {
                tag.style.backgroundColor = "#FF9999";
            } else if (preciseTheme === "gold") {
                tag.style.backgroundColor = "#fab041";
            } else if (preciseTheme === "water") {
                tag.style.backgroundColor = "#1688b5";
            }

            tag.textContent = card.title;
            tag.title = card.title;

            // 手指或滑鼠 → 显示浮动完整文字 tooltip
            const showTagTooltip = (e) => {
                let tooltip = document.getElementById("event-tag-tooltip");
                if (!tooltip) {
                    tooltip = document.createElement("div");
                    tooltip.id = "event-tag-tooltip";
                    tooltip.className = "event-tag-tooltip";
                    document.body.appendChild(tooltip);
                }
                tooltip.textContent = card.title;
                tooltip.style.backgroundColor = window.getComputedStyle(tag).backgroundColor;
                tooltip.style.display = "block";

                // 取得触发位置
                let clientX, clientY;
                if (e.touches && e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }

                // 确保 tooltip 不超出画面右边
                tooltip.style.left = "0px";
                tooltip.style.top = "-9999px";
                const tw = tooltip.offsetWidth;
                const vw = window.innerWidth;
                let left = clientX - 4;
                if (left + tw > vw - 4) left = vw - tw - 4;
                if (left < 4) left = 4;
                let top = clientY - tooltip.offsetHeight - 6;
                if (top < 4) top = clientY + 18;

                tooltip.style.left = left + "px";
                tooltip.style.top = top + "px";
                tooltip.style.opacity = "1";
            };

            const hideTagTooltip = () => {
                const tooltip = document.getElementById("event-tag-tooltip");
                if (tooltip) {
                    tooltip.style.opacity = "0";
                    setTimeout(() => { tooltip.style.display = "none"; }, 150);
                }
            };

            tag.addEventListener("mouseenter", showTagTooltip);
            tag.addEventListener("mouseleave", hideTagTooltip);

            // stickyTooltip: 久按标签后 tooltip 会保持显示，直到用户点其他地方
            let stickyTooltip = false;

            tag.addEventListener("touchend", () => {
                // 普通短触 -> 收起；久按后 sticky=true -> 保持显示
                if (!stickyTooltip) {
                    tag.classList.remove("expanded");
                    hideTagTooltip();
                }
            });
            tag.addEventListener("touchcancel", () => {
                stickyTooltip = false;
                tag.classList.remove("expanded");
                hideTagTooltip();
            });

            // Unified reverse tracking logic: switch views, expand folders, highlight cards
            const trackToSidebar = (evt, showMenu) => {
                evt.stopPropagation();
                evt.preventDefault();
                hideTagTooltip();

                // 1. Clear old highlights
                document.querySelectorAll(".reminder-card.sidebar-highlight").forEach(el => {
                    el.classList.remove("sidebar-highlight");
                });

                // 2. Expand collapsed source folders
                const parentGroup = foldersData.find(g => g.id === card.group.id);
                if (parentGroup && parentGroup.collapsed) {
                    parentGroup.collapsed = false;
                    const groupEl = document.getElementById(parentGroup.id);
                    if (groupEl) {
                        groupEl.classList.remove("collapsed");
                    }
                    saveData();
                }

                // 3. Switch to list view
                viewFolders.classList.add("active");
                viewCalendar.classList.remove("active");
                navBtnList.classList.add("active");
                navBtnCalendar.classList.remove("active");

                // 4. Highlight target card and optionally show context menu
                const targetCard = document.getElementById(card.cardId);
                if (targetCard) {
                    targetCard.classList.add("sidebar-highlight");
                    
                    setTimeout(() => {
                        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
                        
                        if (showMenu) {
                            activeRightClickedCardId = card.cardId;
                            activeRightClickedCardGroupId = card.group.id;

                            const rect = targetCard.getBoundingClientRect();
                            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                            const scrollY = window.pageYOffset || document.documentElement.scrollTop;

                            contextMenu.style.display = "none";
                            cardContextMenu.style.display = "block";
                            cardContextMenu.style.left = `${rect.left + rect.width / 2 + scrollX}px`;
                            cardContextMenu.style.top = `${rect.top + rect.height / 2 + scrollY}px`;
                        } else {
                            contextMenu.style.display = "none";
                            cardContextMenu.style.display = "none";
                        }
                    }, 120);
                }
            };

            // 单击：显示完整文字 tooltip
            tag.addEventListener("click", (e) => {
                e.stopPropagation();
                showTagTooltip(e);
            });

            // 双击：反追踪 → 切换到左侧栏，高亮源卡片（#ddbbd9），不弹菜单
            tag.addEventListener("dblclick", (e) => {
                trackToSidebar(e, false);
            });

            // 右键（桌面）：追踪到左侧栏 + 弹出重命名/删除菜单
            tag.addEventListener("contextmenu", (e) => {
                trackToSidebar(e, true);
            });

            // 手机端双阶手势：0.1秒全文，3秒反追踪+菜单
            addDualPressListener(tag, 
                (e) => {
                    stickyTooltip = true;
                    tag.classList.add("expanded");
                    showTagTooltip(e);
                },
                (e) => {
                    trackToSidebar(e, true);
                },
                false // fire100OnEnd = false (即 0.1 秒马上弹出 tooltip)
            );

            tagsContainer.appendChild(tag);
        });

        cell.appendChild(tagsContainer);
        calendarDays.appendChild(cell);
    };

    // 更新右上角农历和星期信息
    const updateLunarHeader = (year, month, day) => {
        try {
            const solar = Solar.fromYmd(year, month + 1, day);
            const lunar = solar.getLunar();
            const dayOfWeek = new Date(year, month, day).getDay();
            const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
            
            let weekClass = "weekday-1";
            if (dayOfWeek === 6) weekClass = "weekday-6";
            if (dayOfWeek === 0) weekClass = "weekday-0";

            const lDay = lunar.getDayInChinese();
            let lMonth = lunar.getMonthInChinese();
            if (lMonth === "冬" || lMonth === "十一") {
                lMonth = "十一月";
            } else if (lMonth === "腊" || lMonth === "十二") {
                lMonth = "十二月";
            } else if (lMonth === "闰冬" || lMonth === "闰十一") {
                lMonth = "闰十一月";
            } else if (lMonth === "闰腊" || lMonth === "闰十二") {
                lMonth = "闰十二月";
            } else if (!lMonth.endsWith("月")) {
                lMonth = lMonth + "月";
            }
            // 干支纪年切换完全以正月初一为交界点
            const lYear = lunar.getYearInGanZhi() + "年"; 

            lunarHeader.innerHTML = `${lYear} ${lMonth}${lDay} <span class="week-text ${weekClass}">${weekdays[dayOfWeek]}</span>`;
        } catch (e) {
            console.error("lunar-javascript header render error:", e);
            lunarHeader.innerHTML = `— — — <span class="week-text weekday-1">星期—</span>`;
        }
    };

    // 动态初始化三个西历下拉选择框
    const initYearSelect = () => {
        selectYear.innerHTML = '<option value="">无年</option>';
        for (let y = 2026; y <= 2126; y++) {
            const opt = document.createElement("option");
            opt.value = y;
            opt.textContent = y;
            if (y === currentYear) opt.selected = true;
            selectYear.appendChild(opt);
        }
    };

    const initDaySelect = (selectedDayVal) => {
        selectDay.innerHTML = '';
        for (let d = 1; d <= 31; d++) {
            const opt = document.createElement("option");
            opt.value = d;
            opt.textContent = String(d).padStart(2, "0");
            if (selectedDayVal && parseInt(selectedDayVal) === d) {
                opt.selected = true;
            }
            selectDay.appendChild(opt);
        }
    };

    // 绑定下拉选择栏 Change 事件
    selectYear.addEventListener("change", (e) => {
        highlightedDate = null; // 手动切换选择时，清除双击定位的高亮底色
        currentYear = e.target.value ? parseInt(e.target.value) : new Date().getFullYear();
        currentDay = selectDay.value ? parseInt(selectDay.value) : 1;
        renderCalendar(currentYear, currentMonth);
    });

    selectMonth.addEventListener("change", (e) => {
        highlightedDate = null; // 手动切换选择时，清除双击定位的高亮底色
        currentMonth = parseInt(e.target.value);
        currentDay = selectDay.value ? parseInt(selectDay.value) : 1;
        renderCalendar(currentYear, currentMonth);
    });

    const btnMonthPrev = document.getElementById("btn-month-prev");
    const btnMonthNext = document.getElementById("btn-month-next");
    
    if (btnMonthPrev) {
        btnMonthPrev.addEventListener("click", () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
                if (currentYear < 2026) currentYear = 2026;
            }
            selectYear.value = currentYear;
            selectMonth.value = currentMonth;
            highlightedDate = null;
            renderCalendar(currentYear, currentMonth);
        });
    }

    if (btnMonthNext) {
        btnMonthNext.addEventListener("click", () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
                if (currentYear > 2126) currentYear = 2126;
            }
            selectYear.value = currentYear;
            selectMonth.value = currentMonth;
            highlightedDate = null;
            renderCalendar(currentYear, currentMonth);
        });
    }

    selectDay.addEventListener("change", (e) => {
        highlightedDate = null; // 手动切换选择时，清除双击定位的高亮底色
        currentDay = e.target.value ? parseInt(e.target.value) : 1;
        updateLunarHeader(currentYear, currentMonth, currentDay);
    });


    // 存档保存新增项目功能
    const saveNewReminder = () => {
        const inputVal = document.getElementById("search-input").value.trim();
        if (!inputVal) {
            alert("请输入项目或任务名称！");
            return;
        }

        const activeFolder = foldersData.find(g => g.id === selectedSaveGroupId);
        if (!activeFolder) {
            alert("请在左侧选择一个 Folder 文件夹作为保存目的地！");
            return;
        }

        let title = inputVal;
        let year = currentYear;
        let month = currentMonth;
        let day = selectDay.value ? parseInt(selectDay.value) : null;

        // 支持输入框直接解析格式如 (名称 + 3 Feb) 或 (名称 + Feb)
        if (inputVal.includes("+")) {
            const parts = inputVal.split("+");
            title = parts[0].trim();
            const datePart = parts[1].trim();

            const parsed = parseCardDate(datePart, currentYear);
            year = parsed.year;
            month = parsed.month;
            day = parsed.day;
        }

        const newDateStr = formatDateStr(year, month, day);

        const newCard = {
            id: `c-${Date.now()}`,
            title: title,
            dateStr: newDateStr
        };

        activeFolder.cards.push(newCard);
        saveData();

        // 清空输入框并刷新页面与日历
        document.getElementById("search-input").value = "";
        renderFolders();
        renderCalendar(currentYear, currentMonth);
    };

    // 绑定顶部存档按钮
    if (document.getElementById("btn-save-top")) {
        document.getElementById("btn-save-top").addEventListener("click", saveNewReminder);
    }
    if (document.getElementById("search-input")) {
        document.getElementById("search-input").addEventListener("keydown", (e) => {
            if (e.key === "Enter") saveNewReminder();
        });
    }

    // 手机网络版专属双排卡片表单存档逻辑
    const saveMobileReminder = () => {
        const titleVal = mobileCardTitleInput.value.trim();
        if (!titleVal) {
            alert("请输入项目或任务名称！");
            return;
        }

        const activeFolder = foldersData.find(g => g.id === selectedSaveGroupId);
        if (!activeFolder) {
            alert("请点击选择一个 Folder 作为保存目的地！");
            return;
        }

        const dayVal = mobileCardDay.value ? parseInt(mobileCardDay.value) : null;
        const monthVal = parseInt(mobileCardMonth.value);
        const yearVal = mobileCardYear.value ? parseInt(mobileCardYear.value) : null;

        const endDayVal = mobileCardEndDay && mobileCardEndDay.value ? parseInt(mobileCardEndDay.value) : null;
        const endMonthVal = mobileCardEndMonth && mobileCardEndMonth.value !== "" ? parseInt(mobileCardEndMonth.value) : null;
        const endYearVal = mobileCardEndYear && mobileCardEndYear.value ? parseInt(mobileCardEndYear.value) : null;

        const isSameDate = (dayVal === endDayVal && monthVal === endMonthVal && yearVal === endYearVal);

        // 生成规范的日期字符串
        let newDateStr = "";
        const isBirthday = isBirthdayGroup(activeFolder);

        if (isBirthday) {
            // 生日格式例如: 1984 May 15 寅时 或者 May 15 寅时
            const monthName = monthNamesAbbr[monthVal];
            let parts = [];
            if (yearVal) parts.push(yearVal);
            parts.push(monthName);
            if (dayVal) parts.push(dayVal);
            
            newDateStr = parts.join(" ");
        } else {
            // 普通提醒格式例如: 27 Oct 2026 或者 27 Oct 或者 Oct 2026 或者 Oct
            const monthName = monthNamesAbbr[monthVal];
            if (dayVal) {
                if (yearVal) {
                    newDateStr = `${dayVal} ${monthName} ${yearVal}`;
                } else {
                    newDateStr = `${dayVal} ${monthName}`;
                }
            } else {
                if (yearVal) {
                    newDateStr = `${monthName} ${yearVal}`;
                } else {
                    newDateStr = `${monthName}`;
                }
            }
        }

        if (!isSameDate && endMonthVal !== null) {
            let endDateStr = "";
            const endMonthName = monthNamesAbbr[endMonthVal];
            if (endDayVal) {
                if (endYearVal) {
                    endDateStr = `${endDayVal} ${endMonthName} ${endYearVal}`;
                } else {
                    endDateStr = `${endDayVal} ${endMonthName}`;
                }
            } else {
                if (endYearVal) {
                    endDateStr = `${endMonthName} ${endYearVal}`;
                } else {
                    endDateStr = `${endMonthName}`;
                }
            }
            newDateStr = `${newDateStr} ~ ${endDateStr}`;
        }

        const newCard = {
            id: `c-${Date.now()}`,
            title: titleVal,
            dateStr: newDateStr
        };

        activeFolder.cards.push(newCard);
        saveData();

        // 重置表单状态并收起
        mobileCardTitleInput.value = "";
        addCardPanel.style.display = "none";
        
        // 刷新列表和日历视图
        renderFolders();
        renderCalendar(currentYear, currentMonth);
    };

    if (btnMobileSaveCard && mobileCardTitleInput) {
        btnMobileSaveCard.addEventListener("click", saveMobileReminder);
        mobileCardTitleInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") saveMobileReminder();
        });
    }


    // 刷新跳回当天日期
    const resetToToday = (e) => {
        // 按钮物理点击微动动画
        if (e && e.currentTarget) {
            const btn = e.currentTarget;
            btn.classList.add("clicked");
            setTimeout(() => btn.classList.remove("clicked"), 300);
        }

        highlightedDate = null; // 刷新时，清除双击定位的高亮底色
        const today = new Date();
        currentYear = today.getFullYear();
        if (currentYear < 2026) currentYear = 2026;
        if (currentYear > 2126) currentYear = 2126;
        currentMonth = today.getMonth();
        currentDay = today.getDate();

        selectYear.value = currentYear;
        selectMonth.value = currentMonth;
        initDaySelect(currentDay);
        selectDay.value = currentDay;

        // 刷新时跳回日历视图
        if (!viewCalendar.classList.contains("active")) {
            viewFolders.classList.remove("active");
            viewCalendar.classList.add("active");
            navBtnCalendar.classList.add("active");
            navBtnList.classList.remove("active");
        }

        renderCalendar(currentYear, currentMonth);
        showToast("已跳回今天！");
    };

    // 绑定所有刷新按钮
    if (document.getElementById("btn-refresh")) {
        document.getElementById("btn-refresh").addEventListener("click", resetToToday);
    }
    if (document.getElementById("btn-refresh-top")) {
        document.getElementById("btn-refresh-top").addEventListener("click", resetToToday);
    }

    // 将数据整理并格式化，导出为漂亮的 .txt 文件自动拉起浏览器下载
    const exportDataToTxt = () => {
        let txtContent = "";
        txtContent += "==================================================\n";
        txtContent += "任务+生日+节日 提醒 数据备份\n";
        const now = new Date();
        txtContent += `备份时间：${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}\n`;
        txtContent += "==================================================\n\n";

        foldersData.forEach(group => {
            txtContent += `[📂 ${group.name}]\n`;
            if (group.cards.length === 0) {
                txtContent += "  (暂无数据)\n";
            } else {
                group.cards.forEach(card => {
                    txtContent += `- ${card.title} (${card.dateStr})\n`;
                });
            }
            txtContent += "\n";
        });

        txtContent += "==================================================\n";
        txtContent += "备份结束\n";

        // 创建 Blob 模拟触发文本下载
        const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        
        const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        link.download = `提醒数据备份_${timeStr}.txt`;
        
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // 侧栏底部的主数据保存按钮（保存至 LocalStorage + 同步自动导出下载 .txt 文本）
    document.getElementById("btn-save").addEventListener("click", (e) => {
        // 按钮物理点击微动动画
        const btnSave = e.currentTarget;
        btnSave.classList.add("clicked");
        setTimeout(() => btnSave.classList.remove("clicked"), 300);

        saveData();
        exportDataToTxt();
        showToast("数据已存盘！");
    });

    // 相机按钮点击事件：播放快门音 Canon DSLR Shutter Sound.mp3，截取日历区域，另存为 YYYYMMDD-HHmm.jpg 并下载
    document.getElementById("btn-snapshot-top").addEventListener("click", (e) => {
        // 按钮物理点击微动动画
        const btnBg = e.currentTarget;
        btnBg.classList.add("clicked");
        setTimeout(() => btnBg.classList.remove("clicked"), 300);

        // 1. 播放 DSLR 快门声音
        try {
            const shutterSound = new Audio("设计风格/shutter_sound.mp3");
            shutterSound.play().catch(err => {
                console.log("Audio play blocked or file not found:", err);
            });
        } catch (e) {
            console.error("Audio error:", e);
        }

        // 弹出 Toast 提示
        showToast("正在截取月历...");

        const captureAndDownload = () => {
            // 2. 截取日历大框区域 (.calendar-border-wrapper)
            const calendarEl = document.querySelector(".calendar-border-wrapper");
            if (!calendarEl) {
                alert("找不到日历容器，无法截图！");
                return;
            }

            // 调用 html2canvas 进行高清渲染
            html2canvas(calendarEl, {
                useCORS: true,
                scale: 2, // 2倍清晰度
                backgroundColor: "#ffffff", // 白色背景填充（JPG 格式无透明）
                onclone: (clonedDoc) => {
                    // 在克隆出来的 DOM 树中，处理所有的 select 元素
                    const selects = clonedDoc.querySelectorAll('.cute-select');
                    const realSelects = document.querySelectorAll('.cute-select');
                    selects.forEach((select, idx) => {
                        const realSel = realSelects[idx];
                        const widthVal = realSel ? realSel.offsetWidth : null;
                        const heightVal = realSel ? realSel.offsetHeight : null;

                        const div = clonedDoc.createElement('div');
                        // 复制 class 这样可以继承 css 中的样式（如边框、圆角、背景色、字号等）
                        div.className = select.className;
                        
                        const selectedOption = select.options[select.selectedIndex];
                        div.textContent = selectedOption ? selectedOption.textContent : select.value;
                        
                        // 强制覆盖一些布局属性，使 div 表现为行内块，且内部文字居中
                        div.style.display = 'inline-flex';
                        div.style.alignItems = 'center';
                        div.style.justifyContent = 'center';
                        div.style.textAlign = 'center';
                        div.style.lineHeight = '1.2';
                        div.style.verticalAlign = 'middle';
                        div.style.boxSizing = 'border-box';
                        
                        if (widthVal) div.style.width = widthVal + 'px';
                        if (heightVal) div.style.height = heightVal + 'px';
                        
                        // 替换元素
                        select.parentNode.replaceChild(div, select);
                    });

                    // 处理所有的 input 元素
                    const inputs = clonedDoc.querySelectorAll('.search-bar-wrapper input');
                    const realInputs = document.querySelectorAll('.search-bar-wrapper input');
                    inputs.forEach((input, idx) => {
                        const realInp = realInputs[idx];
                        const widthVal = realInp ? realInp.offsetWidth : 300;
                        const heightVal = realInp ? realInp.offsetHeight : 48;

                        const div = clonedDoc.createElement('div');
                        div.className = input.className;
                        div.textContent = input.value || input.placeholder || "";
                        if (!input.value) {
                            div.style.color = '#a3b2e9'; // placeholder 的颜色
                        } else {
                            div.style.color = '#2f56b8'; // 输入文字的颜色
                        }
                        
                        // 强制覆盖一些布局属性，使其表现和 input 一致
                        div.style.display = 'inline-flex';
                        div.style.alignItems = 'center';
                        div.style.justifyContent = 'flex-start';
                        div.style.lineHeight = '1.2';
                        div.style.verticalAlign = 'middle';
                        div.style.boxSizing = 'border-box';
                        div.style.border = '1px solid #7a8ad0';
                        div.style.borderRadius = '8px';
                        div.style.backgroundColor = '#fff';
                        div.style.paddingLeft = '10px';
                        div.style.fontSize = '29px';
                        div.style.fontWeight = 'normal';
                        div.style.fontFamily = 'inherit';
                        
                        div.style.width = widthVal + 'px';
                        div.style.height = heightVal + 'px';
                        
                        // 替换元素
                        input.parentNode.replaceChild(div, input);
                    });
                }
            }).then(canvas => {
                // 导出质量为 0.95 的 JPEG 图像
                const imgData = canvas.toDataURL("image/jpeg", 0.95);
                
                // 格式化当前时间为 YYYYMMDD-HHmm
                const now = new Date();
                const yearStr = now.getFullYear();
                const monthStr = String(now.getMonth() + 1).padStart(2, "0");
                const dayStr = String(now.getDate()).padStart(2, "0");
                const hourStr = String(now.getHours()).padStart(2, "0");
                const minStr = String(now.getMinutes()).padStart(2, "0");
                
                const filename = `${yearStr}${monthStr}${dayStr}-${hourStr}${minStr}.jpg`;

                // 模拟链接点击进行下载
                const link = document.createElement("a");
                link.href = imgData;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                showToast("截图已保存！");
            }).catch(err => {
                console.error("html2canvas screenshot error:", err);
                alert("生成日历截图失败，请重试！");
            });
        };

        // 如果当前不是日历视图，先切回日历视图并渲染
        if (!viewCalendar.classList.contains("active")) {
            viewFolders.classList.remove("active");
            viewCalendar.classList.add("active");
            navBtnCalendar.classList.add("active");
            navBtnList.classList.remove("active");
            renderCalendar(currentYear, currentMonth);
            setTimeout(captureAndDownload, 300); // 延时300ms确保渲染和切换完成
        } else {
            setTimeout(captureAndDownload, 100);
        }
    });

    // 绑定导入数据按钮
    document.getElementById("btn-import").addEventListener("click", () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".txt";
        fileInput.style.display = "none";
        
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (evt) => {
                const text = evt.target.result;
                importTxtData(text);
            };
            reader.readAsText(file, "utf-8");
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    });

    // 解析 txt 文件并智能提取群组与卡片信息
    const importTxtData = (text) => {
        const lines = text.split(/\r?\n/);
        const newFolders = [];
        let currentGroup = null;

        const monthsAbbr = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

        // 识别日期特征的辅助函数
        const hasDateFeature = (str) => {
            const s = str.toLowerCase();
            if (/\b(19\d{2}|20\d{2}|21\d{2})\b/.test(s)) return true;
            if (/\d{1,2}\s*月/.test(s)) return true;
            if (/[一二三四五六七八九十百]+\s*月/.test(s)) return true;
            if (/\d{1,2}\s*日/.test(s)) return true;
            for (let m of monthsAbbr) {
                if (s.includes(m)) return true;
            }
            return false;
        };

        // 对一个字符串片段是否是日期的评分函数
        const scoreAsDate = (str) => {
            const s = str.toLowerCase().trim();
            let score = 0;
            // 包含4位年份
            if (/\b(19\d{2}|20\d{2}|21\d{2})\b/.test(s)) score += 10;
            // 包含X月 (数字或中文)
            if (/\d{1,2}\s*月/.test(s)) score += 8;
            if (/[一二三四五六七八九十百]+月/.test(s)) score += 8;
            // 包含X日
            if (/\d{1,2}\s*日/.test(s)) score += 8;
            // 包含英文月份
            for (let m of monthsAbbr) {
                if (s.includes(m)) {
                    score += 8;
                    break;
                }
            }
            // 包含普通短日期数字格式 (如 12-25 或 12/25)
            if (/\b\d{1,2}[-/]\d{1,2}\b/.test(s)) score += 6;
            // 包含单个或多个孤立数字，但没有字母
            const numCount = (s.match(/\d+/g) || []).length;
            if (numCount > 0) score += numCount * 2;

            // 负分项：如果包含很多字但数字极少，说明更可能是名字
            if (s.length > 15 && numCount === 0) score -= 10;
            
            return score;
        };

        lines.forEach(rawLine => {
            let line = rawLine.trim();
            // 过滤空行
            if (!line) return;

            // 去除注释（如 《《 及其后面的内容）
            if (line.includes("《《")) {
                line = line.split("《《")[0].trim();
            }
            if (!line) return;

            // 过滤系统备份文件的辅助行
            if (line.includes("===") || line.includes("数据备份") || line.includes("备份时间") || line.includes("备份结束")) {
                return;
            }

            // 判断是否是新群组（Folder Group）
            // 规则：如果以 [ 开头并以 ] 结尾，或者是没有日期特征的行
            const isGroupLine = (line.startsWith("[") && line.endsWith("]")) || !hasDateFeature(line);

            if (isGroupLine) {
                let groupName = line;
                if (line.startsWith("[") && line.endsWith("]")) {
                    groupName = line.substring(1, line.length - 1).trim();
                }
                // 去除 Emojis (如 📂, 📁)
                groupName = groupName.replace(/[📂📁]/g, "").trim();

                currentGroup = {
                    id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name: groupName,
                    collapsed: false,
                    cards: []
                };
                newFolders.push(currentGroup);
            } else {
                // 如果是卡片数据行
                if (!currentGroup) {
                    currentGroup = {
                        id: `group-default-${Date.now()}`,
                        name: "未分类提醒",
                        collapsed: false,
                        cards: []
                    };
                    newFolders.push(currentGroup);
                }

                // 清洗行前缀，如 `- `, `* `, `• `
                let cleanLine = line.replace(/^[-*•\s]+/, "").trim();

                let title = "";
                let dateStr = "";

                // 1. 尝试匹配自备份导出格式: "还妈妈保险 RM5800 (1 June)"
                const backupRegex = /^(.+?)\s*\(([^)]+)\)$/;
                const backupMatch = cleanLine.match(backupRegex);

                // 新增：识别开头的标准中文日期（包括范围）
                const cnDateRangeStartRegex = /^((?:\d{4}年\s*)?\d{1,2}月\d{1,2}日(?:[\s\t]*(?:到|-|~|至)[\s\t]*(?:\d{4}年\s*)?\d{1,2}月\d{1,2}日)?)\s+(.+)$/;
                const cnDateRangeMatch = cleanLine.match(cnDateRangeStartRegex);

                if (backupMatch) {
                    title = backupMatch[1].trim();
                    dateStr = backupMatch[2].trim();
                } else if (cnDateRangeMatch) {
                    dateStr = cnDateRangeMatch[1].trim();
                    title = cnDateRangeMatch[2].trim();
                } else {
                    // 2. 否则，使用智能多空白符/制表符切分
                    const parts = cleanLine.split(/\s{3,}|\t+/).map(p => p.trim()).filter(Boolean);

                    if (parts.length >= 2) {
                        let maxScore = -999;
                        let dateIdx = -1;
                        parts.forEach((part, idx) => {
                            const score = scoreAsDate(part);
                            if (score > maxScore) {
                                maxScore = score;
                                dateIdx = idx;
                            }
                        });

                        dateStr = parts[dateIdx];
                        title = parts.filter((_, idx) => idx !== dateIdx).join(" ");
                    } else {
                        // 3. 只有一个空白符或无分隔符，尝试正则提取中文日期或英文日期
                        let matchedDate = null;
                        const cnDateMatch = cleanLine.match(/\b\d{1,2}\s*月\s*\d{1,2}\s*日?\b/);
                        const cnWordMonthMatch = cleanLine.match(/\b[一二三四五六七八九十十一十二正冬腊]+\s*月\s*\d{1,2}\s*日?\b/);

                        if (cnDateMatch) {
                            matchedDate = cnDateMatch[0];
                        } else if (cnWordMonthMatch) {
                            matchedDate = cnWordMonthMatch[0];
                        } else {
                            const yearMatch = cleanLine.match(/\b(19\d{2}|20\d{2}|21\d{2})\b/);
                            if (yearMatch) {
                                const wordParts = cleanLine.split(/\s+/);
                                const lastWord = wordParts[wordParts.length - 1];
                                const firstWord = wordParts[0];
                                if (hasDateFeature(lastWord)) {
                                    matchedDate = cleanLine.substring(cleanLine.lastIndexOf(" ") + 1);
                                } else if (hasDateFeature(firstWord)) {
                                    matchedDate = wordParts[0];
                                }
                            }
                        }

                        if (matchedDate) {
                            dateStr = matchedDate;
                            title = cleanLine.replace(matchedDate, "").trim();
                        } else {
                            // 4. 最后的兜底：从最后一个空格切分
                            const lastSpaceIdx = cleanLine.lastIndexOf(" ");
                            if (lastSpaceIdx > 0) {
                                title = cleanLine.substring(0, lastSpaceIdx).trim();
                                dateStr = cleanLine.substring(lastSpaceIdx + 1).trim();
                            } else {
                                title = cleanLine;
                                dateStr = "1 Jan"; // 最终兜底
                            }
                        }
                    }
                }

                // 生成新卡片
                currentGroup.cards.push({
                    id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    title: title,
                    dateStr: dateStr
                });
            }
        });

        if (newFolders.length === 0) {
            alert("未能从文件中解析出有效的群组与提醒数据，请检查文件格式！");
            return;
        }

        // 取消原有的全局覆盖弹窗，改为智能合并：
        // 1. 若群组名已存在，使用新导入的群组数据覆盖原群组。
        // 2. 若群组名不存在，则作为新群组添加。
        let newCount = 0;
        let updateCount = 0;

        newFolders.forEach(newGroup => {
            const existingGroupIndex = foldersData.findIndex(g => g.name.trim().toLowerCase() === newGroup.name.trim().toLowerCase());
            if (existingGroupIndex !== -1) {
                // 同名文件夹：覆盖数据。保留原本的 ID 和折叠状态。
                const existingId = foldersData[existingGroupIndex].id;
                const existingCollapsed = foldersData[existingGroupIndex].collapsed;
                foldersData[existingGroupIndex] = newGroup;
                foldersData[existingGroupIndex].id = existingId;
                foldersData[existingGroupIndex].collapsed = existingCollapsed;
                updateCount++;
            } else {
                // 不同名文件夹：直接添加新文件夹
                foldersData.push(newGroup);
                newCount++;
            }
        });

        alert(`数据导入成功！\n\n新增群组：${newCount} 个\n更新群组：${updateCount} 个`);

        // 确保 selectedSaveGroupId 依然有效
        if (foldersData.length > 0) {
            if (!selectedSaveGroupId || !foldersData.some(g => g.id === selectedSaveGroupId)) {
                selectedSaveGroupId = foldersData[0].id;
            }
        } else {
            selectedSaveGroupId = null;
        }

        saveData();
        renderFolders();
        renderCalendar(currentYear, currentMonth);
    };

    // ==========================================================================
    // Notepad 功能模块
    // ==========================================================================
    const viewNotepad = document.getElementById("view-notepad");
    const viewNotepadEditor = document.getElementById("view-notepad-editor");
    const navBtnNotepad = document.getElementById("nav-btn-notepad");
    const notepadFoldersContainer = document.getElementById("notepad-folders-container");
    
    // Notepad 数据
    let notepadData = [];
    try {
        const storedNotepad = localStorage.getItem("notepad_data");
        if (storedNotepad) notepadData = JSON.parse(storedNotepad);
    } catch(e) { console.error("Failed to parse notepad data", e); }

    let selectedNotepadFolderId = null;
    let currentEditingFileId = null;
    let currentEditingFolderId = null;

    const saveNotepadData = () => {
        localStorage.setItem("notepad_data", JSON.stringify(notepadData));
    };

    const renderNotepadFolders = () => {
        if (!notepadFoldersContainer) return;
        notepadFoldersContainer.innerHTML = "";
        
        notepadData.forEach(folder => {
            const folderEl = document.createElement("div");
            folderEl.className = `notepad-group ${folder.collapsed ? 'collapsed' : ''}`;
            
            const titleEl = document.createElement("div");
            titleEl.className = "notepad-folder-title";
            
            const circle = document.createElement("span");
            circle.className = `notepad-folder-circle ${selectedNotepadFolderId === folder.id ? 'selected' : ''}`;
            
            const icon = document.createElement("span");
            icon.className = "notepad-folder-icon " + (folder.color || "");
            
            const nameText = document.createElement("span");
            nameText.textContent = folder.name;
            nameText.style.flex = "1";
            
            titleEl.appendChild(circle);
            titleEl.appendChild(icon);
            titleEl.appendChild(nameText);
            
            // 绑定事件
            titleEl.addEventListener("click", (e) => {
                if (e.target === circle) {
                    selectedNotepadFolderId = folder.id;
                } else {
                    folder.collapsed = !folder.collapsed;
                    selectedNotepadFolderId = folder.id;
                }
                saveNotepadData();
                renderNotepadFolders();
            });

            // 长按事件 (重命名/删除)
            addDualPressListener(titleEl, null, (e) => {
                e.stopPropagation();
                activeRightClickedFolderId = folder.id;
                contextMenu.dataset.context = "notepad-folder"; 
                contextMenu.style.display = "block";
                
                const touch = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
                const rect = titleEl.getBoundingClientRect();
                const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                const scrollY = window.pageYOffset || document.documentElement.scrollTop;
                contextMenu.style.left = `${rect.left + rect.width / 2 + scrollX}px`;
                contextMenu.style.top = `${rect.top + rect.height / 2 + scrollY}px`;
            }, true);
            
            folderEl.appendChild(titleEl);
            
            const fileListEl = document.createElement("div");
            fileListEl.className = "notepad-file-list";
            
            folder.files.forEach(file => {
                const fileEl = document.createElement("div");
                fileEl.className = "notepad-file-card";
                fileEl.textContent = file.name;
                
                fileEl.addEventListener("click", () => {
                    openNotepadEditor(folder.id, file.id);
                });

                // 文件长按菜单
                addDualPressListener(fileEl, null, (e) => {
                    e.stopPropagation();
                    activeRightClickedCardId = file.id;
                    activeRightClickedCardGroupId = folder.id;
                    cardContextMenu.dataset.context = "notepad-file";
                    cardContextMenu.style.display = "block";
                    
                    const rect = fileEl.getBoundingClientRect();
                    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
                    cardContextMenu.style.left = `${rect.left + rect.width / 2 + scrollX}px`;
                    cardContextMenu.style.top = `${rect.top + rect.height / 2 + scrollY}px`;
                }, true);

                fileListEl.appendChild(fileEl);
            });
            
            folderEl.appendChild(fileListEl);
            notepadFoldersContainer.appendChild(folderEl);
        });
    };

    const viewCalculator = document.getElementById("view-calculator");
    const navBtnCalculator = document.getElementById("nav-btn-calculator");

    // 导航栏切换事件
    if (navBtnNotepad) {
        navBtnNotepad.addEventListener("click", () => {
            viewNotepad.classList.add("active");
            viewFolders.classList.remove("active");
            viewCalendar.classList.remove("active");
            viewNotepadEditor.classList.remove("active");
            if(viewCalculator) viewCalculator.classList.remove("active");
            
            navBtnNotepad.classList.add("active");
            navBtnList.classList.remove("active");
            navBtnCalendar.classList.remove("active");
            if(navBtnCalculator) navBtnCalculator.classList.remove("active");
            
            navBtnNotepad.classList.add("clicked");
            setTimeout(() => navBtnNotepad.classList.remove("clicked"), 300);
            
            renderNotepadFolders();
        });
    }

    if (navBtnCalculator) {
        navBtnCalculator.addEventListener("click", () => {
            if(viewCalculator) viewCalculator.classList.add("active");
            viewFolders.classList.remove("active");
            viewCalendar.classList.remove("active");
            viewNotepad.classList.remove("active");
            viewNotepadEditor.classList.remove("active");
            
            navBtnCalculator.classList.add("active");
            navBtnList.classList.remove("active");
            navBtnCalendar.classList.remove("active");
            if(navBtnNotepad) navBtnNotepad.classList.remove("active");
            
            navBtnCalculator.classList.add("clicked");
            setTimeout(() => navBtnCalculator.classList.remove("clicked"), 300);
        });
    }

    // 覆盖原有的导航切换，移除其他视图的 active 状态
    navBtnList.addEventListener("click", () => {
        if(viewNotepad) viewNotepad.classList.remove("active");
        if(viewNotepadEditor) viewNotepadEditor.classList.remove("active");
        if(viewCalculator) viewCalculator.classList.remove("active");
        if(navBtnNotepad) navBtnNotepad.classList.remove("active");
        if(navBtnCalculator) navBtnCalculator.classList.remove("active");
    });
    navBtnCalendar.addEventListener("click", () => {
        if(viewNotepad) viewNotepad.classList.remove("active");
        if(viewNotepadEditor) viewNotepadEditor.classList.remove("active");
        if(viewCalculator) viewCalculator.classList.remove("active");
        if(navBtnNotepad) navBtnNotepad.classList.remove("active");
        if(navBtnCalculator) navBtnCalculator.classList.remove("active");
    });

    // 增加 Notepad Folder
    document.getElementById("btn-notepad-add-folder")?.addEventListener("click", () => {
        if (notepadFoldersContainer.querySelector(".notepad-input-row")) return;
        const inputRow = document.createElement("div");
        inputRow.className = "notepad-input-row";
        inputRow.innerHTML = `
            <input type="text" class="notepad-name-input" placeholder="输入文件夹名称..." maxlength="30" autofocus />
            <button class="new-group-confirm-btn" title="确认">✔</button>
            <button class="new-group-cancel-btn" title="取消">✖</button>
        `;
        notepadFoldersContainer.insertBefore(inputRow, notepadFoldersContainer.firstChild);
        const nameInput = inputRow.querySelector(".notepad-name-input");
        nameInput.focus();

        const confirm = () => {
            const name = nameInput.value.trim();
            if(name) {
                const newId = "npf-" + Date.now();
                notepadData.unshift({ id: newId, name: name, collapsed: false, files: [] });
                selectedNotepadFolderId = newId;
                saveNotepadData();
                renderNotepadFolders();
            } else {
                inputRow.remove();
            }
        };
        inputRow.querySelector(".new-group-confirm-btn").addEventListener("click", confirm);
        inputRow.querySelector(".new-group-cancel-btn").addEventListener("click", () => inputRow.remove());
        nameInput.addEventListener("keypress", (e) => { if (e.key === "Enter") confirm(); });
    });

    // 增加 Notepad File
    document.getElementById("btn-notepad-add-file")?.addEventListener("click", () => {
        if (!selectedNotepadFolderId) {
            showToast("请先选择一个文件夹");
            return;
        }
        const folderIndex = notepadData.findIndex(f => f.id === selectedNotepadFolderId);
        if (folderIndex === -1) return;
        
        const folder = notepadData[folderIndex];
        folder.collapsed = false; // 自动展开
        
        renderNotepadFolders(); // 重新渲染确保目标 folder 存在且已展开
        const folderEls = notepadFoldersContainer.querySelectorAll(".notepad-group");
        const targetFolderEl = Array.from(folderEls).find(el => {
           return el.querySelector(".notepad-folder-circle").classList.contains("selected");
        });
        
        if (!targetFolderEl) return;
        const listEl = targetFolderEl.querySelector(".notepad-file-list");
        
        if (listEl.querySelector(".notepad-input-row")) return;
        const inputRow = document.createElement("div");
        inputRow.className = "notepad-input-row";
        inputRow.innerHTML = `
            <input type="text" class="notepad-name-input" placeholder="输入文件名称..." maxlength="30" autofocus />
            <button class="new-group-confirm-btn" title="确认">✔</button>
            <button class="new-group-cancel-btn" title="取消">✖</button>
        `;
        listEl.insertBefore(inputRow, listEl.firstChild);
        const nameInput = inputRow.querySelector(".notepad-name-input");
        nameInput.focus();

        const confirm = () => {
            const name = nameInput.value.trim();
            if(name) {
                folder.files.unshift({ id: "npfile-" + Date.now(), name: name, content: "" });
                saveNotepadData();
                renderNotepadFolders();
            } else {
                inputRow.remove();
            }
        };
        inputRow.querySelector(".new-group-confirm-btn").addEventListener("click", confirm);
        inputRow.querySelector(".new-group-cancel-btn").addEventListener("click", () => inputRow.remove());
        nameInput.addEventListener("keypress", (e) => { if (e.key === "Enter") confirm(); });
    });

    // 存档所有 Notepad
    document.getElementById("btn-notepad-save")?.addEventListener("click", () => {
        saveNotepadData();
        let folderCount = notepadData.length;
        let fileCount = notepadData.reduce((acc, f) => acc + f.files.length, 0);
        
        // 生成纯文本内容用于下载
        let textContent = "========== Notepad 备份 ==========\n";
        textContent += `导出时间: ${new Date().toLocaleString()}\n\n`;
        
        notepadData.forEach(folder => {
            textContent += `[文件夹] ${folder.name}\n`;
            textContent += `-----------------------------------\n`;
            folder.files.forEach(file => {
                textContent += `【文件】${file.name}\n`;
                textContent += `${file.content || "(无内容)"}\n`;
                textContent += `-----------------------------------\n`;
            });
            textContent += `\n`;
        });
        textContent += "========== 结束 ==========\n";
        
        // 触发下载
        const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const dateStr = new Date().toISOString().split("T")[0];
        a.download = `Notepad_Backup_${dateStr}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(`已存 ${folderCount}个folder + ${fileCount}file 并已下载`);
    });

    // Notepad Editor 逻辑
    const openNotepadEditor = (folderId, fileId) => {
        currentEditingFolderId = folderId;
        currentEditingFileId = fileId;
        
        const folder = notepadData.find(f => f.id === folderId);
        const file = folder.files.find(f => f.id === fileId);
        
        document.getElementById("editor-file-title").textContent = file.name;
        document.getElementById("editor-textarea").value = file.content || "";
        
        viewNotepad.classList.remove("active");
        viewNotepadEditor.classList.add("active");
    };

    document.getElementById("btn-editor-home")?.addEventListener("click", () => {
        // Auto save on leaving
        if (currentEditingFolderId && currentEditingFileId) {
            const folder = notepadData.find(f => f.id === currentEditingFolderId);
            const file = folder?.files.find(f => f.id === currentEditingFileId);
            if (file) {
                file.content = document.getElementById("editor-textarea").value;
                saveNotepadData();
            }
        }
        viewNotepadEditor.classList.remove("active");
        viewNotepad.classList.add("active");
        currentEditingFolderId = null;
        currentEditingFileId = null;
        renderNotepadFolders();
    });

    document.getElementById("btn-editor-save")?.addEventListener("click", () => {
        if (currentEditingFolderId && currentEditingFileId) {
            const folder = notepadData.find(f => f.id === currentEditingFolderId);
            const file = folder?.files.find(f => f.id === currentEditingFileId);
            if (file) {
                file.content = document.getElementById("editor-textarea").value;
                saveNotepadData();
                showToast("内容已保存");
            }
        }
    });

    document.getElementById("btn-editor-undo")?.addEventListener("click", () => {
        document.execCommand("undo");
    });

    document.getElementById("btn-editor-redo")?.addEventListener("click", () => {
        document.execCommand("redo");
    });

    // 拦截右键菜单事件，如果 dataset 标记为 notepad 专属，则处理后阻止继续
    menuRename.addEventListener("click", (e) => {
        if (contextMenu.dataset.context === "notepad-folder") {
            const folder = notepadData.find(f => f.id === activeRightClickedFolderId);
            if (folder) {
                const newName = prompt("请输入新的文件夹名称:", folder.name);
                if (newName && newName.trim()) {
                    folder.name = newName.trim();
                    saveNotepadData();
                    renderNotepadFolders();
                }
            }
            contextMenu.style.display = "none";
            contextMenu.dataset.context = "";
            e.stopImmediatePropagation();
        }
    });

    menuDelete.addEventListener("click", (e) => {
        if (contextMenu.dataset.context === "notepad-folder") {
            if (confirm("确定要删除此文件夹及其内容吗？")) {
                notepadData = notepadData.filter(f => f.id !== activeRightClickedFolderId);
                if (selectedNotepadFolderId === activeRightClickedFolderId) selectedNotepadFolderId = null;
                saveNotepadData();
                renderNotepadFolders();
            }
            contextMenu.style.display = "none";
            contextMenu.dataset.context = "";
            e.stopImmediatePropagation();
        }
    });

    cardMenuRename.addEventListener("click", (e) => {
        if (cardContextMenu.dataset.context === "notepad-file") {
            const folder = notepadData.find(f => f.id === activeRightClickedCardGroupId);
            const file = folder?.files.find(f => f.id === activeRightClickedCardId);
            if (file) {
                const newName = prompt("请输入新的文件名称:", file.name);
                if (newName && newName.trim()) {
                    file.name = newName.trim();
                    saveNotepadData();
                    renderNotepadFolders();
                }
            }
            cardContextMenu.style.display = "none";
            cardContextMenu.dataset.context = "";
            e.stopImmediatePropagation();
        }
    });

    cardMenuDelete.addEventListener("click", (e) => {
        if (cardContextMenu.dataset.context === "notepad-file") {
            if (confirm("确定要删除此文件吗？")) {
                const folder = notepadData.find(f => f.id === activeRightClickedCardGroupId);
                if (folder) {
                    folder.files = folder.files.filter(f => f.id !== activeRightClickedCardId);
                    saveNotepadData();
                    renderNotepadFolders();
                }
            }
            cardContextMenu.style.display = "none";
            cardContextMenu.dataset.context = "";
            e.stopImmediatePropagation();
        }
    });

    // ==========================================================================
    // 计算器逻辑
    // ==========================================================================
    const calcExpressionEl = document.getElementById("calc-expression");
    const calcResultEl = document.getElementById("calc-result");
    let calcExpression = "";
    
    const parsePercentage = (expr) => {
        let res = expr;
        const regex = /(.*?)([\+\-])\s*(\d+(?:\.\d+)?)%/;
        let match;
        while ((match = regex.exec(res)) !== null) {
            let p1 = match[1];
            let op = match[2];
            let p2 = match[3];
            try {
                if (/[\+\-\*\/]\s*$/.test(p1) || p1.trim() === "") {
                    res = res.substring(0, match.index) + `${p1}${op}(${p2}/100)` + res.substring(match.index + match[0].length);
                } else {
                    let p1EvalStr = p1.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)").replace(/%/g, "/100");
                    let leftVal = new Function('return ' + p1EvalStr)();
                    res = res.substring(0, match.index) + `${p1}${op}(${leftVal}*${p2}/100)` + res.substring(match.index + match[0].length);
                }
            } catch(e) {
                res = res.substring(0, match.index) + `${p1}${op}(${p2}/100)` + res.substring(match.index + match[0].length);
            }
        }
        res = res.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
        res = res.replace(/%/g, "/100");
        return res;
    };

    const formatNumber = (numStr) => {
        if (!numStr) return "";
        const parts = numStr.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

    const updateCalcDisplay = () => {
        // Format the expression for display
        let displayExpr = calcExpression.replace(/\*/g, "x").replace(/\//g, "÷");
        
        // Add commas to numbers in expression
        displayExpr = displayExpr.replace(/\b\d+(\.\d+)?\b/g, match => formatNumber(match));
        
        calcExpressionEl.textContent = displayExpr;

        try {
            if (calcExpression) {
                // 如果包含运算符（说明在连续计算中），则不在下方实时显示总数
                // 判断条件：包含运算符，且不仅仅是开头的负号
                let isCalculating = /[\+\-\*\/]/.test(calcExpression) && !(calcExpression.startsWith('-') && !/[\+\-\*\/]/.test(calcExpression.substring(1)));
                
                if (isCalculating) {
                    calcResultEl.textContent = ""; // 不显示实时总数
                } else {
                    let evalStr = parsePercentage(calcExpression);
                    let result = new Function('return ' + evalStr)();
                    if (!isFinite(result)) result = "Error";
                    else {
                        result = Math.round(result * 100000000) / 100000000;
                        result = formatNumber(result.toString());
                    }
                    calcResultEl.textContent = result;
                }
            } else {
                calcResultEl.textContent = "0";
            }
        } catch (e) {
            // keep old result if incomplete expression
            calcResultEl.textContent = "";
        }
    };

    document.querySelectorAll(".calc-key").forEach(btn => {
        btn.addEventListener("click", () => {
            playCalcBeep();
            if (btn.id === "btn-calc-clear") {
                calcExpression = "";
                updateCalcDisplay();
                return;
            }
            if (btn.id === "btn-calc-equal") {
                try {
                    let evalStr = parsePercentage(calcExpression);
                    let result = new Function('return ' + evalStr)();
                    if (isFinite(result)) {
                        result = Math.round(result * 100000000) / 100000000;
                        calcExpression = result.toString();
                    }
                } catch(e) {}
                updateCalcDisplay();
                return;
            }
            
            const val = btn.dataset.val;
            if (val) {
                let mappedVal = val;
                if (val === "x") mappedVal = "*";
                if (val === "÷") mappedVal = "/";
                
                const lastChar = calcExpression.slice(-1);
                const isOp = ["+", "-", "*", "/"].includes(mappedVal);
                if (isOp && ["+", "-", "*", "/"].includes(lastChar)) {
                    calcExpression = calcExpression.slice(0, -1) + mappedVal;
                } else {
                    calcExpression += mappedVal;
                }
                updateCalcDisplay();
            }
        });
    });

    document.getElementById("btn-calc-sound")?.addEventListener("click", () => {
        isCalcSoundOn = !isCalcSoundOn;
        document.getElementById("btn-calc-sound").textContent = isCalcSoundOn ? "🔊" : "🔇";
        if (isCalcSoundOn) playCalcBeep();
    });

    document.getElementById("btn-calc-backspace")?.addEventListener("click", () => {
        playCalcBeep();
        if (calcExpression.length > 0) {
            calcExpression = calcExpression.slice(0, -1);
            updateCalcDisplay();
        }
    });

    // 初始化页面加载与首次渲染
    initYearSelect();
    initDaySelect(currentDay);
    renderFolders();
    renderCalendar(currentYear, currentMonth);

    // 全局点击/触碰其他地方时隐藏所有 tooltip 和右键菜单
    const hideAllTooltipsAndMenusGlobally = (e) => {
        if (!e.target.closest('.event-tag') && !e.target.closest('.event-tag-tooltip')) {
            const tooltip = document.getElementById("event-tag-tooltip");
            if (tooltip) {
                tooltip.style.opacity = "0";
                setTimeout(() => { tooltip.style.display = "none"; }, 150);
            }
            document.querySelectorAll(".event-tag.expanded").forEach(tag => {
                tag.classList.remove("expanded");
            });
        }
        // 隐藏菜单
        if (!e.target.closest('.context-menu')) {
            contextMenu.style.display = "none";
            cardContextMenu.style.display = "none";
            contextMenu.dataset.context = "";
            cardContextMenu.dataset.context = "";
        }
    };
    
    document.addEventListener("touchstart", hideAllTooltipsAndMenusGlobally, { passive: true });
    document.addEventListener("click", hideAllTooltipsAndMenusGlobally);
});
