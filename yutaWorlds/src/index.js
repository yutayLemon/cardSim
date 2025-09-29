import * as THREE from 'three';
import {cardObj,playerObj,approxPlane} from './cardObj'
import {state,initKeyInput} from './keyInput.js'
import {updateDebug,initDebug,debugVertex,debugP} from './debug.js'
import {cloideBox2Box,resolveCollision,updateArrCollisions} from './colideDetect.js'

import {initScene} from './sceneSetUp.js'

let {scene,renderer,camera,controles} = initScene();
window.simPause = false;

initKeyInput();
initDebug(scene);
//WTF
        const euler = new THREE.Euler(Math.PI*0.25, Math.PI*0.25, 0, 'XYZ');
        const rotationMatrix4 = new THREE.Matrix4().makeRotationFromEuler(euler);
        const rotationMatrix3 = new THREE.Matrix3().setFromMatrix4(rotationMatrix4);

const euler1 = new THREE.Euler(-Math.PI*0.15,0, 0, 'XYZ');
        const rotationMatrix41 = new THREE.Matrix4().makeRotationFromEuler(euler1);
        const rotationMatrix31 = new THREE.Matrix3().setFromMatrix4(rotationMatrix41);


var cards = [];
cards.push(new cardObj(scene,2));
cards.push(new cardObj(scene,2));
cards[0].place(new THREE.Vector3(1,3,0),cards[0].vertex.bottomRight[0]);
cards[1].place(new THREE.Vector3(0,2,4),cards[1].vertex.bottomRight[1]);
cards[0].color = 0xff00ff;
cards[1].color = 0x00ff00;
cards[0].vel.set(0,0,0);
cards[1].vel.set(0,0,-0.03);
cards[1].rotationMatrx.multiply(rotationMatrix3);
cards[0].rotationMatrx.multiply(rotationMatrix31);
cards[1].angMomentum.set(0.05,0.05,0.05);
console.log(cards);

let player = new playerObj(scene,0.5);
player.place(new THREE.Vector3(0,0,0),player.vertex.bottomLeft[0]);

let floor = new approxPlane(scene,10);

let tick = 0;
window.step  = false;
function animate(time){
    controles.update();
    if(window.simPause && !window.step){
    }else{
      window.step = !window.step;
      proccessObjects();
      updateDebug();

      prossesCollisions();
    }
    
    renderer.render(scene,camera);
}

function proccessObjects(){
  player.updateDirVects(camera);

    //uodates
  for(const card of cards){
        card.update(tick);
  }
  player.update(tick);
  floor.update(tick);
}

function prossesCollisions(){
  if(cloideBox2Box(cards[0],player).colide){
      player.color = 0x0000ff;
    }else{
      player.color = 0x00ff00;
    }
    if(cloideBox2Box(cards[1],player).colide){
      player.color = 0xff00ff;
    }else{
      player.color = 0x00ff00;
    }

    //let objs = cards.concat([player]).concat([floor]);//TODO DEBUGGG
    let objs = cards.concat([player]);//.concat([floor]);//TODO DEBUGGG
    updateArrCollisions(objs);//TODO think about placement
}

renderer.render(scene,camera);
renderer.setAnimationLoop(animate);

window.step = function(){animate();console.log(cards)};

window.addEventListener("keydown",(e)=>{
  if(e.key == 's'){
    window.step = true;
  }
});
