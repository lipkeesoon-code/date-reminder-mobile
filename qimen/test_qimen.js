const fs = require('fs');
eval(fs.readFileSync('C:/Users/user/Downloads/QiMenDunJia  MobileApps/js/bazi_utils.js', 'utf8'));
eval(fs.readFileSync('C:/Users/user/Downloads/QiMenDunJia  MobileApps/js/li_chun_data.js', 'utf8'));
eval(fs.readFileSync('C:/Users/user/Downloads/QiMenDunJia  MobileApps/js/qimen_engine.js', 'utf8'));

const year = 2026;
const month = 7;
const day = 22;
const hour = 19; // 戌时 (19:00 - 21:00)

const pillars = BaziUtils.calculatePillars(year, month, day, '戌', 30);
console.log("Pillars:", pillars);

const jieQiInfo = BaziUtils.getJieQiInfo(year, month, day);
console.log("JieQi:", jieQiInfo);

const qimenData = QimenEngine.buildChart({ year, month, day, hour, minute: 30 });
console.log("Geju Text:", qimenData.geJuText);

const palaces = qimenData.palaces;
for (let i=1; i<=9; i++) {
    if (palaces[i]) {
        console.log(`Palace ${i}: TopStem=${palaces[i].tStem} BotStem=${palaces[i].dStem} Star=${palaces[i].star} Door=${palaces[i].door} God=${palaces[i].god}`);
    }
}
