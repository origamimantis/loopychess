'use strict';

const EXT = ".wav";

/*
play( name )
unmute( name )
mute( name )
setVol(name, vol)
fadeout( name , time = 500)
fadestop( name, time = 500)
playin( name, time = 500)
fadein( name, time = 500)
stop( name )
stopAll()
*/




class MusicPlayer
{
  static async loadMusic()
  {
    this.album = {};
    // load(name, length, introLength)
    console.log(0)
    await this.load("good", 8000);
    console.log(1)
    await this.load("base", 8000);
    console.log(2)
    await this.load("bad", 8000);
    console.log(3)

    await this.loadFX("win", 2000);
    await this.loadFX("lose", 2000);
    await this.loadFX("draw", 2000);
    await this.loadFX("checking", 650);
    await this.loadFX("checked", 650);
    await this.loadFX("move", 650);
  }
  
  static async load( name, length, intro = 0)
  {
    let s = await new Promise ( (resolve) => 
      {
	let fullname = "assets/" + name + EXT;
	let sprite = {};
	if (intro > 0)
	{
	  sprite.start = [0, intro];
	  sprite.loop = [intro, length, true];
	}
	else
	{
	  sprite.start = [0, length, true];
	}
	let s = new Howl(
	  {
	    src: [fullname],
	    volume: 0.5,
	    sprite: sprite,
	    onload : () => {resolve(s);}
	  });
      });
    s.ez_isplaying = false;
    s.intro = (intro > 0);
    this.album[name] = s;
  }
  static async loadFX( name, length)
  {
    this.album[name] = await new Promise ( (resolve) => {
	let fullname = "assets/" + name + EXT;
	let s = new Howl(
	  {
	    src: [fullname],
	    volume: 0.5,
	    sprite: {start: [0, length]},
	    onload : () => {resolve(s);}
	  }
	);
      });
  }
  static playbase()
  {
    this.baseid = this.play("base");
  }
  static playlayer( name )
  {
    if (name == "base")
      return

    let id = this.play(name);
    this.mute(name)

    let time = this.album["base"].seek(this.baseid);
    this.album[name].seek(time, id);

    this.album["base"].volume(0.3);
    this.album[name].volume(0.3);
    this.unmute(name)
  }
  static stoplayer(name)
  {
    this.stop(name)
    this.album["base"].volume(0.4);
  }

  static play( name )
  {
    let s = this.album[name];
    if (s.ez_isplaying)
      return;
    s.ez_isplaying = true;
    s.volume(0.4);
    let id = s.play("start");
    
    if (s.intro)
    {
      s.once("end", ()=>{s.off("stop");if (s.ez_isplaying) s.play("loop");});
      s.once("stop", ()=>{s.off("end");});
    }
    return id;
  }
  static playfx( name )
  {
    let s = this.album[name];
    s.volume(0.5);
    let id = s.play("start");
    
    s.once("end", ()=>{this.stop(name);});
    return id;
  }
  static unmute( name )
  {
    this.album[name].mute(false);
  }
  static mute( name )
  {
    this.album[name].mute(true);
  }
  static setVol(name, vol)
  {
    this.album[name].volume(vol);
  }
  static fadeout( name , time = 500)
  {
    return new Promise( (resolve)=>
      {
	let s = this.album[name];
	if (s.ez_isplaying)
	{
	  s.fade(0.5, 0, time);
	  s.once("fade", resolve);
	}
	else
	  resolve();
      });
  }
  static async fadestop( name, time = 500)
  {
    await this.fadeout(name, time);
    this.stop(name);
  }
  static async playin( name, time = 500)
  {
    this.play(name);
    await this.fadein(name, time);
  }
  static fadein( name, time = 500)
  {
      return new Promise( (resolve)=>
      {
	let s = this.album[name];
	if (s.ez_isplaying)
	{
	  s.fade(0, 0.5, time);
	  s.once("fade", resolve);
	}
	else
	  resolve();
      });
  }
  static stop( name )
  {
    let s = this.album[name];
    s.stop();
    s.ez_isplaying = false;
  }
  static stopAll()
  {
    Howler.stop();
  }
}
