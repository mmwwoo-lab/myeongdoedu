export const faceRegions=[
  {id:'shape',label:'얼굴 윤곽',paths:[[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109,10]]},
  {id:'brow',label:'눈썹',paths:[[70,63,105,66,107],[336,296,334,293,300]]},
  {id:'eye',label:'눈',paths:[[33,160,158,133,153,144,33],[362,385,387,263,373,380,362]]},
  {id:'lip',label:'입술',paths:[[61,40,37,0,267,270,291,321,314,17,84,91,61]]}
];
export function drawAnnotatedPhoto(canvas,image,points){
  const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;if(!w||!h)throw Error('사진이 준비되지 않았습니다.');
  const scale=Math.min(1,1200/Math.max(w,h));canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('사진 표시를 지원하지 않는 환경입니다.');ctx.drawImage(image,0,0,canvas.width,canvas.height);
  if(!Array.isArray(points)||points.length<468)return false;
  ctx.lineWidth=Math.max(2,canvas.width/300);ctx.strokeStyle='#f02c36';ctx.lineJoin='round';ctx.lineCap='round';
  const fontSize=Math.max(14,canvas.width/45);ctx.font=`600 ${fontSize}px "Malgun Gothic",sans-serif`;
  const faceGroup=faceRegions[0].paths[0].map(id=>points[id]),faceTop=Math.min(...faceGroup.map(p=>p.y)),faceHeight=Math.max(...faceGroup.map(p=>p.y))-faceTop;
  for(const [index,region] of faceRegions.entries()){
    for(const path of region.paths){ctx.beginPath();path.forEach((id,i)=>{const p=points[id],x=p.x*canvas.width,y=p.y*canvas.height;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
    const group=region.paths.flat().map(id=>points[id]);
    const anchor=group.reduce((a,p)=>p.x>a.x?p:a,group[0]);
    const padding=fontSize*.35,labelWidth=ctx.measureText(region.label).width+padding*2;
    const x=Math.max(3,canvas.width-labelWidth-10);
    const y=Math.max(fontSize+padding+3,Math.min(canvas.height-padding,(faceTop+faceHeight*(.06+index*.28))*canvas.height));
    ctx.beginPath();ctx.moveTo(anchor.x*canvas.width,anchor.y*canvas.height);ctx.lineTo(x-9,y-fontSize*.35);ctx.lineTo(x,y-fontSize*.35);ctx.stroke();
    ctx.fillStyle='#dc2431';ctx.fillRect(x,y-fontSize-padding,labelWidth,fontSize+padding*2);ctx.fillStyle='#fff';ctx.fillText(region.label,x+padding,y);
  }
  return true;
}
