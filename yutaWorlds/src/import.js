import * as THREE from 'three';
import { boxObj } from "./boxObj.js";
import { cardObj,playerObj,approxPlane } from "./cardObj.js";
import {applyRotation} from './colideMath.js';



function threeVectToObj(Vect){
    return [Vect.x,Vect.y,Vect.z];
}

function threeMatrix3ToObj(Matrix){
    let res = [];
    for(const elm of Matrix.elements){
        res.push(elm);
    }
    return res;
}

function threeVectArr(arr){
    let res = [];
    for(const item of arr){
        res.push(threeVectToObj(item));
    }
    return res;
}

function exportObjBox(obj){//BOX
    let saveRotEular = new THREE.Euler();
    saveRotEular.setFromRotationMatrix(new THREE.Matrix4().setFromMatrix3(obj.rotationMatrx));
    let saveCorrectionRot = new THREE.Euler();
    saveCorrectionRot.setFromRotationMatrix(new THREE.Matrix4().setFromMatrix3(obj.correctionRotationMatrx));

        let saveData = {
            name:obj.name,

            class:obj.class,
            width:obj.width,
            pos:threeVectToObj(obj.position),
            mass:obj.mass,
            color:obj.color,
            eularRotation:threeVectToObj(saveRotEular),
            eularCorrectionRotationMatrx:threeVectToObj(saveCorrectionRot),
            omega:threeVectToObj(obj.omega),
            vel:threeVectToObj(obj.vel),
            acc:threeVectToObj(obj.acc),
            angMomentum:threeVectToObj(obj.angMomentum),
            scale:obj.scale,
        }

        return saveData;
}

function importBoxObj(scene,saveData){
    let newObj;
    switch(saveData.class){
    case "card":
        newObj = new cardObj(scene,saveData.width);
        break;
    case "player":
        newObj = new playerObj(scene,saveData.width);
        break;
    case "plane":
        newObj = new approxPlane(scene,saveData.width);
        break;
    default:
        newObj = new boxObj(scene,saveData.width,1,1);
        break;
    }

    newObj.name = saveData.name;
    newObj.position.set(saveData.pos[0],saveData.pos[1],saveData.pos[2]);
    newObj.mass = saveData.mass;
    newObj.color = saveData.color;
    newObj.eularRotation.set(saveData.eularRotation[0],saveData.eularRotation[1],saveData.eularRotation[2]);
    newObj.omega.set(saveData.omega[0],saveData.omega[1],saveData.omega[2]);
    newObj.vel.set(saveData.vel[0],saveData.vel[1],saveData.vel[2]);
    newObj.acc.set(saveData.acc[0],saveData.acc[1],saveData.acc[2]);
    newObj.angMomentum.set(saveData.angMomentum[0],saveData.angMomentum[1],saveData.angMomentum[2]);
    newObj.scale = saveData.scale;
    applyRotation(saveData.eularRotation[0],saveData.eularRotation[1],saveData.eularRotation[2],newObj.rotationMatrx);
    applyRotation(saveData.eularCorrectionRotationMatrx[0],saveData.eularCorrectionRotationMatrx[1],saveData.eularCorrectionRotationMatrx[2],newObj.correctionRotationMatrx);

    newObj.calcInertia();
    newObj.updateGlobalPos();

    return newObj;
}

function exportStringify(arr){
    let res = [];
    for(const item of arr){
        res.push(item.exportObj());
    }
    return JSON.stringify(res);
}

function exportAll(arr){
    let str = exportStringify(arr);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = "export.json";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


function importAll(scene,saveDataArr){
    let res = [];
    for(const item of saveDataArr){
        if(item.class == "card"){
            res.push(importBoxObj(scene,item));
        }
    }
    return res;
}

export {exportAll,importBoxObj,exportObjBox,importAll}