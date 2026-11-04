/* 第一屆太空機械人競速賽 Google Sheet 連接程式
 * 在一份專用試算表的「擴充功能 > Apps Script」貼上此檔。
 * 本表已建立完成，不須執行 setupCompetition；直接部署為網頁應用程式。
 * doGet 只讀取指定的成績欄位，絕不寫入；輸出可被知道網址的人讀取。
 */
const COMPETITION_SPREADSHEET_ID='1CsbL8KaRxxKcpNYNvPu61NqI5TOOxrXyl9O6uSXLTLI';
const HEADERS=['隊號','隊伍名稱','學校','項目一第1次分數','項目一第1次時間','項目一第1次狀態','項目一第2次分數','項目一第2次時間','項目一第2次狀態','項目二第1次分數','項目二第1次時間','項目二第1次狀態','項目二第2次分數','項目二第2次時間','項目二第2次狀態'];
function doGet(e){
 let data;
 try{
  const id=COMPETITION_SPREADSHEET_ID;const ss=SpreadsheetApp.openById(id);
  const sessions=[1,2,3,4].map(n=>{const label=n===4?'校內':'第'+n+'場';const sh=ss.getSheetByName(label);if(n===4&&!sh)return {id:4,name:label,teams:[]};if(!sh)throw new Error('缺少第'+n+'場工作表。');const header=sh.getRange(1,1,1,25).getDisplayValues()[0];const at=name=>{const i=header.indexOf(name);if(i<0)throw new Error(label+'缺少欄位：'+name);return i;};const get=(r,name)=>r[at(name)];const entry=(r,event,no)=>{const key='項目'+event+'第'+no+'次';return {score:get(r,key+'自動分數'),time:get(r,key+'時間'),status:get(r,key+'狀態'),rescues:get(r,key+'救援'),...(event==='二'?{treasures:get(r,key+'寶藏')}: {})};};
   const values=sh.getLastRow()>1?sh.getRange(2,1,Math.min(sh.getLastRow()-1,200),25).getDisplayValues():[];
   return {id:n,name:label,teams:values.filter(r=>String(get(r,'隊伍名稱')||'').trim()).map(r=>({id:get(r,'隊號'),name:get(r,'隊伍名稱'),school:get(r,'學校名稱'),one:[entry(r,'一',1),entry(r,'一',2)],two:[entry(r,'二',1),entry(r,'二',2)]}))};});
  data={ok:true,schemaVersion:2,generatedAt:new Date().toISOString(),sessions};
 }catch(err){data={ok:false,error:String(err.message||err)};}
 const cb=String(e&&e.parameter&&e.parameter.callback||'');const json=JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 if(cb){if(!/^race_cb_[a-z0-9_]+$/.test(cb))return ContentService.createTextOutput('{"ok":false,"error":"Invalid callback"}').setMimeType(ContentService.MimeType.JSON);return ContentService.createTextOutput(cb+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);}
 return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

