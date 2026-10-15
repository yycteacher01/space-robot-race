import assert from 'node:assert/strict';
import {parseTime,fmt,parseScore,rankTeams,validatePayload} from './ranking.mjs';
assert.equal(parseTime('1:23.45'),8345);assert.equal(parseTime('1:23:45'),8345);assert.equal(parseTime('83.45'),8345);assert.equal(parseTime('1:60.00'),null);assert.equal(parseTime('0'),null);assert.equal(fmt(30000),'5:00.00');assert.equal(parseScore(''),null);assert.equal(parseScore(0),0);assert.equal(parseScore(101),null);
const a=(score,time,status='完成')=>({score,time,status});const t=(id,one,two=[a(0,'','未出賽'),a(0,'','未出賽')])=>({id,name:'隊伍'+id,one,two});
const teams=[t('1',[a(100,'90'),a(95,'30')],[a(80,'90'),a(60,'20')]),t('2',[a(90,'20'),a(90,'15')],[a(100,'50'),a(90,'20')]),t('3',[a(100,'80'),a(100,'70')],[a(80,'80'),a(60,'10')]),t('4',[a(100,'70'),a(0,'1')],[a(80,'80'),a(0,'1')]),t('5',[a(40,'1','未完成'),a(20,'2','未完成')],[a(60,'','未完成'),a(0,'','未出賽')]),t('6',[a('','1'),a(0,'','未出賽')]),t('7',[a(100,'420.01'),a(100,'0')]),t('8',[a(0,'','未完成'),a(100,'1','無效')]),t('9',[a(100,'1','未出賽'),a(0,'','無效')])];
let r=rankTeams(teams,'one');assert.deepEqual(r.slice(0,4).map(x=>[x.id,x.rank,x.score,x.time]),[['3',1,100,7000],['4',1,100,7000],['1',3,100,9000],['2',4,90,1500]]);assert.equal(r.find(x=>x.id==='5').time,42000);assert.equal(r.find(x=>x.id==='8').score,0);for(const id of ['6','7','9'])assert.equal(r.find(x=>x.id===id).rank,null);assert.equal(r.find(x=>x.id==='1').current.best.index,1);
r=rankTeams(teams,'total');assert.equal(r[0].id,'2');assert.equal(r[0].score,190);assert.equal(r[0].time,6500);assert.equal(r.find(x=>x.id==='1').time,18000);assert.equal(r.find(x=>x.id==='1').score,180);assert.equal(r.find(x=>x.id==='5').time,78000);assert.equal(r.find(x=>x.id==='8').rank,null);assert.deepEqual(r.slice(1,3).map(x=>x.rank),[2,2]);
const payload={ok:true,sessions:[1,2,3].map(id=>({id,teams:teams.slice(0,2)}))};assert.equal(validatePayload(payload),payload);assert.throws(()=>validatePayload({...payload,ok:false}));assert.throws(()=>validatePayload({ok:true,sessions:[{id:1,teams:[teams[0],teams[0]]},...payload.sessions.slice(1)]}));
console.log('PASS: score first, time tie-break, matching attempt selection, tied ranks, totals, unfinished limit times, zero vs missing scores, invalid/absent exclusion, time limits and schemas.');

assert.equal(rankTeams([t('boundary',[a(100,'420'),a(100,'420.01')])],'one')[0].time,42000);
assert.equal(rankTeams([t('extended',[a(100,'350'),a(100,'400')])],'one')[0].time,35000);
assert.equal(rankTeams([t('eventtwo',[a(0,'','未出賽'),a(0,'','未出賽')],[a(100,'360.01'),a(100,'360')])],'two')[0].time,36000);
