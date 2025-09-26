import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import {cardObj,playerObj,approxPlane} from './cardObj'
import {state,initKeyInput} from './keyInput.js'
import {updateDebug,initDebug,debugVertex,debugP} from './debug.js'
import {cloideBox2Box,resolveCollision,updateArrCollisions} from './colideDetect.js'

const mousePos = new THREE.Vector2();

window.addEventListener("mousemove",(e)=>{
  mousePos.x = (e.clientX/window.innerWidth)*2-1;//normalise between -1,1
  mousePos.y = (e.clientY/window.innerHeight)*2-1;
});


const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth,window.innerHeight);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth/window.innerHeight,
  0.1,
  1000
);

renderer.shadowMap.enabled = true;


//light
const ambientLight = new THREE.AmbientLight(0xffffff,0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF,0.8);
directionalLight.position.set(1,10,1);
directionalLight.castShadow = true;
scene.add(directionalLight);

const directionalHelp = new THREE.DirectionalLightHelper(directionalLight);
scene.add(directionalHelp);


const axesHelp = new THREE.AxesHelper(5);
scene.add(axesHelp);

camera.position.z = 5;
camera.position.x = 1;
camera.position.y = 1;
camera.position.set(-6,3,0);
camera.lookAt(0,0,0);


const gridHelp = new THREE.GridHelper(30,120);
scene.add(gridHelp);

const controles = new OrbitControls(camera,renderer.domElement);



initKeyInput();
initDebug(scene);
//WTF
        const euler = new THREE.Euler(Math.PI*0.25, 0, 0, 'XYZ');
        const rotationMatrix4 = new THREE.Matrix4().makeRotationFromEuler(euler);
        const rotationMatrix3 = new THREE.Matrix3().setFromMatrix4(rotationMatrix4);




var cards = [];
cards.push(new cardObj(scene,2));
cards.push(new cardObj(scene,2));
cards[0].place(new THREE.Vector3(1,3,0),cards[0].vertex.bottomRight[0]);
cards[1].place(new THREE.Vector3(0,2,4),cards[1].vertex.bottomRight[1]);
cards[0].vel.set(0,0,0);
cards[1].vel.set(0,0,-0.03);
cards[1].rotationMatrx.multiply(rotationMatrix3);
cards[1].angMomentum.set(0.05,0.05,0.05);
console.log(cards);

let player = new playerObj(scene,0.5);
player.place(new THREE.Vector3(0,0,0),player.vertex.bottomLeft[0]);

let floor = new approxPlane(scene,10);

let tick = 0;
function animate(time){
    controles.update();
    player.updateDirVects(camera);

    
    //uodates
    for(const card of cards){
        card.update(tick);
    }
    player.update(tick);
    floor.update(tick);

    updateDebug();

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

    let objs = cards.concat([player]).concat([floor]);//TODO DEBUGGG
    updateArrCollisions(objs);//TODO think about placement
    
    renderer.render(scene,camera);
}
window.step = function(){animate();console.log(cards)};

//window.upMom = function(){cards[1].angMomentum.set(0,0.1,0)}

renderer.render(scene,camera);
renderer.setAnimationLoop(animate);