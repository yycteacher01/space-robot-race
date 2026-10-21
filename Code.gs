/* 第一屆太空機械人競速賽 Google Sheet 連接程式
 * 在一份專用試算表的「擴充功能 > Apps Script」貼上此檔。
 * 本表已建立完成，不須執行 setupCompetition；直接部署為網頁應用程式。
 * doGet 只讀取指定的成績欄位，絕不寫入；輸出可被知道網址的人讀取。
 */
const COMPETITION_SPREADSHEET_ID='1CsbL8KaRxxKcpNYNvPu61NqI5TOOxrXyl9O6uSXLTLI';
const HEADERS=['隊號','隊伍名稱','學校','項目一第1次分數','項目一第1次時間','項目一第1次狀態','項目一第2次分數','項目一第2次時間','項目一第2次狀態','項目二第1次分數','項目二第1次時間','項目二第1次狀態','項目二第2次分數','項目二第2次時間','項目二第2次狀態'];
function setupCompetition(){
 const ss=SpreadsheetApp.getActiveSpreadsheet();if(!ss)throw new Error('請從專用Google試算表開啟Apps Script。');
 PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID',ss.getId());
 for(let n=1;n<=4;n++){
  const name=n===4?'校內':'第'+n+'場';let sh=ss.getSheetByName(name);
  if(sh&&sh.getLastRow()>0){const old=sh.getRange(1,1,1,15).getDisplayValues()[0];if(JSON.stringify(old)!==JSON.stringify(HEADERS))throw new Error(name+'已有其他資料，請先另建專用試算表，程式不會覆蓋。');continue;}
  sh=sh||ss.insertSheet(name);sh.getRange(1,1,1,15).setValues([HEADERS]);
  const rows=Array.from({length:30},(_,i)=>[(n===4?'S':n)+'-'+String(i+1).padStart(2,'0'),'','','','','未出賽','','','未出賽','','','未出賽','','','未出賽']);
  sh.getRange(2,1,30,15).setValues(rows);
  sh.setFrozenRows(1);sh.setFrozenColumns(3);sh.getRange('A1:O1').setBackground('#102f3d').setFontColor('#ffffff').setFontWeight('bold').setWrap(true);sh.setRowHeight(1,48);sh.setColumnWidth(2,150);sh.setColumnWidth(3,160);sh.setColumnWidths(4,12,150);
  const status=SpreadsheetApp.newDataValidation().requireValueInList(['未出賽','完成','未完成','無效'],true).setAllowInvalid(false).build();
  [6,9,12,15].forEach(c=>sh.getRange(2,c,200,1).setDataValidation(status));
  [5,8,11,14].forEach(c=>sh.getRange(2,c,200,1).setNumberFormat('@').setNote('以純文字輸入分:秒.百分秒，例如1:23.45；亦接受總秒數83.45。不可用試算表時鐘格式。項目一≤420秒，項目二≤360秒。'));
  [4,7,10,13].forEach(c=>sh.getRange(2,c,200,1).setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(0,100).setAllowInvalid(false).build()).setNote('輸入已核定的單次分數；分數高優先，同分再比較時間。'));
  sh.getRange(1,1,31,15).createFilter();sh.getRange('A2:C31').setBackground('#f1f5f6');
 }
 ss.toast('已建立第1場、第2場、第3場及校內，各30個隊位。請填隊伍名稱才會出現在排名。','建立完成',8);
}
function doGet(e){
 let data;
 try{
  const id=COMPETITION_SPREADSHEET_ID;const ss=SpreadsheetApp.openById(id);
  const sessions=[1,2,3,4].map(n=>{const label=n===4?'校內':'第'+n+'場';const sh=ss.getSheetByName(label);if(n===4&&!sh)return {id:4,name:label,teams:[]};if(!sh)throw new Error('缺少第'+n+'場工作表。');const header=sh.getRange(1,1,1,15).getDisplayValues()[0];if(JSON.stringify(header)!==JSON.stringify(HEADERS))throw new Error(label+'欄位名稱或次序已改變。');
   const values=sh.getLastRow()>1?sh.getRange(2,1,Math.min(sh.getLastRow()-1,200),15).getDisplayValues():[];
   return {id:n,name:label,teams:values.filter(r=>r[1].trim()).map(r=>({id:r[0],name:r[1],school:r[2],one:[{score:r[3],time:r[4],status:r[5]},{score:r[6],time:r[7],status:r[8]}],two:[{score:r[9],time:r[10],status:r[11]},{score:r[12],time:r[13],status:r[14]}]}))};});
  data={ok:true,generatedAt:new Date().toISOString(),sessions};
 }catch(err){data={ok:false,error:String(err.message||err)};}
 const cb=String(e&&e.parameter&&e.parameter.callback||'');const json=JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 if(cb){if(!/^race_cb_[a-z0-9_]+$/.test(cb))return ContentService.createTextOutput('{"ok":false,"error":"Invalid callback"}').setMimeType(ContentService.MimeType.JSON);return ContentService.createTextOutput(cb+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);}
 return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

