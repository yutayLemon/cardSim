import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new THREE.TextureLoader();
const lemcrdMdlURL = "./lemCardModel/model/lemCard2.glb";
const woodTileUrl = './img/woodtile.png';
const woodTexture = loader.load(woodTileUrl);
woodTexture.wrapS = THREE.RepeatWrapping;
woodTexture.wrapT = THREE.RepeatWrapping;
const lenPerTile = 4;
woodTexture.repeat.set(10,10);

let cardMdl;
let cardMdlDim;

function loadCardMdl(){
    return new Promise((resolve,reject)=>{
        const assetLoader = new GLTFLoader();
        assetLoader.load(lemcrdMdlURL,(gltf)=>{
            console.log("lemon card modle loaded");
            cardMdl = gltf.scene;
            let cardBox = new THREE.Box3().setFromObject(gltf.scene);
            cardMdlDim = new THREE.Vector3();
            cardBox.getSize(cardMdlDim);
            resolve(gltf.scene);
        },undefined,(err)=>{
          console.log(err);
          reject(err);
        });
    });
}

function makeCardMdl(width){
    let factor = width/cardMdlDim.x;
    if(cardMdl){
        let newMdl = cardMdl.clone(true);
        console.log(factor);
        newMdl.scale.set(factor,factor,factor);
        return newMdl;
    }else{
        throw new Error("model not loaded yet");
    }
}

function woodPlane(size){
    let repNum = Math.floor(size/lenPerTile);
    if(lenPerTile == 0){
        lenPerTile = 1;
    }
    woodTexture.repeat.set(repNum, repNum);
    const planeMaterial = new THREE.MeshStandardMaterial({ map: woodTexture });
    planeMaterial.side = THREE.DoubleSide;
    const planeGeometry = new THREE.PlaneGeometry(size, size); 
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.set(Math.PI*0.5,Math.PI*0.5,0);
    //rotation gets reset on update
    //but rotation effects intersection
    return plane;
}



export {makeCardMdl,loadCardMdl,woodPlane};