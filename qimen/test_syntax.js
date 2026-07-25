var fso = new ActiveXObject("Scripting.FileSystemObject");
function load(file) {
    var stream = fso.OpenTextFile(file, 1);
    var content = stream.ReadAll();
    stream.Close();
    return content;
}
try {
    eval(load("C:/Users/user/Downloads/QiMenDunJia  MobileApps/js/lunar.js"));
    eval(load("C:/Users/user/Downloads/QiMenDunJia  MobileApps/js/bazi_utils.js"));
    eval(load("C:/Users/user/Downloads/QiMenDunJia  MobileApps/js/qimen_engine.js"));
    eval(load("C:/Users/user/Downloads/QiMenDunJia  MobileApps/js/app.js"));
    WScript.Echo("Syntax OK!");
} catch(e) {
    WScript.Echo("Syntax/Runtime Error: " + e.name + " - " + e.message);
}
