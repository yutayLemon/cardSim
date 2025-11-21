import * as THREE from 'three';
import {allDamp,allInitForCycle,allApplyCorrection,allUpdateThreeJS,allUpdateRotation,allUpdatePos,allUpdateGlobalPos,allUpdateForce,allUpdateTorque,allUpdateApplieForce} from './updateAll.js'
import {cardObj,playerObj,approxPlane,imovable} from './cardObj'
import {state,initKeyInput} from './keyInput.js'
import {updateDebug,initDebug,debugVertex,debugP} from './debug.js'
import {collsionResolver} from './colideDetect.js'
import {makeCardMdl,loadCardMdl} from './cardMdl.js'
import {initScene} from './sceneSetUp.js'
import {exportAll} from './import.js'
import { step } from 'three/src/nodes/TSL.js';
import {initRecorder} from './recording.js';
import {twoCard} from './twrBuilder.js';


let player,floor,tick,cards;
let colisionObj;

function main(){
  window.simulation.state.simPause = false;
//WTF
//       const euler = new THREE.Euler(Math.PI*0.25, Math.PI*0.25, 0, 'XYZ');
       // const euler = new THREE.Euler( Math.PI*0.25,0, 0, 'XYZ');
        const euler = new THREE.Euler( 0,0, 0, 'XYZ');
//const euler = new THREE.Euler(Math.random()*Math.PI,Math.random()*Math.PI, Math.random()*Math.PI, 'XYZ');

        const rotationMatrix4 = new THREE.Matrix4().makeRotationFromEuler(euler);
        const rotationMatrix3 = new THREE.Matrix3().setFromMatrix4(rotationMatrix4);

//const euler1 = new THREE.Euler(-Math.PI*0.15,0, 0, 'XYZ');
const euler1 = new THREE.Euler(0,0, 0, 'XYZ');
//const euler1 = new THREE.Euler(Math.random()*Math.PI,Math.random()*Math.PI, Math.random()*Math.PI, 'XYZ');
        const rotationMatrix41 = new THREE.Matrix4().makeRotationFromEuler(euler1);
        const rotationMatrix31 = new THREE.Matrix3().setFromMatrix4(rotationMatrix41);


cards = [];
cards.push(new cardObj(scene,2));
cards.push(new cardObj(scene,2));
cards[0].place(new THREE.Vector3(1,2,0),cards[0].meshData.vertexs[6].globalPos);
cards[1].place(new THREE.Vector3(0,1,4),cards[1].meshData.vertexs[6].globalPos);
cards[0].color = 0xff00ff;
cards[1].color = 0x00ff00;
cards[0].vel.set(0,0,0);

cards[0].calcInertia();
  cards[1].vel.set(0,0,-0.03);
cards[1].rotationMatrx.multiply(rotationMatrix3);
cards[0].rotationMatrx.multiply(rotationMatrix31);
//cards[1].angMomentum.set(0.05,0.05,0.05);


player = new playerObj(scene,0.5);
player.place(new THREE.Vector3(-1.5,1,0),player.meshData.vertexs[0].globalPos);

floor = new approxPlane(scene,400);
//floor = new imovable(scene,300);

tick = 0;
window.simulation.state.step  = false;

renderer.render(scene,camera);
renderer.setAnimationLoop(animate);

;//window.simulation.objects = cards.concat([player]).concat([floor]).concat(twoCard(scene,1.5,1.5,new THREE.Vector3(1,0.2,0)));//TODO DEBUGGG
window.simulation.objects = cards.concat([player]).concat([floor]);//.concat(twoCard(scene,1.5,1.5,new THREE.Vector3(1,0.2,0)));//TODO DEBUGGG
//window.simulation.objects = cards.concat([floor]);//TODO DEBUGGG
colisionObj = new collsionResolver(window.simulation.objects);
}



let {scene,renderer,camera,controles,spotLight} = initScene();
initKeyInput();
initDebug(scene);
initRecorder(renderer);
Promise.all([loadCardMdl()]).then(()=>{
  main();
});

function animate(time){

    if(window.simulation.camera.flow){

      camera.position.x = Math.sin(time*0.0005)*5;
      camera.position.z = Math.cos(time*0.0005)*5;
      camera.lookAt(0,0,0);
    }

    controles.update();
    spotLight.position.set(
      camera.position.x+1,
      camera.position.y+1,
      camera.position.z+1
    );

    if(window.simulation.state.simPause && !window.simulation.state.step){
    }else{
      window.simulation.state.step = !window.simulation.state.step;
      let h = 1;
      proccessObjects(window.simulation.objects,h);
    }
    
    renderer.render(scene,camera);
}


function proccessObjects(objArr,h){
  let n = 10;
  let deltaT = h/n;
  player.updateDirVects(camera);
  for(let i = 0;i<n;i++){
  allInitForCycle(objArr);
  allUpdateGlobalPos(objArr);

  allUpdateForce(objArr,deltaT);
  allUpdateTorque(objArr,deltaT);

  allUpdateApplieForce(objArr,deltaT);

  colisionObj.updateArrCollisions();

  allApplyCorrection(objArr,deltaT);

  allUpdatePos(objArr,deltaT);
  allUpdateRotation(objArr,deltaT);  

  allDamp(objArr);
  }
  
  updateDebug(objArr);
  allUpdateThreeJS(objArr);
}



export {scene,animate};