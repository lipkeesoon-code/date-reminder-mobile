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

    // 精准解析卡片中的日期格式
    const parseCardDate = (dateStr, defaultYear) => {
        if (!dateStr) return { year: defaultYear, month: 0, day: 1 };
        const str = dateStr.toLowerCase().trim();
        
        let year = defaultYear;
        let month = 0;
        let day = null;

        // 1. 提取 4 位数字年份 (1900-2199)
        const yearMatch = str.match(/\b(19\d{2}|20\d{2}|21\d{2})\b/);
        if (yearMatch) {
            year = parseInt(yearMatch[1]);
        }

        // 2. 匹配月份 (英文缩写/全称)
        let foundMonth = false;
        for (let i = 0; i < 12; i++) {
            if (str.includes(monthNamesAbbr[i].toLowerCase()) || str.includes(monthFullNames[i])) {
                month = i;
                foundMonth = true;
                break;
            }
        }
        // 匹配中文月份 (如：4月，或者 八月、十一月)
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

        // 3. 匹配天数
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

        return { year, month, day };
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
                // 农历11月和12月统一加上“月”，符合“五月..以此类推”的加粗大字月头显示要求
                if (mName === "冬" || mName === "十一") {
                    return { text: "十一月", isMonthStart: true };
                }
                if (mName === "腊" || mName === "十二") {
                    return { text: "十二月", isMonthStart: true };
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
                    <div class="card-title">${card.title}</div>
                    <div class="card-date">${card.dateStr}</div>
                `;
                
                // 双击卡片自动跳转日历到对应的年月及日子
                cardEl.addEventListener("dblclick", () => {
                    const parsed = parseCardDate(card.dateStr, currentYear);
                    const isRecur = isBirthdayGroup(group) || isFestivalGroup(group);
                    if (!isRecur) {
                        currentYear = parsed.year;
                    }
                    currentMonth = parsed.month;
                    currentDay = (parsed.day !== null && parsed.day !== undefined) ? parsed.day : 1;
                    
                    // 记录当前双击卡片需要高亮的特定日期
                    highlightedDate = {
                        year: currentYear,
                        month: currentMonth,
                        day: (parsed.day !== null && parsed.day !== undefined) ? parsed.day : null,
                        isRecurring: isRecur
                    };

                    // 同步更新顶部选择下拉框
                    selectYear.value = currentYear;
                    selectMonth.value = currentMonth;
                    initDaySelect(currentDay);
                    selectDay.value = currentDay;
                    
                    // 重新渲染该月日历
                    renderCalendar(currentYear, currentMonth);
                });

                // 右键上下文菜单事件
                cardEl.addEventListener("contextmenu", (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // 阻止事件冒泡到父文件夹
                    
                    activeRightClickedCardId = card.id;
                    activeRightClickedCardGroupId = group.id;
                    
                    contextMenu.style.display = "none";
                    cardContextMenu.style.display = "block";
                    cardContextMenu.style.left = `${e.pageX}px`;
                    cardContextMenu.style.top = `${e.pageY}px`;
                });

                cardListEl.appendChild(cardEl);
            });

            groupEl.appendChild(cardListEl);
            foldersContainer.appendChild(groupEl);

            // === 绑定文件夹交互事件 ===

            // 1. 双击展开/收回
            titleEl.addEventListener("dblclick", (e) => {
                if (e.target.classList.contains("folder-circle-select") || e.target.classList.contains("folder-visibility-toggle")) return; 
                group.collapsed = !group.collapsed;
                groupEl.classList.toggle("collapsed", group.collapsed);
                saveData();
            });

            // 2. 单击文件夹行即可选择为存盘目的地
            titleEl.addEventListener("click", (e) => {
                if (e.target.classList.contains("folder-circle-select") || e.target.classList.contains("folder-visibility-toggle")) return;
                selectedSaveGroupId = group.id;
                saveData();
                document.querySelectorAll(".folder-circle-select").forEach(el => {
                    el.classList.remove("selected");
                });
                circleSelect.classList.add("selected");
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
                activeRightClickedFolderId = group.id;
                contextMenu.style.display = "block";
                contextMenu.style.left = `${e.pageX}px`;
                contextMenu.style.top = `${e.pageY}px`;
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

        titleEl.replaceWith(titleInput);
        dateEl.replaceWith(dateInput);

        titleInput.focus();
        titleInput.select();

        let finished = false;
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

        titleInput.addEventListener("blur", () => {
            setTimeout(() => {
                if (document.activeElement !== dateInput) applyEdit();
            }, 100);
        });

        dateInput.addEventListener("blur", () => {
            setTimeout(() => {
                if (document.activeElement !== titleInput) applyEdit();
            }, 100);
        });

        const handleKeys = (e) => {
            if (e.key === "Enter") applyEdit();
            if (e.key === "Escape") {
                finished = true;
                renderFolders(); // 撤销修改
            }
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
        // 清除双击标签后的左栏高亮
        document.querySelectorAll(".reminder-card.sidebar-highlight").forEach(el => {
            el.classList.remove("sidebar-highlight");
        });
    });

    // 动态计算节气主题色 (双重保险：优先通过 jqTable 精准对比，报错时则通过公历日期进行高准确度切割估算)
    const getJieQiColorTheme = (solar) => {
        try {
            const lunar = solar.getLunar();
            const jqTable = lunar.getJieQiTable(); 
            
            const liChun = jqTable["立春"];
            const liXia = jqTable["立夏"];
            const liQiu = jqTable["立秋"];
            const liDong = jqTable["立冬"];
            
            if (liChun && liXia && liQiu && liDong) {
                const currentDate = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
                const dLiChun = new Date(liChun.getYear(), liChun.getMonth() - 1, liChun.getDay());
                const dLiXia = new Date(liXia.getYear(), liXia.getMonth() - 1, liXia.getDay());
                const dLiQiu = new Date(liQiu.getYear(), liQiu.getMonth() - 1, liQiu.getDay());
                const dLiDong = new Date(liDong.getYear(), liDong.getMonth() - 1, liDong.getDay());
                
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
            console.error("JieQi table error, fallback to static date calculation:", e);
        }
        
        // 兜底方案：使用极精准的公历日期切分 (MMDD 形式)
        const m = solar.getMonth(); 
        const d = solar.getDay();
        const val = m * 100 + d;
        if (val >= 204 && val < 505) {
            return "wood"; // 2月4日 - 5月5日
        } else if (val >= 505 && val < 807) {
            return "fire"; // 5月5日 - 8月7日
        } else if (val >= 807 && val < 1107) {
            return "gold"; // 8月7日 - 11月7日
        } else {
            return "water"; // 11月7日 - 2月4日
        }
    };

    // 渲染右侧日历网格
    const renderCalendar = (year, month) => {
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

        // 构建包含 42 个日子的扁平数据数组
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

        // 3. 填充下月余格
        const totalCells = startOffset + totalDays;
        const remainingCells = 42 - totalCells;
        for (let i = 1; i <= remainingCells; i++) {
            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;
            daysData.push({ year: nextYear, month: nextMonth, day: i, isDimmed: true });
        }

        // 以星期几分行构建：7行，每行 1(表头) + 6(周跨度格子)
        const weekDayNames = ["一", "二", "三", "四", "五", "六", "日"];
        const cssWeekClasses = ["weekday-1", "weekday-2", "weekday-3", "weekday-4", "weekday-5", "weekday-6", "weekday-0"];

        for (let r = 0; r < 7; r++) {
            // 插入最左侧的竖排星期标题格
            const rowHeader = document.createElement("div");
            rowHeader.className = `week-row-header ${cssWeekClasses[r]}`;
            rowHeader.innerHTML = `星<br>期<br>${weekDayNames[r]}`;
            calendarDays.appendChild(rowHeader);

            // 插入本行对应的 6 个日历格
            for (let c = 0; c < 6; c++) {
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
                // 任务卡片等常规提醒：精确匹配年、月、日
                isMatch = (highlightedDate.year === year && highlightedDate.month === month && highlightedDate.day === day);
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
        foldersData.forEach(group => {
            if (group.visible === false) return;
            group.cards.forEach(card => {
                const parsed = parseCardDate(card.dateStr, year);
                
                // 生日和节日按年重复匹配
                const isRecurring = isBirthdayGroup(group) || isFestivalGroup(group);
                
                let matches = false;
                if (isRecurring) {
                    if (parsed.day !== null && parsed.day !== undefined) {
                        matches = (parsed.month === month && parsed.day === day);
                    } else {
                        // 无具体日期则匹配到该月第一天
                        matches = (parsed.month === month && day === 1);
                    }
                } else {
                    // 任务卡片等常规提醒精确匹配年份
                    if (parsed.day !== null && parsed.day !== undefined) {
                        matches = (parsed.year === year && parsed.month === month && parsed.day === day);
                    } else {
                        // 无具体日期则匹配到该月第一天
                        matches = (parsed.year === year && parsed.month === month && day === 1);
                    }
                }

                if (!isDimmed && matches) {
                    activeCards.push({
                        title: card.title,
                        group: group,
                        cardId: card.id   // 记录卡片 id，用于双击定位左侧栏
                    });
                }
            });
        });

        // 2. 渲染用户卡片提醒
        activeCards.forEach(card => {
            const tag = document.createElement("span");
            tag.className = "event-tag";
            // 分类着色
            if (isTaskGroup(card.group)) {
                tag.style.backgroundColor = "var(--color-fire)";
            } else if (isBirthdayGroup(card.group)) {
                tag.style.backgroundColor = "var(--color-gold)";
            } else if (isFestivalGroup(card.group)) {
                tag.style.backgroundColor = "var(--color-water)";
            } else {
                tag.style.backgroundColor = "var(--color-water)";
            }
            tag.textContent = card.title;
            tag.title = card.title; // 鼠标悬停时浏览器显示原生的完整提示气泡

            // 双击标签 → 高亮左栏对应卡片并滚动到可见
            tag.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                // 清除所有旧的高亮
                document.querySelectorAll(".reminder-card.sidebar-highlight").forEach(el => {
                    el.classList.remove("sidebar-highlight");
                });

                // 自动展开已折叠的源头文件夹
                const parentGroup = foldersData.find(g => g.id === card.group.id);
                if (parentGroup && parentGroup.collapsed) {
                    parentGroup.collapsed = false;
                    const groupEl = document.getElementById(parentGroup.id);
                    if (groupEl) {
                        groupEl.classList.remove("collapsed");
                    }
                    saveData();
                }

                // 找到左侧对应卡片 DOM
                const targetCard = document.getElementById(card.cardId);
                if (targetCard) {
                    targetCard.classList.add("sidebar-highlight");
                    targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            });

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
        selectYear.innerHTML = "";
        for (let y = 2026; y <= 2126; y++) {
            const opt = document.createElement("option");
            opt.value = y;
            opt.textContent = y;
            if (y === currentYear) opt.selected = true;
            selectYear.appendChild(opt);
        }
    };

    const initDaySelect = (selectedDayVal) => {
        selectDay.innerHTML = "";
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
        currentYear = parseInt(e.target.value);
        currentDay = parseInt(selectDay.value);
        renderCalendar(currentYear, currentMonth);
    });

    selectMonth.addEventListener("change", (e) => {
        highlightedDate = null; // 手动切换选择时，清除双击定位的高亮底色
        currentMonth = parseInt(e.target.value);
        currentDay = parseInt(selectDay.value);
        renderCalendar(currentYear, currentMonth);
    });
    // ‹ 上一个月 / › 下一个月 按钮
    document.getElementById("btn-month-prev").addEventListener("click", () => {
        highlightedDate = null;
        currentMonth -= 1;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear = Math.max(2026, currentYear - 1);
            selectYear.value = currentYear;
        }
        selectMonth.value = currentMonth;
        currentDay = parseInt(selectDay.value);
        renderCalendar(currentYear, currentMonth);
    });

    document.getElementById("btn-month-next").addEventListener("click", () => {
        highlightedDate = null;
        currentMonth += 1;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear = Math.min(2126, currentYear + 1);
            selectYear.value = currentYear;
        }
        selectMonth.value = currentMonth;
        currentDay = parseInt(selectDay.value);
        renderCalendar(currentYear, currentMonth);
    });

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
    document.getElementById("btn-save-top").addEventListener("click", saveNewReminder);
    document.getElementById("search-input").addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveNewReminder();
    });

    // 刷新跳回当天日期
    const resetToToday = () => {
        highlightedDate = null; // 刷新时，清除双击定位的高亮底色
        const today = new Date();
        currentYear = today.getFullYear();
        if (currentYear < 2026) currentYear = 2026;
        if (currentYear > 2126) currentYear = 2126;
        currentMonth = today.getMonth();
        currentDay = today.getDate();

        selectYear.value = currentYear;
        selectMonth.value = currentMonth;
        selectDay.value = currentDay;

        renderCalendar(currentYear, currentMonth);
    };

    // 绑定所有刷新按钮
    document.getElementById("btn-refresh").addEventListener("click", resetToToday);
    document.getElementById("btn-refresh-top").addEventListener("click", resetToToday);

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
    document.getElementById("btn-save").addEventListener("click", () => {
        saveData();
        exportDataToTxt();
    });

    // 相机按钮点击事件：播放快门音 Canon DSLR Shutter Sound.mp3，截取日历区域，另存为 YYYYMMDD-HHmm.jpg 并下载
    document.getElementById("btn-bg").addEventListener("click", () => {
        // 1. 播放 DSLR 快门声音
        try {
            const shutterSound = new Audio("设计风格/Canon DSLR Shutter Sound.mp3");
            shutterSound.play().catch(err => {
                console.log("Audio play blocked or file not found:", err);
            });
        } catch (e) {
            console.error("Audio error:", e);
        }

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
        }).catch(err => {
            console.error("html2canvas screenshot error:", err);
            alert("生成日历截图失败，请重试！");
        });
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

                if (backupMatch) {
                    title = backupMatch[1].trim();
                    dateStr = backupMatch[2].trim();
                } else {
                    // 2. 否则，使用智能多空白符/制表符切分
                    const parts = cleanLine.split(/\s{2,}|\t+/).map(p => p.trim()).filter(Boolean);

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

    // 初始化页面加载与首次渲染
    initYearSelect();
    initDaySelect(currentDay);
    renderFolders();
    renderCalendar(currentYear, currentMonth);
});
