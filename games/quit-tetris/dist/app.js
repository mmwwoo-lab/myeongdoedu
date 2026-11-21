(()=>{
  'use strict';
  const $=id=>document.getElementById(id),{BlockGame,SHAPES,LEVELS}=Blocks,game=new BlockGame();
  let selectedStart=1,announcedLevel=1,levelPrevious='ready';
  try{const saved=Number(localStorage.getItem('breathe-blocks-start-level'));if(Number.isInteger(saved)&&saved>=1&&saved<=10)selectedStart=saved;}catch{}
  game.reset(selectedStart);announcedLevel=selectedStart;
  const colors={I:'#3ce5ff',J:'#6687ff',L:'#ffad4a',O:'#ffe66d',S:'#77f28f',T:'#d98bff',Z:'#ff738f'};
  const canvas=$('board'),ctx=canvas.getContext('2d');let state='ready',elapsed=0,last=0,fall=0,grounded=0,resets=0,best=0,breathTimer=null,breathPrevious='ready';
  const sound=new BlocksAudio({onChange:syncSound});
  try{best=Number(localStorage.getItem('breathe-blocks-best'))||0;}catch{}$('best').textContent=best.toLocaleString('ko-KR');
  const quotes=['한 줄을 비웠네요.\n마음에도 여유가 생겼길 바라요.','담배 생각은 잠시 내려놓고,\n지금의 블록에 집중해요.','조금씩, 천천히.\n내 페이스대로 가면 돼요.','다시 시작하는 순간마다\n새로운 기회가 생겨요.'];
  function syncSound(){const retry=sound.enabled&&sound.failed;$('sound').textContent=retry?'소리 재시도':sound.enabled?'소리 ON':'소리 OFF';$('sound').setAttribute('aria-pressed',String(sound.enabled));$('sound').setAttribute('aria-label',retry?'소리 다시 켜기':sound.enabled?'소리 끄기':'소리 켜기');$('sound').title=retry?'소리를 재생하지 못했어요. 다시 눌러주세요.':sound.enabled?'효과음 켜짐':'효과음 꺼짐';}
  function tone(freq=440,time=.09){void sound.play(freq,time);}
  syncSound();
  function block(c,x,y,size,type,ghost=false){const col=colors[type];c.save();if(ghost){c.strokeStyle=col+'75';c.lineWidth=1.4;c.strokeRect(x+3,y+3,size-6,size-6);c.fillStyle=col+'0b';c.fillRect(x+3,y+3,size-6,size-6);}else{c.shadowColor=col;c.shadowBlur=5;c.fillStyle=col;c.beginPath();c.roundRect(x+2,y+2,size-4,size-4,3);c.fill();c.shadowBlur=0;c.fillStyle='#ffffff40';c.fillRect(x+5,y+4,size-10,2);c.fillStyle='#00000025';c.fillRect(x+5,y+size-6,size-10,2);}c.restore();}
  function preview(id,type){const c=$(id).getContext('2d');c.clearRect(0,0,120,100);if(!type)return;const cells=[];SHAPES[type].forEach((r,y)=>r.forEach((v,x)=>{if(v)cells.push([x,y]);}));const minx=Math.min(...cells.map(v=>v[0])),maxx=Math.max(...cells.map(v=>v[0])),miny=Math.min(...cells.map(v=>v[1])),maxy=Math.max(...cells.map(v=>v[1]));const s=23,ox=(120-(maxx-minx+1)*s)/2,oy=(100-(maxy-miny+1)*s)/2;cells.forEach(([x,y])=>block(c,ox+(x-minx)*s,oy+(y-miny)*s,s,type));}
  function render(){
    ctx.fillStyle='#202020';ctx.fillRect(0,0,300,600);ctx.strokeStyle='#52525266';ctx.lineWidth=.5;
    for(let x=0;x<=10;x++){ctx.beginPath();ctx.moveTo(x*30,0);ctx.lineTo(x*30,600);ctx.stroke();}
    for(let y=0;y<=20;y++){ctx.beginPath();ctx.moveTo(0,y*30);ctx.lineTo(300,y*30);ctx.stroke();}
    game.board.forEach((r,y)=>r.forEach((v,x)=>{if(v)block(ctx,x*30,y*30,30,v);}));
    if(!game.over&&!game.won){const p=game.piece,gy=game.ghostY();for(const [yy,ghost]of [[gy,true],[p.y,false]])p.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v&&yy+y>=0)block(ctx,(p.x+x)*30,(yy+y)*30,30,p.type,ghost);}));}
    preview('next',game.queue[0]);preview('held',game.held);$('hold').style.opacity=game.canHold?'1':'.45';
    $('score').textContent=String(game.score).padStart(6,'0');$('lines').textContent=game.lines;$('level').textContent=game.level;
    const rank=game.difficulty;
    $('music-tempo').textContent=sound.enabled?`${84+(game.level-1)*10} BPM`:'BGM OFF';
    if($('rank-name').textContent!==rank.name)$('rank-name').textContent=rank.name;
    $('overlay-level').textContent=`${game.level}단계 · ${rank.name} / 등급 선택`;
    $('mission-title').textContent=game.won?'레전드 완료!':game.level===10?'최종 목표 10줄':'승급 목표 10줄';
    $('mission-copy').textContent=`낙하 ${(rank.fallMs/1000).toFixed(2)}초 · 고정 ${(rank.lockMs/1000).toFixed(2)}초`;
    $('stage-count').textContent=`${game.stageLines} / 10줄`;
    $('stage-fill').style.width=`${game.stageLines*10}%`;
    $('stage-progress').setAttribute('aria-valuenow',game.stageLines);
    $('stage-progress').setAttribute('aria-label',game.level===10?'최종 단계 진행':'다음 등급까지 진행');
    document.querySelectorAll('#rank-strip i').forEach((e,i)=>{e.classList.toggle('passed',i+1<game.level);e.classList.toggle('current',i+1===game.level);});
    if(game.score>best){best=game.score;$('best').textContent=best.toLocaleString('ko-KR');try{localStorage.setItem('breathe-blocks-best',best);}catch{}}
    const seconds=Math.floor(elapsed/1000);$('focus-time').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} / 3:00`;$('focus-fill').style.width=Math.min(100,seconds/180*100)+'%';
    if(seconds>=180)$('focus-note').textContent='3분 집중 완료! 원하면 조금 더 즐겨보세요.';
  }
  function showOverlay(title,text,label){$('overlay-title').innerHTML=title;$('overlay-text').textContent=text;$('start').innerHTML=label+' <span>ENTER</span>';$('overlay').classList.remove('hidden');}
  function setState(s){$('console').dataset.state=s;if(s==='playing')void sound.startMusic(game.level);else sound.stop();state=s;$('game-status').textContent={ready:'READY WHEN YOU ARE',playing:'ONE LINE AT A TIME',paused:'TAKE YOUR TIME',over:'A FRESH START AWAITS',breathing:'TAKE A BREATH',selecting:'CHOOSE YOUR LEVEL',won:'LEGEND COMPLETE'}[s];$('pause').disabled=!['playing','paused'].includes(s);$('pause').textContent=s==='paused'?'▶':'Ⅱ';$('pause').setAttribute('aria-label',s==='paused'?'게임 계속하기':'일시 정지');}
  function start(){if(state==='paused'){setState('playing');$('overlay').classList.add('hidden');}else{game.reset(selectedStart);announcedLevel=game.level;elapsed=fall=grounded=resets=0;$('focus-note').textContent='작은 집중이 모여 나만의 페이스가 돼요.';setState('playing');$('overlay').classList.add('hidden');tone(520);}last=performance.now();canvas.focus({preventScroll:true});render();}
  function pause(){if(state==='playing'){setState('paused');showOverlay('잠시 쉬어가도 괜찮아요','준비되면 다시 이어가세요.','계속 플레이');}else if(state==='paused')start();}
  function afterLock(cleared){
    fall=grounded=resets=0;
    sound.setLevel(game.level);
    if(cleared){const words=['','한 줄의 여유','두 배의 여유','가벼워진 마음','네 줄, 멋진 집중!'];const promoted=game.level>announcedLevel;const t=$('clear-toast');t.textContent=promoted?`${game.level}단계 ${game.difficulty.name} 승급!`:words[cleared];announcedLevel=game.level;t.classList.remove('show');void t.offsetWidth;t.classList.add('show');$('level-announcement').textContent=promoted?t.textContent:'';$('quote').innerText=quotes[(Math.ceil(game.lines/2)-1)%quotes.length];tone(520+cleared*100,.2);}else tone(170,.06);
    if(game.won){setState('won');showOverlay('10단계 레전드,<br>멋지게 해냈어요!',`${game.startLevel}단계부터 ${game.lines}줄을 비웠어요.\n최종 점수 ${game.score.toLocaleString('ko-KR')}점`,'다시 도전');$('start').focus({preventScroll:true});}
    else if(game.over){setState('over');showOverlay('충분히 잘했어요.<br>다시 한 줄부터.',`${game.level}단계 ${game.difficulty.name} · ${game.lines}줄\n${game.score.toLocaleString('ko-KR')}점을 쌓았어요.`,'다시 플레이');$('start').focus({preventScroll:true});}
  }
  function action(name){if(state!=='playing')return;let changed=false;if(name==='left'||name==='right')changed=game.move(name==='left'?-1:1,0);if(name==='rotate'||name==='reverse'){changed=game.rotate(name==='reverse'?-1:1);if(changed)tone(360,.035);}if(changed&&(name==='left'||name==='right'))tone(240,.045);if(name==='down'){changed=game.move(0,1);if(changed){game.score++;fall=0;tone(200,.04);}}if(name==='drop'){afterLock(game.hardDrop());}if(name==='hold'){if(game.hold()){fall=grounded=resets=0;tone(300);if(game.over)afterLock(0);}}if(changed&&grounded&&resets<12){grounded=0;resets++;}render();}
  function frame(time){const dt=Math.min(time-last,100);last=time;if(state==='playing'){elapsed+=dt;fall+=dt;const rank=game.difficulty;let stepped=false;while(fall>=rank.fallMs){if(!game.move(0,1)){fall=0;break;}fall-=rank.fallMs;stepped=true;}if(stepped)sound.fallTick();if(game.collides({...game.piece,y:game.piece.y+1})){grounded+=dt;if(grounded>=rank.lockMs)afterLock(game.lock());}else grounded=0;render();}requestAnimationFrame(frame);}
  $('start').onclick=start;$('pause').onclick=pause;$('hold').onclick=()=>action('hold');$('sound').onclick=()=>{sound.setEnabled(!sound.enabled||sound.failed);if(sound.enabled){if(state==='playing')void sound.startMusic(game.level);tone(600,.14);}render();};
  const keymap={ArrowLeft:'left',ArrowRight:'right',ArrowDown:'down',ArrowUp:'rotate',x:'rotate',z:'reverse',' ':'drop',c:'hold'};
  window.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.target.closest('dialog'))return;const key=e.key.length===1?e.key.toLowerCase():e.key;if(key==='Tab')return;if(key==='Enter'&&['ready','over','paused','won'].includes(state)){if(e.target.tagName==='BUTTON'&&e.target.id!=='start')return;e.preventDefault();if(!e.repeat)start();return;}if(key==='p'||key==='Escape'){e.preventDefault();if(!e.repeat)pause();return;}if(key==='b'){e.preventDefault();if(!e.repeat)openBreath();return;}if(keymap[key]){e.preventDefault();if(e.repeat&&['drop','hold','rotate','reverse'].includes(keymap[key]))return;action(keymap[key]);}});
  let repeatDelay,repeatTimer;function stopRepeat(){clearTimeout(repeatDelay);clearInterval(repeatTimer);}document.querySelectorAll('[data-action]').forEach(button=>{button.addEventListener('pointerdown',e=>{e.preventDefault();stopRepeat();const name=button.dataset.action;action(name);button.setPointerCapture(e.pointerId);if(['left','right','down'].includes(name))repeatDelay=setTimeout(()=>{repeatTimer=setInterval(()=>action(name),85);},190);});button.addEventListener('pointerup',stopRepeat);button.addEventListener('pointercancel',stopRepeat);button.addEventListener('lostpointercapture',stopRepeat);button.addEventListener('click',e=>{if(e.detail===0)action(button.dataset.action);});});
  function updateLevelChoice(){const input=document.querySelector('input[name="start-level"]:checked');if(!input)return;const rank=LEVELS[Number(input.value)-1];$('level-choice-detail').textContent=`${rank.number}단계 ${rank.name} · 한 칸 낙하 ${(rank.fallMs/1000).toFixed(2)}초 · 착지 후 고정 ${(rank.lockMs/1000).toFixed(2)}초`;$('apply-level').textContent=`${rank.number}단계로 새 게임 시작`;}
  function openLevels(){if($('level-dialog').open||$('breath-dialog').open)return;stopRepeat();levelPrevious=state;const choice=['ready','over','won'].includes(state)?selectedStart:game.level;document.querySelector(`input[name="start-level"][value="${choice}"]`).checked=true;updateLevelChoice();setState('selecting');$('level-dialog').showModal();}
  function closeLevels(){ $('level-dialog').close();setState(levelPrevious);last=performance.now();if(state==='playing')canvas.focus({preventScroll:true});else $('choose-level').focus({preventScroll:true});}
  $('level-options').innerHTML=LEVELS.map(rank=>`<label class="level-option"><input type="radio" name="start-level" value="${rank.number}"><span><strong><b>${String(rank.number).padStart(2,'0')}</b> ${rank.name}</strong><small>낙하 ${(rank.fallMs/1000).toFixed(2)}초 · 점수 ×${rank.number}</small></span></label>`).join('');
  $('level-options').addEventListener('change',updateLevelChoice);$('choose-level').onclick=openLevels;$('overlay-level').onclick=openLevels;$('close-level').onclick=closeLevels;$('cancel-level').onclick=closeLevels;
  $('level-dialog').addEventListener('cancel',e=>{e.preventDefault();closeLevels();});
  $('apply-level').onclick=()=>{selectedStart=Number(document.querySelector('input[name="start-level"]:checked').value);try{localStorage.setItem('breathe-blocks-start-level',selectedStart);}catch{}$('level-dialog').close();state='ready';$('level-announcement').textContent='';start();};
  function openBreath(){if($('breath-dialog').open)return;stopRepeat();breathPrevious=state;setState('breathing');$('breath-dialog').showModal();let ticks=0;const update=()=>{const cycle=Math.floor(ticks/10),part=ticks%10;if(ticks>=30){clearInterval(breathTimer);$('breath-instruction').textContent='잘 쉬었어요';$('breath-count').textContent='✳';$('breath-progress').textContent='준비되면 다시 시작해요.';$('breath-ring').className='breath-ring';return;}$('breath-instruction').textContent=part<4?'편안하게 들이쉬기':'천천히 내쉬기';$('breath-count').textContent=part<4?4-part:10-part;$('breath-progress').textContent=`${cycle+1} / 3번`;$('breath-ring').className=part<4?'breath-ring expand':'breath-ring exhale';ticks++;};$('breath-ring').className='breath-ring';requestAnimationFrame(()=>requestAnimationFrame(update));breathTimer=setInterval(update,1000);}
  function closeBreath(){clearInterval(breathTimer);$('breath-dialog').close();setState(breathPrevious);last=performance.now();if(state==='playing')canvas.focus({preventScroll:true});else $('breathe').focus({preventScroll:true});}
  $('breathe').onclick=openBreath;$('close-breath').onclick=closeBreath;$('return-game').onclick=closeBreath;$('breath-dialog').addEventListener('cancel',e=>{e.preventDefault();closeBreath();});document.addEventListener('visibilitychange',()=>{if(document.hidden){stopRepeat();if(state==='playing')pause();}});window.addEventListener('blur',()=>{stopRepeat();if(state==='playing')pause();});
  // A quiet, decorative stack is only shown on the welcome screen.
  ['S','T','L','I','O'].forEach((type,i)=>{SHAPES[type].forEach((r,y)=>r.forEach((v,x)=>{const by=17+y-(i%2),bx=i*2+x;if(v&&by<20&&bx<10)game.board[by][bx]=type;}));});render();requestAnimationFrame(frame);
})();
