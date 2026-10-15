export const LIMITS={one:420,two:360};
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
 const status=String(a?.status||'未出賽').trim(),score=parseScore(a?.score),rawTime=a?.time??'';
 const parsed=parseTime(rawTime),eligible=status==='完成'||status==='未完成';
 // 未完成統一用限時作比較，不會因提早放棄而獲時間優勢。
 const time=status==='未完成'?limit*100:parsed;
 let reason=eligible?'':status;
 if(eligible&&score===null)reason='分數未填或格式錯誤';
 else if(status==='完成'&&parsed===null)reason='完成時間未填或格式錯誤';
 else if(status==='完成'&&parsed>limit*100)reason='時間超出限時';
 return {score,rawScore:a?.score??'',rawTime,status,time,valid:eligible&&score!==null&&time!==null&&time<=limit*100,reason};
}
export function evaluate(team,event){
 const tries=(team[event]||[]).slice(0,2).map(a=>attempt(a,LIMITS[event]));while(tries.length<2)tries.push(attempt(null,LIMITS[event]));
 const good=tries.map((a,i)=>({...a,index:i+1})).filter(a=>a.valid).sort((a,b)=>b.score-a.score||a.time-b.time||a.index-b.index);
 return {tries,best:good[0]??null};
}
export function rankTeams(teams,event){
 const rows=teams.filter(t=>String(t.name||'').trim()).map(t=>{const one=evaluate(t,'one'),two=evaluate(t,'two'),current=event==='one'?one:two;const ready=event==='total'?!!(one.best&&two.best):!!current.best;
 return {...t,oneResult:one,twoResult:two,current,score:ready?(event==='total'?Math.round((one.best.score+two.best.score)*100)/100:current.best.score):null,time:ready?(event==='total'?one.best.time+two.best.time:current.best.time):null,rank:null};});
 rows.sort((a,b)=>(a.score===null)-(b.score===null)||(b.score??0)-(a.score??0)||(a.time??0)-(b.time??0)||String(a.id).localeCompare(String(b.id),'zh-Hant',{numeric:true}));
 let last='',rank=0;rows.forEach((r,i)=>{if(r.score===null)return;const key=`${r.score}|${r.time}`;if(last!==key)rank=i+1;r.rank=rank;last=key;});return rows;
}
export function validatePayload(p){
 if(!p||p.ok!==true||!Array.isArray(p.sessions)||p.sessions.length!==3)throw Error(p?.error||'資料格式不符，請使用本頁提供的 Google Apps Script。');
 const seen=new Set();for(const s of p.sessions){if(![1,2,3].includes(s.id)||seen.has(s.id)||!Array.isArray(s.teams))throw Error('場次資料不完整。');seen.add(s.id);if(s.teams.length>90)throw Error('場次資料超出90隊。');const ids=new Set();for(const t of s.teams){const id=String(t.id||'').trim();if(typeof t.name!=='string'||!id||ids.has(id))throw Error('隊號空白或重複，請檢查 Google Sheet。');ids.add(id);for(const e of ['one','two'])if(!Array.isArray(t[e])||t[e].length!==2)throw Error('每隊必須有兩項各兩次機會。');}}return p;
}
