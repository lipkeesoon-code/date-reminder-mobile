var fso = new ActiveXObject("Scripting.FileSystemObject");
try {
    var stream = fso.OpenTextFile("C:/Users/user/Downloads/QiMenDunJia  MobileApps/js/cursor.js", 1);
    var content = stream.ReadAll();
    stream.Close();
    eval(content);
    WScript.Echo("cursor.js : OK");
} catch(e) {
    WScript.Echo("cursor.js : ERROR - " + e.message);
}
