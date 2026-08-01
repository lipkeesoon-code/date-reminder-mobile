import codecs
js = codecs.open('yijing/script.js', 'r', 'utf-8').read()
print('Single:', js.count("'"))
print('Double:', js.count('"'))
print('Backtick:', js.count('`'))
