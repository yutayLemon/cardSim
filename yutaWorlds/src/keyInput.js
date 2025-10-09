import {exportAll,importBoxObj,exportObjBox,importAll} from "./import.js"
import {scene} from "./index.js"
import {deleteDebugPoints,initDebug} from './debug.js'

let state = {};
const mousePos = {x:0,y:0};

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
    window.simulation.state.simPause = !window.simulation.state.simPause;
  }
  if(e.key == 's'){
    window.simulation.state.step = true;
  }
});



document.getElementById('toggle-arrow').addEventListener('change', e => {
  window.simulation.debug.arrow = e.target.checked;
});

document.getElementById('toggle-selection').addEventListener('change', e => {
  window.simulation.debug.selection = e.target.checked;
});

document.getElementById('toggle-points').addEventListener('change', e => {
  window.simulation.debug.points = e.target.checked;
});

document.getElementById('toggle-flow').addEventListener('click', e => {
  window.simulation.camera.flow = true;
});

document.getElementById("exportFile").addEventListener('click',()=>{
    exportAll(window.simulation.objects);
});

document.getElementById("importFile").addEventListener('click',()=>{
  deleteDebugPoints(scene);
  initDebug(scene);

  deleatObjects(scene,window.simulation.objects);
  let newArr = importAll(scene,window.simulation.importState);  
  window.simulation.objects.length = 0;  
  window.simulation.objects = newArr;

  window.simulation.state.step = true;
});

function deleatObjects(scene,arr){
  for(const elm of arr){
    elm.delete(scene);
  }
  arr.length = 0;
}

document.getElementById('uploadFile').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                window.simulation.importState = JSON.parse(e.target.result);
                console.log(window.simulation.importState);
            };

            reader.onerror = function(e) {
                console.error("Error reading file:", e.target.error);
                document.getElementById('output').textContent = "Error reading file: " + e.target.error.message;
            };

            reader.readAsText(file); // Read the file content as text
        }
    });

}


console.log("key inputs setup");

export {state,initKeyInput};