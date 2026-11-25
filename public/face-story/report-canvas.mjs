import {faceSVG,shapes,buildAppraisal} from './face-core.mjs';
export function wrapLines(ctx,text,maxWidth){
  const lines=[];let line='';
  for(const char of Array.from(String(text))){if(char==='\n'){lines.push(line);line='';continue;}if(line&&ctx.measureText(line+char).width>maxWidth){lines.push(line.trimEnd());line=char.trimStart();}else line+=char;}
  if(line)lines.push(line);return lines;
}
export async function createReportPNG(profile,selection,source){
  const canvas=document.createElement('canvas');canvas.width=1080;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('이 브라우저에서 감정서를 만들 수 없습니다.');
  const appraisal=buildAppraisal(profile,selection);const font=(size,weight='400')=>`${weight} ${size}px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
  ctx.font=font(25);const overallLines=wrapLines(ctx,appraisal.overall,912);
  const cards=appraisal.details.map(d=>({...d,lines:wrapLines(ctx,d.text,404)}));
  const rowHeights=[0,1].map(i=>Math.max(...cards.slice(i*2,i*2+2).map(d=>112+d.lines.length*38)));
  const detailsY=570+overallLines.length*42;canvas.height=detailsY+rowHeights[0]+rowHeights[1]+240;
  let image,url;
  const text=(s,x,y,size=25,color='#333333',weight='400')=>{ctx.font=font(size,weight);ctx.fillStyle=color;ctx.fillText(s,x,y);};
  try{
    ctx.fillStyle='#f0f0f0';ctx.fillRect(0,0,1080,canvas.height);
    text('명도재 이명우의 관상앱',72,85,40,'#222222','700');text('재미로 만나는 얼굴의 선 · 문화 체험 감정서',72,130,23,'#666666');
    ctx.fillStyle='#bbbbbb';ctx.fillRect(72,164,936,2);
    url=URL.createObjectURL(new Blob([faceSVG(selection)],{type:'image/svg+xml'}));image=new Image();image.src=url;await image.decode();ctx.drawImage(image,72,193,254,270);
    const name=Array.from(String(profile.nickname||'체험자')).slice(0,20).join('');ctx.font=font(32,'600');wrapLines(ctx,name+'님의 관상 이야기',620).slice(0,2).forEach((l,i)=>text(l,368,247+i*45,32,'#222222','600'));
    text(shapes[selection.shape].name+' · '+shapes[selection.shape].motif,368,355,25,'#555555');ctx.font=font(21);wrapLines(ctx,source,610).forEach((l,i)=>text(l,368,399+i*32,21,'#666666'));
    text('종합감정',72,519,30,'#222222','600');overallLines.forEach((line,i)=>text(line,72,568+i*42));
    let y=detailsY+25;text('세부해설',72,y,30,'#222222','600');y+=28;
    for(let row=0;row<2;row++){
      for(let col=0;col<2;col++){const d=cards[row*2+col],x=72+col*480;ctx.fillStyle='#e0e0e0';ctx.fillRect(x,y,456,rowHeights[row]);text(d.title,x+24,y+43,27,'#222222','600');d.lines.forEach((line,i)=>text(line,x+24,y+88+i*38,25));}
      y+=rowHeights[row]+24;
    }
    text('얼굴로 성격·능력·건강·재물·운명을 판단하지 않습니다.',72,y+27,22,'#666666');text('원본 사진·나이·성별 제외 / 닉네임 포함 · 공유 전 확인하세요.',72,y+63,22,'#666666');
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG 감정서 생성에 실패했습니다.');return blob;
  }finally{if(url)URL.revokeObjectURL(url);if(image)image.src='';canvas.width=0;canvas.height=0;}
}
