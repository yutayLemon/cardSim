import * as THREE from 'three';
import {cardObj,playerObj,approxPlane,imovable,cardWidthToHeight,cardWidthToThick} from './cardObj';
import {applyRotation} from "./colideMath.js";

function twoCard(scene,width,height,p){
    let gap = width*0.005;
    //p bottome of mirror axis
    //2*len width of twoCard
    //height - hight of card
    let len = width*0.5;
    let theta = Math.atan(len/height);
    console.log(theta*360*(1/(2*Math.PI)));
    let cardHeight = Math.sqrt(len*len+height*height);
    let cardWidth = cardHeight/cardWidthToHeight;

    let newCard1 = new cardObj(scene,cardWidth);
    applyRotation(-theta,0,0,newCard1.rotationMatrx);
    newCard1.updateGlobalPos();
    newCard1.place(p.clone().add(new THREE.Vector3(0,height,gap)),newCard1.meshData.vertexs[1].globalPos);
    
    
    let newCard2 = new cardObj(scene,cardWidth);
    applyRotation(theta,0,0,newCard2.rotationMatrx);
    newCard2.updateGlobalPos();
    newCard2.place(p.clone().add(new THREE.Vector3(0,height,-gap)),newCard2.meshData.vertexs[0].globalPos);
    
    return [newCard1,newCard2];
}



export {twoCard}