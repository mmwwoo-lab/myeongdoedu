export const shapes = {
  oval: {name:'타원형', motif:'유려한 선의 균형', visual:'세로가 가로보다 조금 길고, 턱으로 이어지는 윤곽이 부드러운 형태입니다.', story:'타원 도상은 긴 곡선이 끊김 없이 이어지는 모습으로 감상할 수 있습니다. 이 앱에서는 이를 ‘균형’이라는 창작 주제로 표현했습니다.'},
  round: {name:'둥근형', motif:'원을 닮은 부드러움', visual:'가로와 세로의 차이가 작고, 볼과 턱의 곡선이 둥글게 이어지는 형태입니다.', story:'둥근 도상은 원의 순환과 곡선의 연결을 떠올리게 합니다. 이 앱에서는 이를 ‘이어짐’이라는 창작 주제로 표현했습니다.'},
  square: {name:'각진형', motif:'또렷한 윤곽의 리듬', visual:'볼의 폭과 턱의 폭이 비교적 비슷하며, 아래턱의 각이 드러나는 형태입니다.', story:'각진 도상은 직선과 모서리가 만드는 리듬으로 감상할 수 있습니다. 이 앱에서는 이를 ‘구조’라는 창작 주제로 표현했습니다.'},
  long: {name:'긴형', motif:'길게 흐르는 여백', visual:'얼굴의 가로 폭에 비해 세로 길이가 두드러지는 형태입니다.', story:'길게 뻗은 도상은 위아래로 흐르는 선과 여백에 눈길을 모읍니다. 이 앱에서는 이를 ‘흐름’이라는 창작 주제로 표현했습니다.'},
  heart: {name:'하트형', motif:'모여드는 선의 조화', visual:'얼굴 위쪽의 폭에 비해 아래턱이 좁아지는 형태입니다.', story:'아래로 모이는 도상은 넓고 좁은 공간의 대비를 보여 줍니다. 이 앱에서는 이를 ‘모임’이라는 창작 주제로 표현했습니다.'}
};
export const features = {
  brow:{label:'눈썹 선', items:{straight:'직선에 가까운 눈썹',arch:'곡선이 보이는 눈썹'}},
  eye:{label:'눈 윤곽', items:{soft:'가로로 이어지는 눈',open:'세로 폭이 드러나는 눈'}},
  lip:{label:'입술 선', items:{fine:'얇게 보이는 입술',full:'도톰하게 보이는 입술'}}
};
const distance=(a,b,w,h)=>Math.hypot((a.x-b.x)*w,(a.y-b.y)*h);
export function classifyRatios({ratio,jawRatio}) {
  if(!Number.isFinite(ratio)||!Number.isFinite(jawRatio)||ratio<=0||jawRatio<=0) throw Error('유효하지 않은 측정값');
  if(ratio>1.48) return 'long';
  if(jawRatio<.68) return 'heart';
  if(jawRatio>.84) return 'square';
  if(ratio<1.22) return 'round';
  return 'oval';
}
export function measureFace(points,w,h){
  if(!Array.isArray(points)||points.length<468||w<=0||h<=0) throw Error('얼굴 특징점을 확인할 수 없습니다.');
  const d=(a,b)=>distance(points[a],points[b],w,h);
  const width=d(234,454), height=d(10,152), ratio=height/width, jawRatio=d(172,397)/width;
  const eyeRatio=((d(159,145)/d(33,133))+(d(386,374)/d(362,263)))/2;
  const lipRatio=d(0,17)/d(61,291);
  const browCurve=Math.abs(points[105].y-(points[70].y+points[107].y)/2)*h/width;
  return {shape:classifyRatios({ratio,jawRatio}),brow:browCurve>.018?'arch':'straight',eye:eyeRatio>.31?'open':'soft',lip:lipRatio>.27?'full':'fine',ratio,jawRatio};
}
export function faceSVG({shape='oval',brow='arch',eye='soft',lip='full'}={},annotate=true){
  const paths={oval:'M160 48 C89 48 73 95 78 158 C80 221 117 277 160 286 C203 277 240 221 242 158 C247 95 231 48 160 48Z',round:'M160 62 C87 62 65 104 69 164 C73 233 108 271 160 276 C212 271 247 233 251 164 C255 104 233 62 160 62Z',square:'M160 52 C91 52 73 89 77 151 L83 220 Q86 251 118 268 L160 279 L202 268 Q234 251 237 220 L243 151 C247 89 229 52 160 52Z',long:'M160 32 C100 32 85 78 88 150 C90 228 116 291 160 305 C204 291 230 228 232 150 C235 78 220 32 160 32Z',heart:'M160 52 C96 35 68 88 77 153 C84 203 122 254 160 286 C198 254 236 203 243 153 C252 88 224 35 160 52Z'};
  const eb=brow==='arch'?'M101 126 Q119 111 137 122 M183 122 Q201 111 219 126':'M101 122 L137 121 M183 121 L219 122';
  const eyes=eye==='open'?'M101 147 Q119 130 137 147 Q119 163 101 147 M183 147 Q201 130 219 147 Q201 163 183 147':'M101 147 Q119 137 137 147 Q119 155 101 147 M183 147 Q201 137 219 147 Q201 155 183 147';
  const lips=lip==='full'?'M130 220 Q145 205 160 213 Q175 205 190 220 Q160 244 130 220Z':'M130 220 Q160 211 190 220 Q160 230 130 220Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 340" role="img" aria-label="${shapes[shape]?.name||'타원형'} 얼굴 특징을 단순화한 그림"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#555555" stroke-opacity=".055"/></pattern></defs><rect width="320" height="340" fill="url(#grid)"/><g fill="none" stroke="#353535" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[shape]||paths.oval}" fill="#dddddd"/><path d="${eb}" stroke-width="4"/><path d="${eyes}"/><circle cx="119" cy="147" r="3.3" fill="#353535"/><circle cx="201" cy="147" r="3.3" fill="#353535"/><path d="M160 155 L151 188 Q160 196 171 188"/><path d="${lips}" fill="#999999"/><path d="M131 220 Q160 224 189 220" stroke-width="1.4"/></g>${annotate?'<g stroke="#888888" stroke-width="1" fill="none"><path d="M79 96H39V73 M237 145H280V122 M194 228H270V253"/><circle cx="79" cy="96" r="3" fill="#888888"/><circle cx="237" cy="145" r="3" fill="#888888"/><circle cx="194" cy="228" r="3" fill="#888888"/></g>':''}</svg>`;
}
export function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export const countChars=text=>Array.from(String(text)).length;
const bounded=(text,max)=>Array.from(text).slice(0,max).join('');
export function buildAppraisal(profile,selection){
  const s=shapes[selection.shape]||shapes.oval;
  const nickname=bounded(String(profile.nickname||'체험자').trim(),20)||'체험자';
  const brow={straight:'직선에 가까운 눈썹은 가로 방향의 선을 또렷하게 보여 줍니다. 그림에서는 짧은 직선으로 표현했습니다. 평행한 선이 만드는 화면의 리듬을 감상해 보세요.',arch:'곡선이 보이는 눈썹은 가운데가 완만하게 솟아오르는 윤곽입니다. 그림에서는 활 모양의 선으로 표현했습니다. 이마 아래로 이어지는 곡선의 흐름을 감상해 보세요.'};
  const eye={soft:'가로로 이어지는 눈 윤곽은 좌우 길이가 세로 폭보다 두드러져 보이는 형태입니다. 그림에서는 길고 얕은 곡선으로 표현했습니다. 표정과 촬영 각도에 따라 달라질 수 있습니다.',open:'세로 폭이 드러나는 눈 윤곽은 눈 위아래의 간격이 상대적으로 보이는 형태입니다. 그림에서는 열린 곡선으로 표현했습니다. 표정과 촬영 각도에 따라 달라질 수 있습니다.'};
  const lip={fine:'얇게 보이는 입술 선은 입술의 세로 폭이 상대적으로 작아 보이는 형태입니다. 그림에서는 가는 선으로 단순화했습니다. 말하거나 웃는 순간에는 윤곽이 달라질 수 있습니다.',full:'도톰하게 보이는 입술 선은 입술의 세로 폭이 상대적으로 드러나는 형태입니다. 그림에서는 위아래 곡선의 간격을 넓혀 표현했습니다. 표정과 빛에 따라 윤곽은 달라질 수 있습니다.'};
  const overall=bounded(`${nickname}님의 얼굴 그림은 ${s.name}의 윤곽을 중심으로 구성했습니다. ${s.visual}\n\n${s.story}\n\n눈썹·눈·입술의 모양은 아래 세부해설과 그림에서 함께 확인할 수 있습니다. 이 종합감정은 전통 관상을 소재로 한 창작 도상 감상입니다. 얼굴로 실제 성격·능력·건강·재물·운명을 판단하지 않으며, 자동 측정은 사용자가 수정할 수 있습니다.`,500);
  const details=[{key:'shape',title:'얼굴형',text:bounded(`${s.visual}\n\n그림의 주제는 ‘${s.motif}’입니다. ${s.story}`,200)},{key:'brow',title:'눈썹',text:bounded((brow[selection.brow]||brow.arch).replace('. 그림에서는','.\n\n그림에서는'),200)},{key:'eye',title:'눈 윤곽',text:bounded((eye[selection.eye]||eye.soft).replace('. 그림에서는','.\n\n그림에서는'),200)},{key:'lip',title:'입술',text:bounded((lip[selection.lip]||lip.full).replace('. 그림에서는','.\n\n그림에서는'),200)}];
  return {overall,details};
}
export function resultText(profile,selection,source){
  const s=shapes[selection.shape],appraisal=buildAppraisal(profile,selection);
  return `명도재 이명우의 관상앱 — 문화 체험 감정서\n${profile.nickname||'체험자'}님의 관상 이야기\n\n입력 방식: ${source}\n얼굴형: ${s.name}\n눈썹: ${features.brow.items[selection.brow]}\n눈: ${features.eye.items[selection.eye]}\n입술: ${features.lip.items[selection.lip]}\n\n종합감정 (${countChars(appraisal.overall)}/500자)\n${appraisal.overall}\n\n세부해설\n${appraisal.details.map(d=>`${d.title} (${countChars(d.text)}/200자)\n${d.text}`).join('\n\n')}\n\n이 결과는 전통 관상을 소재로 한 문화·오락 콘텐츠입니다. 얼굴로 개인의 성격·능력·건강·재물·운명을 판단할 수 없습니다. 분류 기준은 앱의 실험적 휴리스틱이며 과학적 관상 판정이 아닙니다.\n사진, 나이, 성별은 이 파일에 포함하지 않았습니다. 별명은 포함되므로 공유 전 확인하세요.`;
}
