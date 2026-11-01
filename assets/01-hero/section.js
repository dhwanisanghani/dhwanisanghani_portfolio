(()=>{
'use strict';
const root=document.getElementById('dhwani-hero');
if(!root||root.dataset.dhpInitialized)return;root.dataset.dhpInitialized='true';
const video=root.querySelector('video'),button=root.querySelector('.dhp-video-play'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
let ready=false,manual=false,pending=false,inView=true;
function show(){button.hidden=false}
function prepare(){if(ready)return;ready=true;video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.src=matchMedia('(max-width: 700px)').matches?'assets/01-hero/hero-mobile.mp4':'assets/01-hero/hero-desktop.mp4';video.load()}
function play(gesture=false){
 if(gesture)manual=true;
 if(document.hidden||!inView){video.pause();return}
 if((reduced.matches||connection?.saveData)&&!manual){show();return}
 prepare();if(pending)return;pending=true;
 const attempt=video.play();
 if(attempt?.then)attempt.then(()=>{pending=false;button.hidden=true;video.classList.add('dhp-is-playing')}).catch(()=>{pending=false;show()});else pending=false;
}
button.addEventListener('click',()=>play(true));
root.addEventListener('pointerdown',()=>{if(video.paused&&!reduced.matches&&!connection?.saveData)play(true)},{passive:true});
root.addEventListener('keydown',()=>{if(video.paused&&!reduced.matches&&!connection?.saveData)play(true)});
video.addEventListener('playing',()=>{pending=false;button.hidden=true});
video.addEventListener('error',()=>{pending=false;show()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(ready)play()});
reduced.addEventListener('change',()=>{manual=false;if(reduced.matches){video.pause();show()}else play()});
if('IntersectionObserver'in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(!inView)video.pause();else if(ready)play()},{threshold:0}).observe(root);
// Paint the text and lightweight poster before starting the decorative video.
requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(()=>play(),350)));
const last=root.querySelector('.dhp-tool:last-child');const done=()=>root.classList.add('dhp-is-entered');last?.addEventListener('animationend',done,{once:true});setTimeout(done,4000);
})();