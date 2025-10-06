import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

const whiteWallURL = './img/whitewall.png';
const v1BackGround = {
  back:"./img/background/v2/back.png",
  front:"./img/background/v2/front.png",
  right:"./img/background/v2/right.png",
  left:"./img/background/v2/left.png",
  up:"./img/background/v2/up.png",
  down:"./img/background/v2/down.png"
}


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

const cubeTexture = new THREE.CubeTextureLoader();
scene.background = cubeTexture.load([
  v1BackGround.back,
  v1BackGround.front,
  v1BackGround.up,
  v1BackGround.down,
  v1BackGround.right,
  v1BackGround.left
]);

const spotLight = new THREE.SpotLight(0xffffff, 4); // white light, intensity 1
spotLight.position.set(10, 20, 10); // position above and to the side

spotLight.angle = Math.PI / 6; // cone angle
spotLight.penumbra = 0.2;      // softness at edges
spotLight.decay = 2;           // light decay over distance
spotLight.distance = 100;      // how far the light reaches

spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.camera.near = 10;
spotLight.shadow.camera.far = 200;

scene.add(spotLight);


//light
const ambientLight = new THREE.AmbientLight(0xffffff,0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF,0.8);
directionalLight.position.set(1,10,1);
directionalLight.castShadow = true;
scene.add(directionalLight);

const directionalHelp = new THREE.DirectionalLightHelper(directionalLight);
scene.add(directionalHelp);

const hemiLight = new THREE.HemisphereLight( 0xffeeb1, 0x080820, 1 );
scene.add( hemiLight );

const axesHelp = new THREE.AxesHelper(5);
scene.add(axesHelp);

camera.position.set(6,3,0);
camera.lookAt(0,0,0);


//const gridHelp = new THREE.GridHelper(30,120);
//scene.add(gridHelp);

const controles = new OrbitControls(camera,renderer.domElement);

return {scene:scene,renderer:renderer,camera:camera,controles:controles,spotLight:spotLight};

}
export {initScene}