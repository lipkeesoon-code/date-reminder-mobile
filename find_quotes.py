import codecs
js = codecs.open('yijing/script.js', 'r', 'utf-8').read()

lines = js.split('\n')
for i, line in enumerate(lines):
    # simple heuristic: strip out escaped quotes
    line_clean = line.replace("\\'", "").replace('\\"', "")
    sq = line_clean.count("'")
    if sq % 2 != 0:
        print(f"Line {i+1} has odd single quotes ({sq}): {line}")
