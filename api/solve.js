const MAX_BODY=7_200_000;
const origin='https://api.openai.com/v1/responses';
function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(body))}
function clean(text,max=4000){return typeof text==='string'?text.trim().slice(0,max):''}
module.exports=async(req,res)=>{
 if(req.method!=='POST')return send(res,405,{error:'POST 방식만 지원합니다.'});
 const key=process.env.OPENAI_API_KEY;if(!key)return send(res,503,{code:'CONFIG_REQUIRED',error:'AI 분석 연결이 아직 설정되지 않았습니다. 관리자에게 서버 API 키 설정을 요청하세요.'});
 let raw;
 try{raw=typeof req.body==='object'?req.body:JSON.parse(req.body||'{}');}catch{return send(res,400,{error:'잘못된 요청입니다.'})}
 const question=clean(raw.question,6000),follow=clean(raw.followup,1000),history=Array.isArray(raw.history)?raw.history.slice(-6):[];
 const img=raw.image,doc=raw.document;
 if(!question&&!img&&!doc)return send(res,400,{error:'문제 또는 사진/문서를 입력해 주세요.'});
 const content=[{type:'input_text',text:[
 '문제: '+(question||'(첨부 자료의 문제를 읽어주세요)'),
 follow?'추가 질문: '+follow:'',
 history.length?'이전 문답 요약:\n'+history.map(v=>clean(v,600)).join('\n'):''
 ].filter(Boolean).join('\n')}];
 if(img){if(typeof img!=='string'||img.length>4_000_000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(img))return send(res,400,{error:'지원하지 않는 사진 형식 또는 크기입니다.'});content.push({type:'input_image',image_url:img})}
 if(doc){if(typeof doc!=='object'||typeof doc.data!=='string'||doc.data.length>5_500_000||!/^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/.test(doc.data))return send(res,400,{error:'PDF 형식만 분석할 수 있습니다. 다른 파일은 텍스트로 입력해 주세요.'});content.push({type:'input_file',filename:'question.pdf',file_data:doc.data})}
 const instructions='너는 명도재 이명우의 문제풀이 학습도우미다. 한국어로 답한다. 초등~중등 교과 문제를 원문 그대로 분석하고, 다른 문제를 만들어내지 마라. 이미지가 흐리거나 문제 식별이 불가능하면 추측하지 말고 재촬영을 요청한다. 답을 먼저 제공하고 다음에 단계별 풀이 및 독립 검산을 제시하라. 객관식은 보기와 정답 번호를 정확히 대조하라. 틀릴 수 있는 문제는 불확실성을 밝히라. 정답이나 설명에 개인정보를 반복하지 말아라. 유해하거나 부정행위 상황에서는 학습을 돕는 방식으로 대응하라. 결과는 오직 JSON 객체로 반환하고 필드는 answer(string), steps(string 배열, 1~6개), check(string), concept(string), followups(string 배열, 최대 2개), confidence(high|medium|low)이다.';
 try{
 const response=await fetch(origin,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_SOLVER_MODEL||'gpt-4.1-mini',instructions,input:[{role:'user',content}],max_output_tokens:1900,text:{format:{type:'json_object'}}}),signal:AbortSignal.timeout(45000)});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)return send(res,response.status===429?429:502,{error:response.status===429?'요청이 많습니다. 잠시 후 다시 시도해 주세요.':'AI 분석 서버에서 응답하지 못했습니다.',upstream:response.status});
 const message=(payload.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n')||payload.output_text||'';
 let parsed;try{parsed=JSON.parse(message)}catch{return send(res,502,{error:'AI 답변 형식을 확인할 수 없습니다. 다시 시도해 주세요.'})}
 if(!parsed||typeof parsed.answer!=='string'||!Array.isArray(parsed.steps))return send(res,502,{error:'정답과 풀이가 생성되지 않았습니다.'});
 return send(res,200,{answer:clean(parsed.answer,2600),steps:parsed.steps.slice(0,8).map(x=>clean(x,1500)),check:clean(parsed.check,1800),concept:clean(parsed.concept,1100),followups:(parsed.followups||[]).slice(0,2).map(x=>clean(x,100)),confidence:['high','medium','low'].includes(parsed.confidence)?parsed.confidence:'low',mode:'ai'});
 }catch(e){return send(res,504,{error:'연결이 지연되거나 오류가 발생했습니다. 다시 시도해 주세요.'})}
};