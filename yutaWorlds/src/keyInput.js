let state = {};

function initKeyInput(){

document.addEventListener('keydown',(e)=>{
    state[e.code] = true;
});

document.addEventListener('keyup',(e)=>{
    state[e.code] = false;
});

}

export {state,initKeyInput};