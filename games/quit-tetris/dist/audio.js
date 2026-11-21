(function(root){
  'use strict';
  class BlocksAudio {
    constructor({createContext,now,onChange,setTimer,clearTimer}={}) {
      this.createContext=createContext||(()=>{const Context=root.AudioContext||root.webkitAudioContext;if(!Context)throw new Error('Audio unavailable');return new Context();});
      this.now=now||(()=>performance.now());this.onChange=onChange||(()=>{});
      this.setTimer=setTimer||((fn,ms)=>setInterval(fn,ms));this.clearTimer=clearTimer||(id=>clearInterval(id));
      this.enabled=true;this.failed=false;this.context=null;this.resuming=null;this.generation=0;this.voices=new Set();
      this.musicVoices=new Set();this.musicTimer=null;this.musicWanted=false;this.level=1;this.tempo=84;this.musicStep=0;this.nextNoteTime=0;
      // Every newly opened game starts with sound ON. Muting lasts for this session.
    }
    setEnabled(enabled) {
      const wanted=this.musicWanted;this.enabled=enabled;this.failed=false;this.stop();this.musicWanted=wanted;
      this.onChange();
      if(enabled&&wanted)void this.startMusic(this.level);
    }
    stop() {
      this.generation++;this.musicWanted=false;
      if(this.musicTimer!==null){this.clearTimer(this.musicTimer);this.musicTimer=null;}
      for(const group of [this.voices,this.musicVoices])for(const voice of [...group]){try{voice.oscillator.stop();}catch{}voice.cleanup();}
    }
    setLevel(level) {
      const value=Number(level);this.level=Number.isFinite(value)?Math.max(1,Math.min(10,Math.floor(value))):1;
      this.tempo=84+(this.level-1)*10;
    }
    async ready() {
      if(!this.context||this.context.state==='closed'){this.context=this.createContext();this.resuming=null;}
      const context=this.context;
      if(context.state!=='running'){
        if(!this.resuming)this.resuming=Promise.resolve(context.resume()).finally(()=>{this.resuming=null;});
        await this.resuming;
      }
      if(context.state!=='running')throw new Error('Audio is not running');
      return context;
    }
    makeVoice(context,frequency,duration,start,{type='sine',volume=.14,endFrequency}={},group=this.voices) {
      const oscillator=context.createOscillator(),gain=context.createGain();
      oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,start);
      if(endFrequency)oscillator.frequency.exponentialRampToValueAtTime(endFrequency,start+duration);
      gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(volume,start+.005);
      gain.gain.exponentialRampToValueAtTime(.0001,start+Math.max(.015,duration));
      oscillator.connect(gain);gain.connect(context.destination);
      let cleaned=false;const voice={oscillator,cleanup:()=>{if(cleaned)return;cleaned=true;oscillator.disconnect();gain.disconnect();group.delete(voice);}};
      oscillator.onended=voice.cleanup;group.add(voice);oscillator.start(start);oscillator.stop(start+duration+.01);
      return voice;
    }
    fail(generation) {
      if(this.enabled&&generation===this.generation){this.stop();this.failed=true;this.onChange();}
    }
    async play(frequency=440,duration=.09,volume=.14) {
      if(!this.enabled)return false;
      const generation=this.generation,requestedAt=this.now();
      try{
        const context=await this.ready();
        if(!this.enabled||generation!==this.generation||this.now()-requestedAt>350)return false;
        if(this.failed){this.failed=false;this.onChange();}
        if(this.voices.size>=4){const oldest=this.voices.values().next().value;oldest.oscillator.stop();oldest.cleanup();}
        this.makeVoice(context,frequency,duration,context.currentTime+.005,{volume});return true;
      }catch{this.fail(generation);return false;}
    }
    fallTick(){void this.play(360+this.level*18,.025,.016);}
    async startMusic(level=this.level) {
      this.setLevel(level);this.musicWanted=true;
      if(!this.enabled)return false;
      const generation=this.generation;
      try{
        const context=await this.ready();
        if(!this.enabled||!this.musicWanted||generation!==this.generation)return false;
        if(this.musicTimer!==null)return true;
        this.musicStep=0;this.nextNoteTime=context.currentTime+.03;
        this.scheduleMusic();
        this.musicTimer=this.setTimer(()=>{try{this.scheduleMusic();}catch{this.fail(generation);}},25);
        if(this.failed){this.failed=false;this.onChange();}
        return true;
      }catch{this.fail(generation);return false;}
    }
    scheduleMusic() {
      if(!this.musicWanted||!this.enabled||!this.context||this.context.state!=='running')return;
      const context=this.context,stepSeconds=60/this.tempo/4;
      if(this.nextNoteTime<context.currentTime-.12)this.nextNoteTime=context.currentTime+.02;
      const melody=[72,0,76,79,76,0,74,0,72,76,79,81,79,0,76,74];
      const bass=[48,53,55,48];const frequency=midi=>440*Math.pow(2,(midi-69)/12);
      while(this.nextNoteTime<context.currentTime+.12){
        const step=this.musicStep%16,bar=Math.floor(this.musicStep/16)%4,time=this.nextNoteTime;
        const note=melody[step];
        if(note)this.makeVoice(context,frequency(note),stepSeconds*.8,time,{type:'triangle',volume:.025},this.musicVoices);
        if(step%4===0)this.makeVoice(context,frequency(bass[bar]),stepSeconds*1.7,time,{type:'square',volume:.012},this.musicVoices);
        if(step%8===0)this.makeVoice(context,115,.11,time,{volume:.07,endFrequency:42},this.musicVoices);
        if(step%8===4)this.makeVoice(context,190,.08,time,{type:'triangle',volume:.025,endFrequency:85},this.musicVoices);
        if(step%2===0)this.makeVoice(context,4300,.022,time,{type:'square',volume:.005},this.musicVoices);
        this.nextNoteTime+=stepSeconds;this.musicStep=(this.musicStep+1)%64;
      }
    }
  }
  if(typeof module!=='undefined')module.exports=BlocksAudio;
  root.BlocksAudio=BlocksAudio;
})(typeof window!=='undefined'?window:globalThis);
