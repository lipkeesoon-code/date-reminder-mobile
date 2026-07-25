var fso = new ActiveXObject("Scripting.FileSystemObject");
var baziFile = fso.OpenTextFile("js\\\\bazi_utils.js", 1);
var baziCode = baziFile.ReadAll();
baziFile.Close();

var qimenFile = fso.OpenTextFile("js\\\\qimen_engine.js", 1);
var qimenCode = qimenFile.ReadAll();
qimenFile.Close();

// Replace const/let with var
baziCode = baziCode.replace(/\bconst\b/g, "var").replace(/\blet\b/g, "var");
qimenCode = qimenCode.replace(/\bconst\b/g, "var").replace(/\blet\b/g, "var");

// We need a dummy Array.prototype.find and Array.prototype.includes if not present in JScript
var polyfills = "Array.prototype.includes = function(el) { for(var i=0; i<this.length; i++) { if(this[i]===el) return true; } return false; };\\n";
polyfills += "Array.prototype.find = function(predicate) { for(var i=0; i<this.length; i++) { if(predicate(this[i])) return this[i]; } return undefined; };\\n";

eval(polyfills + baziCode + qimenCode);

var bazi = BaziUtils.getBazi(2014, 2, 5, 14);
var qm = QimenEngine.buildChart(2014, 2, 5, 14);

WScript.Echo("Bazi Day: " + bazi.day.stem + bazi.day.branch);
WScript.Echo("Ju: " + qm.juInfo);
WScript.Echo("Xun: " + qm.hourXun.xunGanzhi);
WScript.Echo("Palace 2 Star: " + qm.palaces[2].star);
WScript.Echo("Palace 5 parasite: " + qm.palaces[5].parasiteStar);
