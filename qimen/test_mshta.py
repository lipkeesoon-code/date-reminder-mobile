import codecs
import os

try:
    c1 = codecs.open(r'js\bazi_utils.js', 'r', 'utf-8').read()
    c2 = codecs.open(r'js\qimen_engine.js', 'r', 'utf-8').read()
    c3 = codecs.open(r'js\app.js', 'r', 'utf-8').read()
    
    # Check simple syntax using Python's regex to find hanging things?
    # No, let's just write a basic check that prints the last few lines of the files.
    # Actually, we can just read the whole files and run a quick heuristic.
    
    # Or maybe I can use MSHTA to run javascript!!!
    mshta_code = """
    <html>
    <head>
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <script src="js/bazi_utils.js"></script>
    <script src="js/qimen_engine.js"></script>
    <script>
    window.onload = function() {
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var f = fso.CreateTextFile("error_log.txt", true);
        try {
            var data = QimenEngine.buildChart({year: 2026, month: 7, day: 22, hour: 0});
            f.WriteLine("SUCCESS");
        } catch(e) {
            f.WriteLine("ERROR: " + e.message);
        }
        f.Close();
        window.close();
    };
    window.onerror = function(msg, url, line, col, error) {
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var f = fso.CreateTextFile("error_log.txt", true);
        f.WriteLine("GLOBAL ERROR: " + msg + " at " + line + ":" + col);
        f.Close();
    };
    </script>
    </head>
    <body>Running...</body>
    </html>
    """
    codecs.open('test_mshta.hta', 'w', 'utf-8').write(mshta_code)
except Exception as e:
    print(e)
