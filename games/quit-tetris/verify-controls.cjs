const assert=require('node:assert/strict');
const bindGameControls=require('./dist/controls.js');
function fixture(){
  let active=true;const actions=[],delays=new Map(),repeats=new Map();let next=0;
  function button(name){const handlers={};return{dataset:{action:name},addEventListener(type,fn){(handlers[type]||=[]).push(fn);},setPointerCapture(){},emit(type,id=1,extra={}){const e={pointerId:id,button:0,detail:1,preventDefault(){},...extra};for(const fn of handlers[type]||[])fn(e);}};}
  const buttons=Object.fromEntries(['left','right','down','rotate','drop'].map(n=>[n,button(n)]));
  const controls=bindGameControls(Object.values(buttons),{onAction:name=>actions.push(name),isActive:()=>active,setDelay:fn=>{delays.set(++next,fn);return next;},clearDelay:id=>delays.delete(id),setRepeat:fn=>{repeats.set(++next,fn);return next;},clearRepeat:id=>repeats.delete(id)});
  return{buttons,actions,controls,delays,repeats,setActive:v=>active=v,wait:()=>{for(const [id,fn]of [...delays]){delays.delete(id);fn();}},tick:()=>{for(const fn of [...repeats.values()])fn();}};
}
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
test('held direction repeats and releases cleanly',()=>{const f=fixture();f.buttons.left.emit('pointerdown');f.wait();f.tick();assert.deepEqual(f.actions,['left','left']);f.buttons.left.emit('pointerup');f.tick();assert.equal(f.actions.length,2);assert.equal(f.repeats.size,0);});
test('rotating with a second finger preserves held movement',()=>{const f=fixture();f.buttons.left.emit('pointerdown',1);f.wait();f.buttons.rotate.emit('pointerdown',2);f.buttons.rotate.emit('pointerup',2);f.tick();assert.deepEqual(f.actions,['left','rotate','left']);});
test('holding down and left can run together',()=>{const f=fixture();f.buttons.left.emit('pointerdown',1);f.buttons.down.emit('pointerdown',2);f.wait();f.tick();assert.deepEqual(f.actions,['left','down','left','down']);});
test('opposite direction replaces the old horizontal hold',()=>{const f=fixture();f.buttons.left.emit('pointerdown',1);f.wait();f.buttons.right.emit('pointerdown',2);f.wait();f.tick();assert.deepEqual(f.actions,['left','right','right']);});
for(const type of ['pointercancel','lostpointercapture'])test(type+' does not leave movement stuck',()=>{const f=fixture();f.buttons.down.emit('pointerdown',7);f.wait();f.buttons.down.emit(type,7);f.tick();assert.deepEqual(f.actions,['down']);assert.equal(f.repeats.size,0);});
test('pause clears all held pointers immediately',()=>{const f=fixture();f.buttons.left.emit('pointerdown',1);f.buttons.down.emit('pointerdown',2);f.wait();f.controls.stop();f.tick();assert.deepEqual(f.actions,['left','down']);assert.equal(f.repeats.size,0);assert.equal(f.delays.size,0);});
test('inactive game never schedules repeating input',()=>{const f=fixture();f.setActive(false);f.buttons.left.emit('pointerdown');f.wait();f.tick();assert.deepEqual(f.actions,[]);assert.equal(f.repeats.size,0);});
test('keyboard activation performs one action without a pointer',()=>{const f=fixture();f.buttons.rotate.emit('click',0,{detail:0});assert.deepEqual(f.actions,['rotate']);});
test('pointer-generated click does not duplicate its action',()=>{const f=fixture();f.buttons.drop.emit('pointerdown');f.buttons.drop.emit('pointerup');f.buttons.drop.emit('click');assert.deepEqual(f.actions,['drop']);});
test('right mouse button does not trigger a game action',()=>{const f=fixture();f.buttons.drop.emit('pointerdown',1,{button:2});assert.deepEqual(f.actions,[]);});
console.log(count+' control checks passed');
