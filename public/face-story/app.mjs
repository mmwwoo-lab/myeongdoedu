import {shapes,features,faceSVG,measureFace,escapeHTML,resultText,buildAppraisal,countChars} from './face-core.mjs';
const $=s=>document.querySelector(s);
const defaults={shape:'oval',brow:'arch',eye:'soft',lip:'full'};
let photoURL=null,stream=null,model=null,modelPromise=null,modelGeneration=0,epoch=0,busy=false,cameraEpoch=0,exportId=0,source='',result=null,toastTimer;
const setStatus=(text,error=false)=>{ $('#status').textContent=text;$('#status').classList.toggle('error',error); };
const toast=text=>{clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4000);};
function page(id){document.querySelectorAll('.page').forEach(el=>el.hidden=el.id!==id);document.querySelectorAll('.nav-btn').forEach(el=>{el.classList.toggle('active',el.dataset.page===id);if(el.dataset.page===id)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});if(id!=='experience')stopCamera();window.scrollTo({top:0,behavior:'instant'});if(id!=='experience')$('#'+id).focus({preventScroll:true});}
document.querySelectorAll('[data-page]').forEach(el=>el.addEventListener('click',()=>page(el.dataset.page)));
document.querySelectorAll('[data-open]').forEach(el=>el.addEventListener('click',()=>page(el.dataset.open)));
document.querySelectorAll('.brand,.footer-brand').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();page('experience');}));
$('#hero-face').innerHTML=faceSVG();
$('#mini-faces').innerHTML=['round','oval','square'].map(shape=>`<div>${faceSVG({shape},false)}<span>${shapes[shape].name}</span></div>`).join('');
$('#shape-library').innerHTML=Object.entries(shapes).map(([id,s])=>`<article class="shape-card"><div>${faceSVG({shape:id},false)}</div><div class="shape-text"><h2>${s.name}</h2><p>${s.visual}</p><span class="motif">창작 도상 · ${s.motif}</span><p>${s.story}</p></div></article>`).join('');
$('#feature-library').innerHTML=Object.values(features).map(f=>`<div><h4>${f.label}</h4><p>${Object.values(f.items).join(' / ')}</p><p>선의 모양을 묘사하며 개인의 특성으로 해석하지 않습니다.</p></div>`).join('');
function setBusy(value){busy=value;$('#analyze').disabled=value;$('#analyze').innerHTML=value?'기기 안에서 살펴보고 있어요…':'관상 보기 <span aria-hidden="true">✧</span>';}
function clearResult(){exportId++;result=null;$('#download-png').disabled=false;$('#result').hidden=true;$('#adjust').hidden=true;for(const id of ['result-heading','result-profile','result-shape','result-source','result-motif','result-visual','result-story','result-face','feature-tags','overall-text','overall-count','detail-explanations'])$('#'+id).replaceChildren();}
function disposeModel(){modelGeneration++;model?.close();model=null;modelPromise=null;}
function stopCamera(){cameraEpoch++;if(stream){stream.getTracks().forEach(track=>track.stop());stream=null;}$('#video').srcObject=null;$('#video').hidden=true;$('#camera-controls').hidden=true;$('#camera').disabled=false;$('#photo').hidden=!photoURL;$('#empty-photo').hidden=!!photoURL;}
function releasePhoto(){if(photoURL){URL.revokeObjectURL(photoURL);photoURL=null;}$('#photo').removeAttribute('src');$('#photo').hidden=true;$('#empty-photo').hidden=false;$('#photo-marker').hidden=true;$('#remove-photo').hidden=true;$('#file').value='';}
function invalidate(){epoch++;setBusy(false);clearResult();source='';}
function selection(){return Object.fromEntries(Object.keys(defaults).map(k=>[k,$('#'+k).value]));}
function adjust(value,label,mode){for(const key of Object.keys(defaults))$('#'+key).value=value[key]||defaults[key];source=mode;$('#measurement-label').textContent=label;$('#adjust').hidden=false;}
async function loadPhoto(file){
  invalidate();stopCamera();releasePhoto();const request=epoch;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setStatus('JPG, PNG, WebP 형식의 사진을 선택해 주세요.',true);return;}
  if(file.size>15*1024*1024){setStatus('15MB 이하의 사진을 선택해 주세요.',true);return;}
  setBusy(true);setStatus('기기 안에서 사진을 준비하고 있어요.');
  let bitmap;
  try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});if(request!==epoch)return;
    if(bitmap.width*bitmap.height>40_000_000)throw Error('사진 해상도가 너무 큽니다. 4천만 화소 이하로 줄여 주세요.');
    const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.9));canvas.width=0;canvas.height=0;if(request!==epoch)return;if(!blob)throw Error('사진을 준비하지 못했습니다. 다른 파일을 선택해 주세요.');
    photoURL=URL.createObjectURL(blob);$('#photo').src=photoURL;await $('#photo').decode();if(request!==epoch)return;$('#photo').hidden=false;$('#empty-photo').hidden=true;$('#photo-marker').hidden=false;$('#remove-photo').hidden=false;setStatus('사진이 준비됐어요. 동의한 뒤 얼굴 형태를 살펴보세요.');
  }catch(error){if(request===epoch){releasePhoto();setStatus(error.message||'사진을 열 수 없습니다. 다른 사진을 선택해 주세요.',true);}}
  finally{bitmap?.close();if(request===epoch)setBusy(false);}
}
$('#file').addEventListener('change',e=>{const f=e.target.files?.[0];if(f)loadPhoto(f);});
$('#remove-photo').addEventListener('click',()=>{invalidate();stopCamera();releasePhoto();setStatus('사진을 지웠어요. 다른 사진을 선택할 수 있습니다.');});
$('#camera').addEventListener('click',async()=>{
  stopCamera();invalidate();const request=++cameraEpoch;$('#camera').disabled=true;
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){setStatus('카메라는 HTTPS 또는 localhost에서 지원됩니다. 사진 선택을 이용해 주세요.',true);$('#camera').disabled=false;return;}
  setStatus('카메라 권한을 확인하고 있어요.');
  try{const next=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:960}},audio:false});if(request!==cameraEpoch){next.getTracks().forEach(t=>t.stop());return;}stream=next;$('#video').srcObject=stream;await $('#video').play();if(request!==cameraEpoch)return;$('#video').hidden=false;$('#photo').hidden=true;$('#empty-photo').hidden=true;$('#camera-controls').hidden=false;setStatus('혼자 정면을 바라본 뒤 촬영해 주세요.');}
  catch(error){if(request!==cameraEpoch)return;stopCamera();setStatus(error.name==='NotAllowedError'?'카메라 권한이 허용되지 않았어요. 사진 선택을 이용할 수 있습니다.':'카메라를 시작하지 못했어요. 연결과 다른 앱의 사용 여부를 확인해 주세요.',true);}
});
$('#cancel-camera').addEventListener('click',()=>{stopCamera();setStatus('카메라를 껐어요.');});
$('#capture').addEventListener('click',async()=>{const video=$('#video');if(!stream||!video.videoWidth)return;const request=epoch,activeCamera=cameraEpoch;const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.9));canvas.width=0;canvas.height=0;if(request!==epoch||activeCamera!==cameraEpoch||!blob)return;stopCamera();await loadPhoto(new File([blob],'camera.jpg',{type:'image/jpeg'}));});
document.addEventListener('visibilitychange',()=>{if(document.hidden){const wasActive=!!stream||$('#camera').disabled;stopCamera();if(wasActive)setStatus('화면을 벗어나 카메라를 껐어요. 필요하면 다시 켜 주세요.');}});
window.addEventListener('pagehide',()=>{invalidate();stopCamera();releasePhoto();$('#profile-form').reset();disposeModel();});
async function getModel(){
  if(model)return model;
  if(!modelPromise){const generation=modelGeneration;const promise=(async()=>{const {FaceLandmarker,FilesetResolver}=await import('./vendor/vision_bundle.mjs');const vision=await FilesetResolver.forVisionTasks('./vendor/wasm');const instance=await FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'./vendor/face_landmarker.task',delegate:'CPU'},runningMode:'IMAGE',numFaces:2,minFaceDetectionConfidence:.6,minFacePresenceConfidence:.6,outputFaceBlendshapes:false,outputFacialTransformationMatrixes:false});if(generation!==modelGeneration){instance.close();throw Error('cancelled');}model=instance;return instance;})();modelPromise=promise;promise.catch(()=>{if(modelPromise===promise)modelPromise=null;});}
  return modelPromise;
}
$('#profile-form').addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;if(!photoURL){setStatus('먼저 사진을 선택하거나 카메라로 촬영해 주세요.',true);$('#file').focus();return;}
  if(!$('#consent').checked){setStatus('사진 사용과 기기 내 처리에 동의해 주세요.',true);$('#consent').focus();return;}
  clearResult();stopCamera();const request=++epoch;setBusy(true);setStatus('얼굴 특징점을 기기 안에서 찾고 있어요. 처음에는 모델 준비에 잠시 걸려요.');
  try{const landmarker=await getModel(request);if(request!==epoch)return;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));if(request!==epoch)return;const detected=landmarker.detect($('#photo'));if(request!==epoch)return;
    if(detected.faceLandmarks.length>1){setStatus('얼굴이 두 명 이상 보여요. 한 사람만 나온 사진을 선택해 주세요.',true);return;}
    if(!detected.faceLandmarks.length){adjust(defaults,'자동 측정 안 됨 · 직접 선택','직접 선택 (자동 측정 안 됨)');setStatus('얼굴을 찾지 못했어요. 정면 사진으로 바꾸거나 아래에서 형태를 직접 선택해 주세요.',true);return;}
    const measured=measureFace(detected.faceLandmarks[0],$('#photo').naturalWidth,$('#photo').naturalHeight);adjust(measured,'기기 내 자동 측정 · 수정 가능','사진의 특징점 자동 측정 후 사용자 확인');setStatus('형태를 찾았어요. 아래에서 사진과 비교해 확인해 주세요.');$('#adjust').scrollIntoView({behavior:'smooth',block:'nearest'});
  }catch(error){if(request!==epoch)return;adjust(defaults,'자동 측정 불가 · 직접 선택','직접 선택 (분석 기능 사용 불가)');setStatus('이 환경에서 자동 측정을 완료하지 못했어요. 사진을 보며 아래 형태를 직접 고를 수 있습니다.',true);}
  finally{if(request===epoch)setBusy(false);}
});
$('#demo').addEventListener('click',()=>{invalidate();stopCamera();if(!$('#nickname').value.trim())$('#nickname').value='체험자';adjust(defaults,'예시 · 실제 사진 분석 아님','사진 없는 예시');page('experience');$('#adjust').scrollIntoView({behavior:'smooth',block:'start'});setStatus('예시 모드입니다. 원하는 형태를 골라 결과 화면을 체험해 보세요.');});
$('#nickname').addEventListener('input',()=>$('#nickname').setCustomValidity(''));
$('#make-result').addEventListener('click',()=>{
  $('#nickname').setCustomValidity($('#nickname').value.trim()?'':'실명 대신 닉네임(별명)을 입력해 주세요.');
  if(!$('#profile-form').reportValidity())return;
  exportId++;$('#download-png').disabled=false;const values=selection(),s=shapes[values.shape],nickname=$('#nickname').value.trim();const profile={nickname,age:$('#age').value?Number($('#age').value):null,gender:$('#gender').value||'응답 안 함'};result={profile,selection:values,source:source+(source.startsWith('사진의')?' (수정 가능)':'')};
  const appraisal=buildAppraisal(profile,values);
  $('#result-heading').textContent=nickname+'님의 관상 이야기';$('#result-profile').textContent=`닉네임: ${nickname} · 나이: ${profile.age===null?'미입력':profile.age+'세'} · 성별: ${profile.gender}`;$('#result-shape').textContent=s.name;$('#result-face').innerHTML=faceSVG(values);$('#result-motif').textContent=s.motif;$('#result-visual').textContent=s.visual;$('#result-story').textContent=s.story;$('#result-source').textContent=result.source;$('#feature-tags').innerHTML=Object.entries(features).map(([key,f])=>`<span class="feature-tag">${escapeHTML(f.items[values[key]])}</span>`).join('');$('#overall-text').textContent=appraisal.overall;$('#overall-count').textContent=countChars(appraisal.overall)+' / 500자';$('#detail-explanations').innerHTML=appraisal.details.map(d=>`<article class="detail-card"><h4>${escapeHTML(d.title)} <small>${countChars(d.text)} / 200자</small></h4><p>${escapeHTML(d.text)}</p></article>`).join('');$('#result').hidden=false;$('#result').focus({preventScroll:true});$('#result').scrollIntoView({behavior:'smooth',block:'start'});
});
function invalidateRendered(){const wasAdjusting=!$('#adjust').hidden;clearResult();$('#adjust').hidden=!wasAdjusting;}
for(const key of ['nickname','age','gender'])$('#'+key).addEventListener('change',()=>{if(result)invalidateRendered();});
for(const key of Object.keys(defaults))$('#'+key).addEventListener('change',()=>{invalidateRendered();if(source.startsWith('사진의')){source='사진 자동 측정 후 사용자 직접 수정';$('#measurement-label').textContent='사용자 수정 · 자동 측정값과 다를 수 있음';}});
function download(content,type,name){const url=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('저장을 요청했어요. 브라우저 다운로드 목록에서 확인해 주세요.');}
$('#download-svg').addEventListener('click',()=>{if(result)download(faceSVG(result.selection),'image/svg+xml;charset=utf-8','gyeol-portrait.svg');});
$('#download-report').addEventListener('click',()=>{if(result)download(String.fromCharCode(0xfeff)+resultText(result.profile,result.selection,result.source),'text/plain;charset=utf-8','gyeol-story.txt');});
$('#download-png').addEventListener('click',async()=>{if(!result)return;const snapshot=result,request=++exportId;$('#download-png').disabled=true;try{await document.fonts?.ready;const {createReportPNG}=await import('./report-canvas.mjs');if(request!==exportId||result!==snapshot)return;const blob=await createReportPNG(snapshot.profile,snapshot.selection,snapshot.source);if(request===exportId&&result===snapshot)download(blob,'image/png','myeongdo-appraisal.png');}catch(error){if(request===exportId)toast('PNG 저장을 준비하지 못했어요. 그림 SVG 또는 설명 TXT로 저장할 수 있습니다.');}finally{if(request===exportId)$('#download-png').disabled=false;}});
$('#delete-all').addEventListener('click',()=>{invalidate();stopCamera();releasePhoto();$('#profile-form').reset();$('#nickname').setCustomValidity('');for(const k of Object.keys(defaults))$('#'+k).value=defaults[k];disposeModel();$('#capture-canvas').width=0;$('#capture-canvas').height=0;setStatus('사진·입력·분석 결과를 모두 지웠어요.');toast('사진·입력·결과를 모두 삭제했어요. 직접 저장한 파일은 기기에서 삭제해 주세요.');});
$('#privacy-info').addEventListener('click',()=>$('#privacy-dialog').showModal());$('#close-privacy').addEventListener('click',()=>$('#privacy-dialog').close());
