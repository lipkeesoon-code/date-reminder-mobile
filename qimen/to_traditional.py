import os
import codecs

replacements = {
    '马': '馬',
    '腾蛇': '騰蛇',
    '天冲': '天衝',
    '天辅': '天輔',
    '惊': '驚',
    '伤': '傷',
    '开': '開',
    '阳': '陽',
    '阴': '陰',
    '门': '門',
    '排盘': '排盤',
    '击刑': '擊刑',
    '战': '戰',
    '东': '東',
    '南': '南',
    '西': '西',
    '北': '北',
    '时': '時',
    '历': '曆',
    '预测': '預測',
    '测': '測',
    '局数': '局數',
    '自动': '自動',
    '跟随': '跟隨',
    '指定': '指定',
    '无': '無',
    '落宫': '落宮',
    '加临': '加臨',
    '详解': '詳解',
    '势': '勢',
    '平稳': '平穩',
    '备': '備',
    '注': '註',
    '记事本': '記事本',
    '新建': '新建',
    '资料': '資料',
    '称': '稱',
    '保存': '保存',
    '记录': '記錄',
    '历史': '歷史',
    '删除': '刪除',
    '确认': '確認',
    '选择': '選擇',
    '查看': '查看',
    '发': '發',
    '败': '敗',
    '阵': '陣',
    '应': '應',
    '显': '顯',
    '隐': '隱',
    '干': '干',  # keep as is for Tiangan? Tiangan is 天干, not 天幹. It's usually 干 in both.
    '岁': '歲',
    '运': '運',
    '历法': '曆法',
    '格局': '格局',
    '伏吟': '伏吟',
    '反吟': '反吟',
    '客': '客',
    '主': '主'
}

# 干 in Tiangan doesn't change to 幹 in this context, it stays 干 (Tiangan). 
# Remove it from dict just in case.
if '干' in replacements:
    del replacements['干']

files = [
    'index.html',
    r'js\app.js',
    r'js\qimen_engine.js',
    r'js\bazi_utils.js'
]

for file_path in files:
    try:
        with codecs.open(file_path, 'r', 'utf-8') as f:
            content = f.read()
        
        for s, t in replacements.items():
            content = content.replace(s, t)
            
        with codecs.open(file_path, 'w', 'utf-8') as f:
            f.write(content)
        print(f'Processed {file_path}')
    except Exception as e:
        print(f'Error processing {file_path}: {e}')
