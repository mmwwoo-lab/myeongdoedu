(function(root){
  'use strict';
  const SHAPES={I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],J:[[1,0,0],[1,1,1],[0,0,0]],L:[[0,0,1],[1,1,1],[0,0,0]],O:[[1,1],[1,1]],S:[[0,1,1],[1,1,0],[0,0,0]],T:[[0,1,0],[1,1,1],[0,0,0]],Z:[[1,1,0],[0,1,1],[0,0,0]]};
  const LEVELS=Object.freeze([
    {number:1,name:'입문',fallMs:1000,lockMs:650},
    {number:2,name:'초급',fallMs:850,lockMs:620},
    {number:3,name:'적응',fallMs:720,lockMs:590},
    {number:4,name:'집중',fallMs:600,lockMs:550},
    {number:5,name:'도전',fallMs:490,lockMs:510},
    {number:6,name:'숙련',fallMs:390,lockMs:470},
    {number:7,name:'고수',fallMs:300,lockMs:430},
    {number:8,name:'달인',fallMs:220,lockMs:390},
    {number:9,name:'마스터',fallMs:150,lockMs:340},
    {number:10,name:'레전드',fallMs:90,lockMs:280}
  ].map(Object.freeze));
  class BlockGame{
    constructor(random=Math.random){this.random=random;this.reset();}
    reset(startLevel=1){this.board=Array.from({length:20},()=>Array(10).fill(null));this.bag=[];this.queue=Array.from({length:4},()=>this.take());this.held=null;this.canHold=true;this.score=0;this.lines=0;const value=Number(startLevel);this.startLevel=Number.isFinite(value)?Math.max(1,Math.min(10,Math.floor(value))):1;this.level=this.startLevel;this.stageLines=0;this.won=false;this.over=false;this.spawn();}
    get difficulty(){return LEVELS[this.level-1];}
    take(){if(!this.bag.length){this.bag=Object.keys(SHAPES);for(let i=6;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}}return this.bag.pop();}
    create(type){const matrix=SHAPES[type].map(r=>r.slice());return{type,matrix,x:Math.floor((10-matrix.length)/2),y:type==='I'?-1:0};}
    spawn(type){this.piece=this.create(type||this.queue.shift());if(!type)this.queue.push(this.take());if(this.collides())this.over=true;}
    collides(p=this.piece){return p.matrix.some((row,y)=>row.some((v,x)=>v&&(p.x+x<0||p.x+x>=10||p.y+y>=20||(p.y+y>=0&&this.board[p.y+y][p.x+x]))));}
    move(dx,dy){if(this.over||this.won)return false;const p={...this.piece,x:this.piece.x+dx,y:this.piece.y+dy};if(this.collides(p))return false;this.piece=p;return true;}
    rotate(dir=1){if(this.over||this.won)return false;const m=this.piece.matrix,n=m.length;const matrix=Array.from({length:n},(_,y)=>Array.from({length:n},(_,x)=>dir===1?m[n-1-x][y]:m[x][n-1-y]));for(const [dx,dy]of [[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1],[-1,-1],[1,-1],[0,-2]]){const p={...this.piece,matrix,x:this.piece.x+dx,y:this.piece.y+dy};if(!this.collides(p)){this.piece=p;return true;}}return false;}
    ghostY(){let y=this.piece.y;while(!this.collides({...this.piece,y:y+1}))y++;return y;}
    hardDrop(){if(this.over||this.won)return 0;const y=this.ghostY();this.score+=(y-this.piece.y)*2;this.piece.y=y;return this.lock();}
    hold(){if(!this.canHold||this.over||this.won)return false;const type=this.piece.type,old=this.held;this.held=type;this.spawn(old);this.canHold=false;return true;}
    lock(){if(this.over||this.won)return 0;let topout=false;this.piece.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v){const by=this.piece.y+y;if(by<0)topout=true;else this.board[by][this.piece.x+x]=this.piece.type;}}));if(topout){this.over=true;return 0;}const remaining=this.board.filter(row=>!row.every(Boolean));const cleared=20-remaining.length;this.board=[...Array.from({length:cleared},()=>Array(10).fill(null)),...remaining];this.score+=[0,100,300,500,800][cleared]*this.level;this.lines+=cleared;this.stageLines+=cleared;if(this.stageLines>=10){if(this.level<10){this.stageLines-=10;this.level++;}else{this.stageLines=10;this.won=true;}}this.canHold=true;if(!this.won)this.spawn();return cleared;}
  }
  const api={BlockGame,SHAPES,LEVELS};if(typeof module!=='undefined')module.exports=api;root.Blocks=api;
})(typeof window!=='undefined'?window:globalThis);
