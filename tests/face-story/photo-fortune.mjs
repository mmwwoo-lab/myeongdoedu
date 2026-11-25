import assert from 'node:assert/strict';
import {buildFortune,fortuneText,fortuneThemes} from '../../public/face-story/fortune.mjs';
import {drawAnnotatedPhoto,faceRegions} from '../../public/face-story/photo-annotations.mjs';
import {createReportPNG} from '../../public/face-story/report-canvas.mjs';
let cases=0;
for(const theme of Object.keys(fortuneThemes))for(const age of [null,1,12,13,19,20,39,40,64,65,120]){
  const profile={nickname:'테스트',age,gender:'여성'},f=buildFortune(profile,theme);
  assert.deepEqual(f,buildFortune({...profile,gender:'남성'},theme));assert.equal(f.sections.length,4);assert.equal(f.periods.length,4);assert.ok(f.overall.length<=500);assert.ok(f.sections.every(s=>s.text.length<=200));assert.ok(f.tojeong.includes('창작'));assert.ok(f.traditionNote.includes('계산하지 않습니다'));
  assert.ok(!fortuneText(f).includes(f.lifeAdvice));assert.ok(!fortuneText(f).includes('여성'));cases++;
}
assert.notEqual(buildFortune({age:13}).lifeAdvice,buildFortune({age:65}).lifeAdvice);
assert.equal(buildFortune({age:13}).overall,buildFortune({age:65}).overall);
const calls=[],ctx={drawImage(...args){calls.push(['image',...args]);},beginPath(){},moveTo(){},lineTo(){},stroke(){calls.push(['stroke']);},fillRect(){},fillText(text,x,y){calls.push(['label',text,x,y]);},measureText:t=>({width:t.length*16})};
const canvas={width:0,height:0,getContext:()=>ctx},image={naturalWidth:2400,naturalHeight:3200};
assert.equal(drawAnnotatedPhoto(canvas,image,null),false);assert.equal(canvas.height,1200);assert.equal(calls.filter(c=>c[0]==='stroke').length,0);
const points=Array.from({length:478},(_,i)=>({x:.35+(i%10)*.02,y:.1+(i%23)*.025}));
assert.equal(drawAnnotatedPhoto(canvas,image,points),true);assert.equal(ctx.strokeStyle,'#f02c36');assert.deepEqual(calls.filter(c=>c[0]==='label').map(c=>c[1]),faceRegions.map(r=>r.label));
assert.throws(()=>drawAnnotatedPhoto(canvas,{width:0,height:0},points));
const previous=globalThis.document;let reportCanvas,maxHeight=0,hasPhoto=false,reportTexts=[];
globalThis.document={createElement(){reportCanvas={width:0,_height:0,set height(v){this._height=v;maxHeight=Math.max(maxHeight,v);},get height(){return this._height;},getContext(){return{measureText:t=>({width:Array.from(t).length*25}),fillRect(){},fillText(t,x,y){assert.ok(y<reportCanvas.height);reportTexts.push(t);},drawImage(source){hasPhoto=source===canvas;}};},toBlob(cb){cb(new Blob(['PNG'],{type:'image/png'}));}};return reportCanvas;}};
const blob=await createReportPNG({nickname:'테스트',age:38,gender:'여성'},{shape:'oval',brow:'arch',eye:'soft',lip:'full'},'테스트',buildFortune({age:38},'learning'),canvas);
assert.equal(blob.type,'image/png');assert.ok(hasPhoto);assert.ok(maxHeight<12000);assert.equal(reportCanvas.width,0);assert.equal(reportCanvas.height,0);assert.ok(reportTexts.some(t=>t.includes('토정비결풍')));assert.ok(!reportTexts.some(t=>t.includes('38세')||t.includes('여성')));
globalThis.document=previous;
console.log(`PASS: ${cases}개 운세·연령 조합 / 성별 불변·생활제안 분리 / 사진 붉은 선 4부위 / 검출 실패 무표시 / 사진 포함 PNG·문구 경계·개인정보 제외·자원 해제`);
