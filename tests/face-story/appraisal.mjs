import assert from 'node:assert/strict';
import {shapes,features,buildAppraisal,countChars,resultText} from '../../public/face-story/face-core.mjs';
import {wrapLines} from '../../public/face-story/report-canvas.mjs';
let combinations=0;
for(const shape of Object.keys(shapes))for(const brow of Object.keys(features.brow.items))for(const eye of Object.keys(features.eye.items))for(const lip of Object.keys(features.lip.items)){
  const selection={shape,brow,eye,lip},profile={nickname:'가나다라마바사아자차카타파하가나다라마바',age:38,gender:'여성'};
  const appraisal=buildAppraisal(profile,selection);
  assert.ok(countChars(appraisal.overall)<=500);assert.ok(appraisal.overall.includes('\n\n'));
  assert.equal(appraisal.details.length,4);
  for(const detail of appraisal.details){assert.ok(countChars(detail.text)<=200);assert.ok(detail.text.includes('\n\n'));}
  assert.deepEqual(appraisal,buildAppraisal({...profile,age:120,gender:'남성'},selection),'나이·성별이 감정문을 바꾸면 안 됨');
  const text=resultText({...profile,nickname:'달빛'},selection,'테스트');assert.ok(text.includes('명도재 이명우의 관상앱'));assert.ok(!text.includes('38'));assert.ok(!text.includes('여성'));assert.ok(text.includes('달빛'));
  combinations++;
}
const measure={measureText:s=>({width:Array.from(s).length*25})};
assert.deepEqual(wrapLines(measure,'가나다\n\n라마바',75),['가나다','','라마바']);
assert.ok(wrapLines(measure,'가나다라마바사아자차',100).every(s=>Array.from(s).length<=4));
const originalCreate=globalThis.document,originalImage=globalThis.Image;let released=false,canvas,draws=[];
globalThis.document={createElement(){canvas={width:0,height:0,getContext(){return{font:'',fillStyle:'',measureText:measure.measureText,fillRect(){},fillText(s,x,y){draws.push({s,x,y,width:measure.measureText(s).width});},drawImage(){}};},toBlob(cb){cb(new Blob(['test'],{type:'image/png'}));}};return canvas;}};
globalThis.Image=class{async decode(){}set src(v){if(v==='')released=true;}};
const {createReportPNG}=await import('../../public/face-story/report-canvas.mjs');
const png=await createReportPNG({nickname:'달빛산책',age:38,gender:'여성'},{shape:'oval',brow:'arch',eye:'soft',lip:'full'},'자동 측정 후 확인');
assert.equal(png.type,'image/png');assert.ok(draws.length>10);assert.ok(draws.every(d=>!d.s.includes('38세')&&!d.s.includes('여성')));assert.equal(canvas.width,0);assert.equal(canvas.height,0);assert.equal(released,true);
globalThis.document=originalCreate;globalThis.Image=originalImage;
console.log(`PASS: ${combinations}가지 조합의 500/200자 제한·단락·프로필 비추론·TXT 개인정보 제외 / 캔버스 줄바꿈·PNG 생성 경로·자원 해제`);
