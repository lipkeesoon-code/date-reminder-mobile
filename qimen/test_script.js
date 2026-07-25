const fs = require('fs');
eval(fs.readFileSync('./js/bazi_utils.js', 'utf8'));
eval(fs.readFileSync('./js/qimen_engine.js', 'utf8'));

// Test Yin 5 Ju
const params = {
    year: 2024,
    month: 11,
    day: 15,
    hour: 17, // 酉时 (5-7pm)
    minute: 30,
    juOverride: "yin5" // Force Yin 5 Ju
};

const chart = QimenEngine.buildChart(params);

console.log("Ju Info:", chart.dunText);
console.log("Xun Shou:", chart.xunInfo.xunGanzhi, "Yi:", chart.xunInfo.xunYi);

for (let i = 1; i <= 9; i++) {
    if (i===5) continue;
    const p = chart.palaces[i];
    console.log(`Palace ${i}: TStem: ${p.tStem}, DStem: ${p.dStem}, Star: ${p.star}, Door: ${p.door}, God: ${p.god}`);
}
