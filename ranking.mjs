export const LIMITS={one:180,two:240};
export function parseTime(value){
 if(value===null||value===undefined||String(value).trim()==='')return null;
 const s=String(value).trim().replace(/[：]/g,':');let seconds;
 if(/^\d+(?:\.\d{1,2})?$/.test(s))seconds=Number(s);
 else {let m=s.match(/^(\d+):(\d{1,2})(?:\.(\d{1,2}))?$/);if(m){if(+m[2]>=60)return null;seconds=+m[1]*60 + +m[2] + +(m[3]||0)/10**(m[3]?.length||0);}else{m=s.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);if(!m||+m[2]>=60||+m[3]>=100)return null;seconds=+m[1]*60 + +m[2] + +m[3]/100;}}
 return Number.isFinite(seconds)&&seconds>0?Math.round(seconds*100):null;
}
export function fmt(cs){if(cs===null||cs===undefined)return '—';return `${Math.floor(cs/6000)}:${String(Math.floor(cs/100)%60).padStart(2,'0')}.${String(cs%100).padStart(2,'0')}`;}
export function parseScore(value){if(value===null||value===undefined||String(value).trim()==='')return null;const s=String(value).trim();if(!/^\d+(?:\.\d{1,2})?$/.test(s))return null;const n=Number(s);return n>=0&&n<=100?n:null;}
export function attempt(a,limit){
 const status=String(a?.status||'未出賽').trim(),rawTime=a?.time??'',parsed=parseTime(rawTime);
 const completed=status==='完成',eligible=completed||status==='未完成',isTwo=limit===LIMITS.two;
 const integer=v=>v!==null&&v!==undefined&&String(v).trim()!==''&&/^\d+$/.test(String(v).trim())?Number(v):null;
 const rescues=integer(a?.rescues),treasures=isTwo?integer(a?.treasures):0;
 const base=(completed?(isTwo?40:60):0)+(isTwo&&treasures===1?20:0);
 const score=rescues===null||treasures===null?null:Math.max(0,base-5*rescues);
 let reason=eligible?'':status;
 if(eligible&&rescues===null)reason='請補填救援次數（無救援填0）';
 else if(eligible&&isTwo&&![0,1].includes(treasures))reason='請填寶藏數0或1';
 else if(completed&&parsed===null)reason='完成時間未填或格式錯誤';
 else if(completed&&parsed>limit*100)reason='時間超出新版限時，請覆核';
 const time=completed?parsed:limit*100;
 return {score,base,rescues,treasures,deduction:rescues===null?null:rescues*5,completed,rawTime,status,time,valid:eligible&&!reason,reason};
}
export function compareAttempt(a,b,event){
 return b.score-a.score||Number(b.completed)-Number(a.completed)||(event==='two'?(b.treasures-a.treasures||a.rescues-b.rescues):0)||(a.completed&&b.completed?a.time-b.time:0);
}
export function evaluate(team,event){
 const tries=(team[event]||[]).slice(0,2).map(a=>attempt(a,LIMITS[event]));while(tries.length<2)tries.push(attempt(null,LIMITS[event]));
 const good=tries.map((a,i)=>({...a,index:i+1})).filter(a=>a.valid).sort((a,b)=>compareAttempt(a,b,event)||a.index-b.index);
 return {tries,best:good[0]??null};
}
export function rankTeams(teams,event){
 const rows=teams.filter(t=>String(t.name||'').trim()).map(t=>{const one=evaluate(t,'one'),two=evaluate(t,'two'),current=event==='one'?one:two,ready=event==='total'?!!(one.best&&two.best):!!current.best;
 return {...t,oneResult:one,twoResult:two,current,score:ready?(event==='total'?one.best.score+two.best.score:current.best.score):null,time:ready?(event==='total'?one.best.time+two.best.time:current.best.time):null,rescues:ready?(event==='total'?one.best.rescues+two.best.rescues:current.best.rescues):null,rank:null};});
 const compare=(a,b)=>{if(a.score===null||b.score===null)return (a.score===null)-(b.score===null);return event==='total'?b.score-a.score||b.twoResult.best.score-a.twoResult.best.score||a.time-b.time||a.rescues-b.rescues:compareAttempt(a.current.best,b.current.best,event);};
 rows.sort((a,b)=>compare(a,b)||String(a.id).localeCompare(String(b.id),'zh-Hant',{numeric:true}));
 let prev=null;rows.forEach((r,i)=>{if(r.score===null)return;r.rank=prev&&compare(prev,r)===0?prev.rank:i+1;prev=r;});return rows;
}
export function validatePayload(p){
 if(p?.ok===true&&p.schemaVersion!==2)throw Error('資料來源仍為舊版，請更新 Code.gs 並更新現有 Apps Script 部署版本，才能讀取救援及寶藏。');
 if(!p||p.ok!==true||!Array.isArray(p.sessions)||![3,4].includes(p.sessions.length))throw Error(p?.error||'資料格式不符，請使用本頁提供的 Google Apps Script。');
 const seen=new Set();for(const s of p.sessions){if(![1,2,3,4].includes(s.id)||seen.has(s.id)||!Array.isArray(s.teams))throw Error('場次資料不完整。');seen.add(s.id);if(s.teams.length>90)throw Error('場次資料超出90隊。');const ids=new Set();for(const t of s.teams){const id=String(t.id||'').trim();if(typeof t.name!=='string'||!id||ids.has(id))throw Error('隊號空白或重複，請檢查 Google Sheet。');ids.add(id);for(const e of ['one','two'])if(!Array.isArray(t[e])||t[e].length!==2)throw Error('每隊必須有兩項各兩次機會。');}}if(![1,2,3].every(id=>seen.has(id)))throw Error('缺少原有場次。');return p;
}

