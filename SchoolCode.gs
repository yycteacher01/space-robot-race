/* 校內比賽專用；綁定新建校內試算表，不讀取公開賽來源。 */
const HEADERS=['隊號','隊伍名稱','學校','項目一第1次分數','項目一第1次時間','項目一第1次狀態','項目一第2次分數','項目一第2次時間','項目一第2次狀態','項目二第1次分數','項目二第1次時間','項目二第1次狀態','項目二第2次分數','項目二第2次時間','項目二第2次狀態'];

function setupSchoolCompetition(){
 const ss=SpreadsheetApp.getActiveSpreadsheet();if(!ss)throw new Error('請從校內專用Google試算表開啟程式。');
 let sh=ss.getSheetByName('校內比賽');
 if(sh&&sh.getLastRow()>0){if(JSON.stringify(sh.getRange(1,1,1,15).getDisplayValues()[0])!==JSON.stringify(HEADERS))throw new Error('已有不同欄位，請另建專用表格。');}
 else{sh=sh||ss.insertSheet('校內比賽');sh.getRange(1,1,1,15).setValues([HEADERS]);sh.getRange(2,1,30,15).setValues(Array.from({length:30},(_,i)=>['S-'+String(i+1).padStart(2,'0'),'','','','','未出賽','','','未出賽','','','未出賽','','','未出賽']));}
 PropertiesService.getScriptProperties().setProperty('SCHOOL_SPREADSHEET_ID',ss.getId());
 sh.setFrozenRows(1);sh.getRange('A1:O1').setBackground('#102f3d').setFontColor('#ffffff').setFontWeight('bold').setWrap(true);sh.setColumnWidths(1,15,145);sh.setRowHeight(1,48);
 const status=SpreadsheetApp.newDataValidation().requireValueInList(['未出賽','完成','未完成','無效'],true).setAllowInvalid(false).build();
 [6,9,12,15].forEach(c=>sh.getRange(2,c,90,1).setDataValidation(status));[5,8,11,14].forEach(c=>sh.getRange(2,c,90,1).setNumberFormat('@'));
 [4,7,10,13].forEach(c=>sh.getRange(2,c,90,1).setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(0,100).setAllowInvalid(false).build()));
 ss.toast('校內計分表已準備；已有成績不會清除。請部署網頁應用程式。');
}
function doGet(e){
 let data;
 try{
  const id=PropertiesService.getScriptProperties().getProperty('SCHOOL_SPREADSHEET_ID');if(!id)throw new Error('請先執行setupSchoolCompetition。');const ss=SpreadsheetApp.openById(id);
  const sessions=[1,2,3].map(n=>{if(n!==1)return {id:n,name:'保留',teams:[]};const sh=ss.getSheetByName('校內比賽');if(!sh)throw new Error('缺少校內比賽工作表。');const header=sh.getRange(1,1,1,15).getDisplayValues()[0];if(JSON.stringify(header)!==JSON.stringify(HEADERS))throw new Error('校內比賽欄位名稱或次序已改變。');
   const values=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,15).getDisplayValues():[];
   return {id:n,name:'校內比賽',teams:values.filter(r=>r[1].trim()).map(r=>({id:r[0],name:r[1],school:r[2],one:[{score:r[3],time:r[4],status:r[5]},{score:r[6],time:r[7],status:r[8]}],two:[{score:r[9],time:r[10],status:r[11]},{score:r[12],time:r[13],status:r[14]}]}))};});
  data={ok:true,competition:"school",generatedAt:new Date().toISOString(),sessions};
 }catch(err){data={ok:false,error:String(err.message||err)};}
 const cb=String(e&&e.parameter&&e.parameter.callback||'');const json=JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 if(cb){if(!/^race_cb_[a-z0-9_]+$/.test(cb))return ContentService.createTextOutput('{"ok":false,"error":"Invalid callback"}').setMimeType(ContentService.MimeType.JSON);return ContentService.createTextOutput(cb+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);}
 return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

