(function(root){
  'use strict';
  function bindGameControls(buttons,{onAction,isActive,setDelay=setTimeout,clearDelay=clearTimeout,setRepeat=setInterval,clearRepeat=clearInterval}){
    const presses=new Map();
    function release(pointerId){const press=presses.get(pointerId);if(!press)return;clearDelay(press.delay);clearRepeat(press.repeat);presses.delete(pointerId);}
    function stop(){for(const pointerId of [...presses.keys()])release(pointerId);}
    for(const button of buttons){
      button.addEventListener('pointerdown',event=>{
        if(!isActive()||(event.button!==undefined&&event.button!==0))return;
        event.preventDefault();release(event.pointerId);
        const name=button.dataset.action;
        // Opposing horizontal presses must not keep fighting each other.
        if(name==='left'||name==='right')for(const [id,press]of presses)if(press.name==='left'||press.name==='right')release(id);
        onAction(name);
        if(!isActive())return;
        try{button.setPointerCapture(event.pointerId);}catch{}
        if(['left','right','down'].includes(name)){
          const press={name,delay:null,repeat:null};presses.set(event.pointerId,press);
          press.delay=setDelay(()=>{
            if(!presses.has(event.pointerId)||!isActive()){release(event.pointerId);return;}
            press.repeat=setRepeat(()=>{if(!isActive()){release(event.pointerId);return;}onAction(name);},85);
          },190);
        }
      });
      for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>release(event.pointerId));
      button.addEventListener('contextmenu',event=>event.preventDefault());
      button.addEventListener('click',event=>{if(event.detail===0&&isActive())onAction(button.dataset.action);});
    }
    return{stop};
  }
  if(typeof module!=='undefined')module.exports=bindGameControls;
  root.bindGameControls=bindGameControls;
})(typeof window!=='undefined'?window:globalThis);
