import {buildAppraisal,buildFortune} from './face-core.mjs';
export function wrapLines(ctx,text,maxWidth){
  const lines=[];let line='';
  for(const char of Array.from(String(text))){if(char==='\n'){lines.push(line);line='';continue;}if(line&&ctx.measureText(line+char).width>maxWidth){lines.push(line.trimEnd());line=char.trimStart();}else line+=char;}
  if(line)lines.push(line);return lines;
}
export async function createReportPNG(profile,selection,source,fortune=buildFortune(profile),photoCanvas=null){
  const canvas=document.createElement('canvas');canvas.width=1080;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('이 브라우저에서 감정서를 만들 수 없습니다.');
  const font=(size,weight='400')=>`${weight} ${size}px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
  const appraisal=buildAppraisal(profile,selection);
  const hasPhoto=photoCanvas?.width>0&&photoCanvas?.height>0;
  const scale=hasPhoto?Math.min(936/photoCanvas.width,820/photoCanvas.height):0;
  const photoW=hasPhoto?Math.round(photoCanvas.width*scale):0,photoH=hasPhoto?Math.round(photoCanvas.height*scale):0;
  const blocks=[{title:'종합 관상 해설',text:appraisal.overall},...appraisal.details.map(d=>({title:'사진 관찰 · '+d.title,text:d.text})),{title:'전체 운세 · '+fortune.title+' (창작)',text:fortune.overall},...fortune.sections,{title:'토정비결풍 해설 (창작)',text:fortune.tojeong},...fortune.periods,{title:'해설의 범위',text:fortune.notice+'\n'+fortune.traditionNote}];
  ctx.font=font(25);const measured=blocks.map(b=>({...b,lines:wrapLines(ctx,b.text,888)}));
  const contentTop=hasPhoto?285+photoH:260;
  canvas.height=contentTop+measured.reduce((n,b)=>n+94+b.lines.length*39,0)+150;
  const text=(s,x,y,size=25,color='#264c51',weight='400')=>{ctx.font=font(size,weight);ctx.fillStyle=color;ctx.fillText(s,x,y);};
  try{
    ctx.fillStyle='#fff5df';ctx.fillRect(0,0,1080,canvas.height);
    text('명도재 이명우의 관상앱',72,79,40,'#174d53','700');text('입력 사진 관찰 · 재미로 보는 운세 감정서',72,123,24,'#526d68');
    const nickname=Array.from(String(profile.nickname||'체험자')).slice(0,20).join('');text(nickname+'님의 관상과 운세',72,177,30,'#174d53','600');
    if(hasPhoto){ctx.drawImage(photoCanvas,Math.round((1080-photoW)/2),218,photoW,photoH);text(photoCanvas.dataset?.marked==='true'?'붉은 선은 자동 검출된 얼굴 관찰 위치입니다.':'자동 표시가 없는 사진입니다. 사용자가 형태를 확인했습니다.',72,250+photoH,22,'#6b5c51');}
    let y=contentTop;
    for(const block of measured){
      const height=78+block.lines.length*39;ctx.fillStyle='#edf0e5';ctx.fillRect(60,y,960,height);
      text(block.title,84,y+39,28,'#195960','600');block.lines.forEach((line,i)=>text(line,84,y+84+i*39));y+=height+16;
    }
    text('PNG에 사진·닉네임 포함 / 나이·성별·연령별 제안 제외',72,y+34,23,'#6b5c51');
    text('문화·오락용 창작 · 공유 전 사진과 닉네임을 확인하세요.',72,y+73,23,'#6b5c51');
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG 감정서 생성에 실패했습니다.');return blob;
  }finally{canvas.width=0;canvas.height=0;}
}
