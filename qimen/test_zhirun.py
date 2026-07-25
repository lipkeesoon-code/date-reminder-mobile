import math
from datetime import datetime, timedelta

ST_CONSTANTS = [
    3.87, 18.73, 5.63, 20.646, 4.81, 20.1, 5.52, 21.04, 
    5.678, 21.37, 7.108, 22.83, 7.5, 23.13, 7.646, 23.042, 
    8.318, 23.438, 7.438, 22.36, 7.18, 21.94, 5.405, 20.12
]

def getSolarTermDay(y, n):
    if n < 0 or n > 23: return -1
    yearOffset = y % 100
    C = ST_CONSTANTS[n]
    d = math.floor(yearOffset * 0.2422 + C) - math.floor((yearOffset - (1 if n <= 2 else 0)) / 4)
    if y == 2026 and n == 0: return 4
    if y == 2022 and n == 0: return 4
    if y == 2012 and n == 0: return 4
    if y == 1987 and n == 0: return 4
    return d

def getSolarTermMonth(n):
    return math.floor(n / 2) + 2

def getAstroTermDate(y, termIndex):
    m = getSolarTermMonth(termIndex)
    yy = y
    if m > 12:
        m -= 12
        yy += 1
    d = getSolarTermDay(yy, termIndex)
    return datetime(yy, m, int(d), 12, 0, 0)

ZHI_RUN_TERMS = [
    "冬至", "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种",
    "夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪"
]

def getZhirunJieQi(targetDate):
    currentDate = datetime(1924, 12, 22, 12, 0, 0)
    currentTermIndex = 0
    
    while currentDate < targetDate:
        nextDate = currentDate + timedelta(days=15)
        
        if currentTermIndex == 11 or currentTermIndex == 23:
            nextTermOriginalIndex = 9 if currentTermIndex == 11 else 21
            nextAstroDate = getAstroTermDate(nextDate.year, nextTermOriginalIndex)
            
            diffDays = (nextDate - nextAstroDate).days
            
            if diffDays >= 9:
                currentDate = nextDate
                if currentDate > targetDate: break
                continue
                
        currentDate = nextDate
        currentTermIndex = (currentTermIndex + 1) % 24
        
    return ZHI_RUN_TERMS[currentTermIndex]

print("2024-11-15 ->", getZhirunJieQi(datetime(2024, 11, 15, 12, 0, 0)))
print("2024-11-07 ->", getZhirunJieQi(datetime(2024, 11, 7, 12, 0, 0)))
