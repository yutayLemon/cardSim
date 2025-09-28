import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

function initScene(){
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

return {scene:scene,renderer:renderer,camera:camera,controles:controles};

}
export {initScene}