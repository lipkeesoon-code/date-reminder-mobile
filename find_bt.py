import codecs
js = codecs.open('yijing/script.js', 'r', 'utf-8').read()

lines = js.split('\n')
for i, line in enumerate(lines):
    # simple heuristic
    bt = line.count("`")
    if bt > 0:
        print(f"Line {i+1} has backticks ({bt}): {line}")
