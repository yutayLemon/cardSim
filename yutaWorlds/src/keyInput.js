let state = {};

function initKeyInput(){

document.addEventListener('keydown',(e)=>{
    state[e.code] = true;
});

document.addEventListener('keyup',(e)=>{
    state[e.code] = false;
});

window.addEventListener("mousemove",(e)=>{
  mousePos.x = (e.clientX/window.innerWidth)*2-1;//normalise between -1,1
  mousePos.y = (e.clientY/window.innerHeight)*2-1;
});

window.addEventListener("keydown",(e)=>{
  if(e.key == 'p'){
    window.simPause = !window.simPause;
  }
});
}

const mousePos = {x:0,y:0};



export {state,initKeyInput};