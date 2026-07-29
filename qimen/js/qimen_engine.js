/**
 * qimen_engine.js - 奇門遁甲 (Qi Men Dun Jia) 排盤与断语计算引擎
 */

const QimenEngine = (function () {
    const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

    // 五行属性
    const ELEMENT_MAP = {
        "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土", "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水",
        "子": "水", "丑": "土", "寅": "木", "卯": "木", "辰": "土", "巳": "火", "午": "火", "未": "土", "申": "金", "酉": "金", "戌": "土", "亥": "水",
        "坎": "水", "坤": "土", "震": "木", "巽": "木", "中": "土", "乾": "金", "兑": "金", "艮": "土", "离": "火",
        "休": "水", "死": "土", "傷": "木", "杜": "木", "開": "金", "驚": "金", "生": "土", "景": "火",
        "天蓬": "水", "天芮": "土", "天衝": "木", "天輔": "木", "天禽": "土", "天心": "金", "天柱": "金", "天任": "土", "天英": "火"
    };

    // 五行颜色代号
    const ELEMENT_COLOR_KEY = {
        "木": "wood", "火": "fire", "土": "earth", "金": "metal", "水": "water"
    };

    // 十干克应能量符号 (天盘加地盘)
    const STEM_ENERGY_MAP = {
        "乙乙": "⊖", "乙丙": "○", "乙丁": "○", "乙戊": "⊖", "乙己": "⊖", "乙庚": "⊗", "乙辛": "⊗", "乙壬": "⊗", "乙癸": "⊖",
        "丙乙": "○", "丙丙": "⊗", "丙丁": "○", "丙戊": "○", "丙己": "⊖", "丙庚": "⊗", "丙辛": "○", "丙壬": "⊗", "丙癸": "⊗",
        "丁乙": "○", "丁丙": "○", "丁丁": "○", "丁戊": "○", "丁己": "⊗", "丁庚": "⊗", "丁辛": "⊗", "丁壬": "○", "丁癸": "⊗",
        "戊乙": "⊖", "戊丙": "○", "戊丁": "○", "戊戊": "⊗", "戊己": "⊗", "戊庚": "⊗", "戊辛": "⊗", "戊壬": "⊗", "戊癸": "⊖",
        "己乙": "⊖", "己丙": "⊗", "己丁": "⊖", "己戊": "⊖", "己己": "⊗", "己庚": "⊗", "己辛": "⊗", "己壬": "⊗", "己癸": "⊗",
        "庚乙": "⊖", "庚丙": "⊗", "庚丁": "⊖", "庚戊": "⊗", "庚己": "⊗", "庚庚": "⊗", "庚辛": "⊗", "庚壬": "⊗", "庚癸": "⊗",
        "辛乙": "⊗", "辛丙": "○", "辛丁": "⊗", "辛戊": "⊗", "辛己": "⊗", "辛庚": "⊗", "辛辛": "⊗", "辛壬": "⊗", "辛癸": "⊗",
        "壬乙": "⊖", "壬丙": "⊗", "壬丁": "⊖", "壬戊": "○", "壬己": "⊗", "壬庚": "⊗", "壬辛": "⊗", "壬壬": "⊗", "壬癸": "⊗",
        "癸乙": "⊖", "癸丙": "○", "癸丁": "⊗", "癸戊": "○", "癸己": "⊗", "癸庚": "⊗", "癸辛": "⊗", "癸壬": "⊗", "癸癸": "⊗"
    };

    // 洛书九宫顺時针九宫环 (去除中5)
    // 顺時针顺序：1(坎) -> 8(艮) -> 3(震) -> 4(巽) -> 9(离) -> 2(坤) -> 7(兑) -> 6(乾)
    const PALACE_CYCLE = [1, 8, 3, 4, 9, 2, 7, 6];

    // 九宫信息定义
    const PALACES = {
        1: { name: "坎", element: "水", direction: "正北", num: 1, originalStar: "天蓬", originalDoor: "休", zhi: ["子"] },
        2: { name: "坤", element: "土", direction: "西南", num: 2, originalStar: "天芮", originalDoor: "死", zhi: ["未", "申"] },
        3: { name: "震", element: "木", direction: "正東", num: 3, originalStar: "天衝", originalDoor: "傷", zhi: ["卯"] },
        4: { name: "巽", element: "木", direction: "東南", num: 4, originalStar: "天輔", originalDoor: "杜", zhi: ["辰", "巳"] },
        5: { name: "中", element: "土", direction: "寄坤", num: 5, originalStar: "天禽", originalDoor: "", zhi: [] },
        6: { name: "乾", element: "金", direction: "西北", num: 6, originalStar: "天心", originalDoor: "開", zhi: ["戌", "亥"] },
        7: { name: "兑", element: "金", direction: "正西", num: 7, originalStar: "天柱", originalDoor: "驚", zhi: ["酉"] },
        8: { name: "艮", element: "土", direction: "東北", num: 8, originalStar: "天任", originalDoor: "生", zhi: ["丑", "寅"] },
        9: { name: "离", element: "火", direction: "正南", num: 9, originalStar: "天英", originalDoor: "景", zhi: ["午"] }
    };

    // 六仪三奇顺序
    const LIU_YI_SAN_QI = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];

    // 旬首与隱干映射
    const XUN_SHOU_MAP = {
        "甲子": "戊", "甲戌": "己", "甲申": "庚", "甲午": "辛", "甲辰": "壬", "甲寅": "癸"
    };

    // 八神定义（顺布/逆布顺序）
    const GODS_SEQ = ["值符", "騰蛇", "太陰", "六合", "白虎", "玄武", "九地", "九天"];

    // 二十四节气奇門三元定局表 (拆补法)
    const JIE_QI_JU = {
        "冬至": { dun: "陽", ju: [1, 7, 4] }, "小寒": { dun: "陽", ju: [2, 8, 5] }, "大寒": { dun: "陽", ju: [3, 9, 6] },
        "立春": { dun: "陽", ju: [8, 5, 2] }, "雨水": { dun: "陽", ju: [9, 6, 3] }, "驚蛰": { dun: "陽", ju: [1, 7, 4] },
        "春分": { dun: "陽", ju: [3, 9, 6] }, "清明": { dun: "陽", ju: [4, 1, 7] }, "谷雨": { dun: "陽", ju: [5, 2, 8] },
        "立夏": { dun: "陽", ju: [4, 1, 7] }, "小满": { dun: "陽", ju: [5, 2, 8] }, "芒种": { dun: "陽", ju: [6, 3, 9] },
        "夏至": { dun: "陰", ju: [9, 3, 6] }, "小暑": { dun: "陰", ju: [8, 2, 5] }, "大暑": { dun: "陰", ju: [7, 1, 4] },
        "立秋": { dun: "陰", ju: [2, 5, 8] }, "处暑": { dun: "陰", ju: [1, 4, 7] }, "白露": { dun: "陰", ju: [9, 3, 6] },
        "秋分": { dun: "陰", ju: [7, 1, 4] }, "寒露": { dun: "陰", ju: [6, 9, 3] }, "霜降": { dun: "陰", ju: [5, 8, 2] },
        "立冬": { dun: "陰", ju: [6, 9, 3] }, "小雪": { dun: "陰", ju: [5, 8, 2] }, "大雪": { dun: "陰", ju: [4, 7, 1] }
    };

    /**
     * 计算干支在60甲子中的索引
     */
    function getGanzhiIndex(stem, branch) {
        const s = GAN.indexOf(stem);
        const b = ZHI.indexOf(branch);
        if (s === -1 || b === -1) return 0;
        for (let i = 0; i < 60; i++) {
            if (i % 10 === s && i % 12 === b) return i;
        }
        return 0;
    }

    /**
     * 计算旬首与旬空地支
     */
    function getXunInfo(stem, branch) {
        const idx = getGanzhiIndex(stem, branch);
        const xunStartIdx = Math.floor(idx / 10) * 10;
        const xunStem = GAN[xunStartIdx % 10];
        const xunBranch = ZHI[xunStartIdx % 12];
        const xunGanzhi = xunStem + xunBranch;
        const xunYi = XUN_SHOU_MAP[xunGanzhi] || "戊";

        // 空亡计算：本旬没有用到的两个地支
        const usedZhi = [];
        for (let i = 0; i < 10; i++) {
            usedZhi.push(ZHI[(xunStartIdx + i) % 12]);
        }
        const kongWangZhi = ZHI.filter(z => !usedZhi.includes(z));

        return {
            xunGanzhi: xunGanzhi,
            xunYi: xunYi,
            kongWang: kongWangZhi
        };
    }

    /**
     * 计算驿馬星所在地支与宫位
     */
    function getYiMaPalace(hourBranch) {
        let maZhi = "";
        if (["申", "子", "辰"].includes(hourBranch)) maZhi = "寅";
        else if (["寅", "午", "戌"].includes(hourBranch)) maZhi = "申";
        else if (["巳", "酉", "丑"].includes(hourBranch)) maZhi = "亥";
        else if (["亥", "卯", "未"].includes(hourBranch)) maZhi = "巳";

        let palaceNum = 0;
        if (maZhi === "寅") palaceNum = 8;
        else if (maZhi === "申") palaceNum = 2;
        else if (maZhi === "亥") palaceNum = 6;
        else if (maZhi === "巳") palaceNum = 4;

        return { maZhi, palaceNum };
    }

    /**
     * 判断符头，求元（上元/中元/下元）
     */
    function getYuan(dayStem, dayBranch) {
        const idx = getGanzhiIndex(dayStem, dayBranch);
        const fuHeadIdx = Math.floor(idx / 5) * 5;
        const fuHeadBranch = ZHI[fuHeadIdx % 12];
        if (["子", "午", "卯", "酉"].includes(fuHeadBranch)) return 0; // 上元
        if (["寅", "申", "巳", "亥"].includes(fuHeadBranch)) return 1; // 中元
        return 2; // 下元
    }

    /**
     * 門宫戰格生克推算 (如和戰、守戰、宫戰、轻戰、同戰等)
     */
    function getDoorPalaceZhan(door, palaceNum) {
        if (!door) return "";
        const palaceName = PALACES[palaceNum].name;
        const dElem = ELEMENT_MAP[door];
        const pElem = ELEMENT_MAP[palaceName];

        const KE = { "木": "土", "土": "水", "水": "火", "火": "金", "金": "木" };
        const SHENG = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };

        if (dElem === pElem) return "不戰"; // 比和/同戰
        if (SHENG[dElem] === pElem) return "緩戰"; // 門生宫
        if (SHENG[pElem] === dElem) return "和戰"; // 宫生門
        if (KE[dElem] === pElem) return "宮戰"; // 門克宫 (門迫/宫戰)
        if (KE[pElem] === dElem) return "守戰"; // 宫克門 (制迫/守戰)
        return "和戰";
    }

    /**
     * 地支藏干
     */
    function getCangGan(zhi) {
        const cangMap = {
            "子": ["癸"],
            "丑": ["己", "癸", "辛"],
            "寅": ["甲", "丙", "戊"],
            "卯": ["乙"],
            "辰": ["戊", "乙", "癸"],
            "巳": ["丙", "庚", "戊"],
            "午": ["丁", "己"],
            "未": ["己", "丁", "乙"],
            "申": ["庚", "壬", "戊"],
            "酉": ["辛"],
            "戌": ["戊", "辛", "丁"],
            "亥": ["壬", "甲"]
        };
        return cangMap[zhi] || ["戊"];
    }

    /**
     * 主排盤入口
     */
    function buildChart(params) {
        const { year, month, day, hour, minute = 0, name = "未知", gender = "M", juOverride = "auto" } = params;

        // 1. 获取四柱
        // 根据数字取得时辰地支
        const zhiList = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
        let hourIdx = Math.floor((hour + 1) / 2) % 12;
        let hourBranch = zhiList[hourIdx];

        let pillars = BaziUtils.calculatePillars(year, month, day, hourBranch, minute);
        
        function getDunJiaHidden(stem, branch) {
            if (stem === "甲") {
                const hideMap = { "子": "戊", "戌": "己", "申": "庚", "午": "辛", "辰": "壬", "寅": "癸" };
                return hideMap[branch] || "";
            }
            return "";
        }

        // 四柱干支 (奇門遁甲特有：只有六甲才顯示隱藏的六仪)
        const yPillar = { stem: pillars.year.stem, branch: pillars.year.branch, cang: getDunJiaHidden(pillars.year.stem, pillars.year.branch) };
        const mPillar = { stem: pillars.month.stem, branch: pillars.month.branch, cang: getDunJiaHidden(pillars.month.stem, pillars.month.branch) };
        const dPillar = { stem: pillars.day.stem, branch: pillars.day.branch, cang: getDunJiaHidden(pillars.day.stem, pillars.day.branch) };
        const hPillar = { stem: pillars.hour.stem, branch: pillars.hour.branch, cang: getDunJiaHidden(pillars.hour.stem, pillars.hour.branch) };

        let currentJieQi = BaziUtils.getJieQiInfo(year, month, day, hour, minute).jieQi;
        
        let juNum = 1;
        let isYang = true;
        let dunName = "陽";

        if (juOverride !== "auto") {
            isYang = juOverride.startsWith("yang");
            juNum = parseInt(juOverride.replace(/\D/g, ""));
            dunName = isYang ? "陽" : "陰";
        } else {
            const jieData = JIE_QI_JU[currentJieQi] || { dun: "陽", ju: [1, 7, 4] };
            const yuanIdx = getYuan(dPillar.stem, dPillar.branch);
            juNum = jieData.ju[yuanIdx];
            isYang = jieData.dun === "陽";
            dunName = jieData.dun;
        }

        // 3. 计算地盘三奇六仪落宮
        // 六仪三奇：戊、己、庚、辛、壬、癸、丁、丙、乙
        const dipan = {}; // palaceNum -> stem
        let currentPalace = juNum;

        for (let i = 0; i < LIU_YI_SAN_QI.length; i++) {
            dipan[currentPalace] = LIU_YI_SAN_QI[i];
            if (isYang) {
                currentPalace = currentPalace % 9 + 1;
            } else {
                currentPalace = currentPalace - 1;
                if (currentPalace < 1) currentPalace = 9;
            }
        }

        // 4. 计算旬首与值符/值使
        const hourXun = getXunInfo(hPillar.stem, hPillar.branch);
        const xunYi = hourXun.xunYi; // 旬首六仪 (如戊,庚)

        // 找到旬首六仪地盘落宮
        let xunPalaceNum = 1;
        for (let p = 1; p <= 9; p++) {
            if (dipan[p] === xunYi) {
                xunPalaceNum = p;
                break;
            }
        }

        // 确定值符星与值使門
        const zhiFuStar = PALACES[xunPalaceNum].originalStar;
        const zhiShiDoor = PALACES[xunPalaceNum].originalDoor || "死"; // 若在5宫寄2宫

        // 5. 天盘九星与天盘奇仪落宮
        // 找到時干地盘落宮 (若時干为甲，则用旬首六仪)
        let timeStem = hPillar.stem === "甲" ? xunYi : hPillar.stem;
        let timeStemPalaceNum = 1;
        for (let p = 1; p <= 9; p++) {
            if (dipan[p] === timeStem) {
                timeStemPalaceNum = p;
                break;
            }
        }

        // 天盘九星带动天盘干旋转
        // 旋转起始点：把值符星从 xunPalaceNum 移到 timeStemPalaceNum
        const tianpanStars = {}; // palaceNum -> star
        const tianpanStems = {}; // palaceNum -> stem

        // 去除5宫的8宫位循环环
        function getCycleOffset(pFrom, pTo) {
            let idxFrom = PALACE_CYCLE.indexOf(pFrom);
            let idxTo = PALACE_CYCLE.indexOf(pTo);
            if (idxFrom === -1) idxFrom = PALACE_CYCLE.indexOf(2); // 中5寄坤2
            if (idxTo === -1) idxTo = PALACE_CYCLE.indexOf(2);
            return (idxTo - idxFrom + 8) % 8;
        }

        const offset = getCycleOffset(xunPalaceNum, timeStemPalaceNum);

        let ruiTargetPalace = 2;
        PALACE_CYCLE.forEach((pNum, idx) => {
            const targetPNum = PALACE_CYCLE[(idx + offset) % 8];
            const star = PALACES[pNum].originalStar;
            tianpanStars[targetPNum] = star;
            tianpanStems[targetPNum] = dipan[pNum];
            if (star === "天芮") {
                ruiTargetPalace = targetPNum;
            }
        });

        // 5宮寄宮 (天禽和中宮天干跟隨天芮)
        const parasiticStars = {};
        const parasiticStems = {};
        parasiticStars[ruiTargetPalace] = "天禽";
        parasiticStems[ruiTargetPalace] = dipan[5];
        tianpanStars[5] = "天禽";
        tianpanStems[5] = dipan[5];

        // 6. 人盘八門落宮
        // 值使門根据時支从 xunPalaceNum 顺排(陽遁)或逆排(陰遁)
        const hourGanzhiIdx = getGanzhiIndex(hPillar.stem, hPillar.branch);
        const xunGanzhiIdx = getGanzhiIndex("甲", hourXun.xunGanzhi.substring(1));
        const steps = (hourGanzhiIdx - xunGanzhiIdx + 60) % 60; // 走过的步数

        let zhiShiPalaceNum = xunPalaceNum;
        if (isYang) {
            for (let i = 0; i < steps; i++) {
                zhiShiPalaceNum = zhiShiPalaceNum % 9 + 1;
            }
        } else {
            for (let i = 0; i < steps; i++) {
                zhiShiPalaceNum = zhiShiPalaceNum - 1;
                if (zhiShiPalaceNum < 1) zhiShiPalaceNum = 9;
            }
        }
        if (zhiShiPalaceNum === 5) zhiShiPalaceNum = 2; // 寄坤2宫

        const doors = {}; // palaceNum -> door
        const doorOffset = getCycleOffset(xunPalaceNum, zhiShiPalaceNum);

        PALACE_CYCLE.forEach((pNum, idx) => {
            const targetPNum = PALACE_CYCLE[(idx + doorOffset) % 8];
            const door = PALACES[pNum].originalDoor;
            doors[targetPNum] = door;
        });

        // 7. 神盘八神落宮
        // 八神之首“值符”加臨天盘值符星落宮 (timeStemPalaceNum)
        const gods = {}; // palaceNum -> god
        let starTargetPalace = timeStemPalaceNum === 5 ? 2 : timeStemPalaceNum;
        let starTargetIdx = PALACE_CYCLE.indexOf(starTargetPalace);

        let currentGodsSeq = isYang 
            ? ["值符", "騰蛇", "太陰", "六合", "勾陈", "朱雀", "九地", "九天"]
            : ["值符", "騰蛇", "太陰", "六合", "白虎", "玄武", "九地", "九天"];

        currentGodsSeq.forEach((godName, gIdx) => {
            let targetIdx;
            if (isYang) {
                targetIdx = (starTargetIdx + gIdx) % 8;
            } else {
                targetIdx = (starTargetIdx - gIdx + 8) % 8;
            }
            const pNum = PALACE_CYCLE[targetIdx];
            gods[pNum] = godName;
        });

        // 8. 结合空亡与馬星
        const { kongWang } = hourXun;
        const { maZhi, palaceNum: maPalace } = getYiMaPalace(hPillar.branch);

        // 9. 判断重要格局 (伏吟/反吟/時干入墓)
        let isStarFuYin = true;
        let isDoorFuYin = true;
        let isStemFuYin = true;
        
        let isStarFanYin = true;
        let isDoorFanYin = true;
        let isStemFanYin = true;

        const OPPOSITE = { 1:9, 9:1, 2:8, 8:2, 3:7, 7:3, 4:6, 6:4 };

        PALACE_CYCLE.forEach(p => {
            if (tianpanStars[p] !== PALACES[p].originalStar) isStarFuYin = false;
            if (doors[p] !== PALACES[p].originalDoor) isDoorFuYin = false;
            if (tianpanStems[p] !== dipan[p]) isStemFuYin = false;

            const opp = OPPOSITE[p];
            if (tianpanStars[p] !== PALACES[opp].originalStar) isStarFanYin = false;
            if (doors[p] !== PALACES[opp].originalDoor) isDoorFanYin = false;
            if (tianpanStems[p] !== dipan[opp]) isStemFanYin = false;
        });

        const geJuList = [];
        if (isDoorFuYin) geJuList.push("八門伏吟");
        if (isStarFuYin) geJuList.push("九星伏吟");
        if (isStemFuYin) geJuList.push("天干伏吟");
        
        if (isDoorFanYin) geJuList.push("八門反吟");
        if (isStarFanYin) geJuList.push("九星反吟");
        if (isStemFanYin) geJuList.push("天干反吟");

        // 時干入墓 (两种情况：1. 特定时辰本身；2. 天盘时干落入其墓宫)
        let hasShiGanRuMu = false;
        const shiGanzhi = hPillar.stem + hPillar.branch;
        const SHI_GAN_RU_MU_TIMES = ["丙戌", "丁丑", "戊戌", "己丑", "壬辰", "癸未"];
        
        if (SHI_GAN_RU_MU_TIMES.includes(shiGanzhi)) {
            hasShiGanRuMu = true;
        }

        const ruMuRules = {
            2: ["癸"],
            6: ["丙", "戊", "乙"],
            8: ["丁", "己", "庚"],
            4: ["辛", "壬"]
        };
        const shiGan = hPillar.stem;
        // 找到時干落宫 (看天盘)
        for (let p = 1; p <= 9; p++) {
            if (p === 5) continue;
            if (tianpanStems[p] === shiGan) {
                if (ruMuRules[p] && ruMuRules[p].includes(shiGan)) {
                    hasShiGanRuMu = true;
                }
                break;
            }
        }

        if (hasShiGanRuMu) {
            geJuList.push("時干入墓");
        }

        const geJuText = geJuList.length > 0 ? geJuList.join("，") : "無";

        // 10. 组织九宫格各宫完整数据结构
        const palaceDataList = {};

        [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(p => {
            const pInfo = PALACES[p];
            const tStem = tianpanStems[p] || dipan[p];
            const dStem = dipan[p];
            const star = tianpanStars[p] || pInfo.originalStar;
            const door = doors[p] || pInfo.originalDoor;
            const god = gods[p] || "值符";
            const zhan = getDoorPalaceZhan(door, p);

            // 标註空亡/馬星角标 (按地支逐行显示)
            let extraTag = "";
            const fourPillarsZhi = [yPillar.branch, mPillar.branch, dPillar.branch, hPillar.branch];
            const clashMap = {
                "子": "午", "午": "子", "丑": "未", "未": "丑",
                "寅": "申", "申": "寅", "卯": "酉", "酉": "卯",
                "辰": "戌", "戌": "辰", "巳": "亥", "亥": "巳"
            };
            const maZhi = getYiMaPalace(hPillar.branch).maZhi;

            let tagRows = [];
            pInfo.zhi.forEach(z => {
                let isKong = kongWang.includes(z);
                let isMa = (z === maZhi && p === maPalace); // Ensure it's in the Ma Palace
                
                if (isKong || isMa) {
                    let rowHtml = `<div style="display:flex; align-items:center; line-height:1.2; margin-bottom:1px;">`;
                    rowHtml += `<span style="margin-right:0px; font-size:11px;">${z}</span>`;
                    
                    if (isKong) {
                        // 老师的系统只在“填实”（原支存在于四柱）时显示蓝色底，而“冲实”时仍是普通空亡
                        let isFilled = fourPillarsZhi.includes(z);
                        if (isFilled) {
                            rowHtml += `<span class="kong-circle filled">空</span>`;
                        } else {
                            rowHtml += `<span class="kong-circle">空</span>`;
                        }
                    }
                    if (isMa) {
                        rowHtml += `<span class="ma-circle">馬</span>`;
                    }
                    rowHtml += `</div>`;
                    tagRows.push(rowHtml);
                }
            });

            if (tagRows.length > 0) {
                extraTag = `<div style="display:flex; flex-direction:column; align-items:flex-start;">${tagRows.join('')}</div>`;
            }

            // 吉格角标 (如丁奇昇、乙奇昇等)
            const badges = [];

            // 经典克应格局 (四大凶格)
            if (tStem === "乙" && dStem === "辛") badges.push("青龍逃走");
            if (tStem === "辛" && dStem === "乙") badges.push("白虎猖狂");
            if (tStem === "丁" && dStem === "癸") badges.push("朱雀投江");
            if (tStem === "癸" && dStem === "丁") badges.push("騰蛇妖嬌");
            
            // 宫迫 (宫克门)
            const gongPoRules = {
                1: ["景"],
                2: ["休"],
                3: ["生", "死"],
                4: ["生", "死"],
                6: ["伤", "傷", "杜"],
                7: ["伤", "傷", "杜"],
                8: ["休"],
                9: ["惊", "驚", "开", "開"]
            };
            if (gongPoRules[p] && gongPoRules[p].includes(door)) {
                badges.push("宫迫");
            }

            // 吉格 (三奇旺相) - 放在凶格后面
            if (tStem === "乙" && [1, 3, 4].includes(p)) {
                badges.push("<span class='color-fire'>乙奇旺相</span>");
            }
            if (tStem === "丙" && [3, 4, 9].includes(p)) {
                badges.push("<span class='color-fire'>丙奇旺相</span>");
            }
            if (tStem === "丁" && [3, 4, 9].includes(p)) {
                badges.push("<span class='color-fire'>丁奇旺相</span>");
            }

            // 其他吉格
            if (tStem === "戊" && dStem === "丙") {
                badges.push("<span class='color-fire'>青龍返首</span>");
            }
            if (p === zhiShiPalaceNum && dStem === "丁") {
                badges.push("<span class='color-fire'>玉女守門</span>");
            }

            // 门破 (门克宫)
            const menPoRules = {
                1: ["生", "死"],
                2: ["伤", "傷", "杜"],
                3: ["惊", "驚", "开", "開"],
                4: ["惊", "驚", "开", "開"],
                6: ["景"],
                7: ["景"],
                8: ["伤", "傷", "杜"],
                9: ["休"]
            };
            let isMenPo = false;
            if (menPoRules[p] && menPoRules[p].includes(door)) {
                isMenPo = true;
            }

            // 击刑 (天盘天干落宫)
            const jiXingRules = {
                2: ["己"],
                3: ["戊"],
                4: ["壬", "癸"],
                8: ["庚"],
                9: ["辛"]
            };
            let isJiXing = false;
            if (jiXingRules[p] && jiXingRules[p].includes(tStem)) {
                isJiXing = true;
            }

            // 入墓 (天盘天干落宫)
            const ruMuRules = {
                2: ["癸"],
                4: ["辛", "壬"],
                6: ["乙", "丙", "戊"],
                8: ["丁", "己", "庚"]
            };
            let isRuMu = false;
            if (ruMuRules[p] && ruMuRules[p].includes(tStem)) {
                isRuMu = true;
            }

            // 判断内外盘 (根据罗老师学派：阳遁外盘内盘与传统相反)
            let isInnerPlate = false;
            if (isYang) {
                isInnerPlate = [9, 2, 7, 6].includes(p); // 阳遁
            } else {
                isInnerPlate = [1, 8, 3, 4].includes(p); // 阴遁
            }

            palaceDataList[p] = {
                num: p,
                name: pInfo.name,
                element: pInfo.element,
                elemKey: ELEMENT_COLOR_KEY[pInfo.element],
                direction: pInfo.direction,
                zhi: pInfo.zhi,
                tStem: tStem,
                dStem: dStem,
                star: star,
                starElem: ELEMENT_MAP[star],
                door: door,
                doorElem: ELEMENT_MAP[door],
                god: god,
                parasiteStar: parasiticStars[p] || null,
                parasiteStem: parasiticStems[p] || null,
                zhan: zhan,
                extraTag: extraTag,
                badges: badges,
                isMenPo: isMenPo,
                isRuMu: isRuMu,
                isJiXing: isJiXing,
                isInnerPlate: isInnerPlate,
                energySymbol: STEM_ENERGY_MAP[tStem + dStem] || "⊖"
            };
        });

        // 填充中宫 (5宫)
        palaceDataList[5] = {
            num: 5,
            name: "中",
            element: "土",
            elemKey: "earth",
            direction: "中",
            tStem: tianpanStems[5],
            dStem: dipan[5],
            star: "天禽",
            starElem: "土",
            door: "",
            doorElem: "",
            god: "",
            zhan: "",
            extraTag: "",
            badges: [],
            energySymbol: STEM_ENERGY_MAP[tianpanStems[5] + dipan[5]] || "⊖"
        };

        // 10. 计算時家紫白 (Time Purple White Flying Stars)
        // 判定冬至或夏至后
        // 简易判断：1-6月基本为冬至后(陽遁)，7-12月为夏至后(陰遁)
        // 这里用月份大致判断，更精确應按节气
        let isZiBaiYang = true;
        const jIdx = BaziUtils.SOLAR_TERMS.indexOf(currentJieQi);
        if (jIdx >= BaziUtils.SOLAR_TERMS.indexOf("夏至") && jIdx < BaziUtils.SOLAR_TERMS.indexOf("冬至")) {
            isZiBaiYang = false;
        }

        const dBranch = dPillar.branch;
        let ziHourStar = 1;
        if (["子", "午", "卯", "酉"].includes(dBranch)) {
            ziHourStar = isZiBaiYang ? 1 : 9;
        } else if (["辰", "戌", "丑", "未"].includes(dBranch)) {
            ziHourStar = isZiBaiYang ? 4 : 6;
        } else {
            ziHourStar = isZiBaiYang ? 7 : 3;
        }

        const hBranchIdx = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"].indexOf(hPillar.branch);
        let centerStar = ziHourStar;
        if (isZiBaiYang) {
            centerStar = (ziHourStar + hBranchIdx) % 9;
            if (centerStar === 0) centerStar = 9;
        } else {
            centerStar = (ziHourStar - hBranchIdx) % 9;
            if (centerStar <= 0) centerStar += 9;
        }

        // 紫白飞宫 (按洛书轨迹 5->6->7->8->9->1->2->3->4)
        const ziBaiArr = {};
        const luoShuPath = [5, 6, 7, 8, 9, 1, 2, 3, 4];
        luoShuPath.forEach((p, idx) => {
            let starNum = centerStar;
            if (isZiBaiYang) {
                starNum = (centerStar + idx) % 9;
                if (starNum === 0) starNum = 9;
            } else {
                starNum = (centerStar - idx) % 9;
                if (starNum <= 0) starNum += 9;
            }
            ziBaiArr[p] = starNum;
        });

        for (let i = 1; i <= 9; i++) {
            if (palaceDataList[i]) {
                palaceDataList[i].ziBai = ziBaiArr[i];
            }
        }

        let dunText = `${isYang ? "阳遁" : "阴遁"} ${juNum} 局 (${currentJieQi})`;
        if (juOverride === "auto") {
            dunText += " (置闰法)";
        } else {
            dunText += " (自定)";
        }

        return {
            name,
            gender,
            solarDate: `${year} / ${month} / ${day}`,
            lunarStr: "",
            timeText: `${hour}:${minute < 10 ? '0' + minute : minute}`,
            dunText: dunText,
            geJuText: geJuText,
            pillars: {
                year: yPillar,
                month: mPillar,
                day: dPillar,
                hour: hPillar
            },
            xunInfo: hourXun,
            palaces: palaceDataList
        };
    }

    return {
        buildChart: buildChart,
        PALACES: PALACES,
        ELEMENT_COLOR_KEY: ELEMENT_COLOR_KEY
    };
})();

if (typeof window !== "undefined") {
    window.QimenEngine = QimenEngine;
}
