import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
const loader = new FontLoader();


function loadFont(){
    return new Promise((resolve,reject)=>{
        loader.load('./public/helvetiker_regular.typeface.json',function(font){
            console.log('font loaded...');
            window.globalFont = font;
            resolve(font);
        });
    });
}


export {loadFont};