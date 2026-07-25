import codecs
import re

bazi_code = codecs.open(r'js\bazi_utils.js', 'r', 'utf-8').read()
qimen_code = codecs.open(r'js\qimen_engine.js', 'r', 'utf-8').read()

# Replace const/let with var for execjs compatibility if needed, but Python 3 can use PyExecJS which might use Node. 
# But node is not installed. Let's write a simple VBScript or use Python's built-in abilities.
# Actually, I can just use MSHTA to run the code and write to a file!
hta_content = """
<html>
<head>
<meta charset="utf-8">
<script>
""" + bazi_code + """
""" + qimen_code + """
function run() {
    try {
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var file = fso.CreateTextFile("debug_output.txt", true);
        var bazi = BaziUtils.getBazi(2014, 2, 5, 14); // 2014-02-05 14:00 (Wei hour is 13:00-15:00)
        var qm = QimenEngine.buildChart(2014, 2, 5, 14);
        
        file.WriteLine("Bazi: " + JSON.stringify(bazi));
        file.WriteLine("Ju: " + qm.juInfo);
        file.WriteLine("Dipan: " + JSON.stringify(qm.dipan));
        
        for (var p = 1; p <= 9; p++) {
            var pal = qm.palaces[p];
            if (pal) {
                file.WriteLine("Palace " + p + ": star=" + pal.star + ", door=" + pal.door + ", tStem=" + pal.tStem + ", dStem=" + pal.dStem + ", god=" + pal.god);
            }
        }
        
        file.Close();
    } catch(e) {
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var file = fso.CreateTextFile("debug_output.txt", true);
        file.WriteLine("Error: " + e.message);
        file.Close();
    }
    window.close();
}
</script>
</head>
<body onload="run()">
</body>
</html>
"""

codecs.open('test.hta', 'w', 'utf-8').write(hta_content)
