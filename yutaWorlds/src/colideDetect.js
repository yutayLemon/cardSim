import * as THREE from 'three';
import {addDebugPoint} from './debug.js'

function resolveCollision(obj1,obj2){
    let collision = cloideBox2Box(obj1,obj2);
        if(collision.colide){
            let relativeVel = obj1.vel.dot(collision.normal) - obj2.vel.dot(collision.normal);
            let impulse = relativeVel*(obj1.restitutionFactor+1)*(-1);
            impulse /= 1/obj1.mass+1/obj2.mass;
        if(isNaN(impulse)){
        }else{
                obj1.vel.add(collision.normal.clone().multiplyScalar(impulse/obj1.mass));
                obj2.vel.sub(collision.normal.clone().multiplyScalar(impulse/obj2.mass));
        }
    }
}

function resolveCollisionPlane(plane,obj){
        let collision = cloideBox2Box(plane,obj);
        if(collision.colide){
            let relativeVel = obj.vel.dot(collision.normal);
            let impulse = relativeVel*(obj.restitutionFactor+1)*(-1);
            impulse /= 1/obj.mass;
        if(isNaN(impulse)){
        }else{
                obj.vel.add(collision.normal.clone().multiplyScalar(impulse/obj.mass));
        }
    }

}


function updateArrCollisions(arr){
    for(let i = 0;i<arr.length;i++){
        for(let j = 0;j<i;j++){
            arr[i].updateColide(arr[j]);
        }
    }
}

function cloideBox2Box(box1,box2){
    let colide = true;
    let normSet1 = box1.globalSurfaceNormal;
    let normSet2 = box2.globalSurfaceNormal;

    let crossProdNormals = [];

    for(const n1 of normSet1){
        for(const n2 of normSet2){
            if(!n1.equals(n2)){
                let newCross = new THREE.Vector3().crossVectors(n1,n2);
                newCross.normalize();
                crossProdNormals.push(newCross);
            }
        }
    }

    let minOverLap;
    let colideNormal;
    let colideClass;
    let box1ContactPoint;
    let box2ContactPoint;

    let ZERO = new THREE.Vector3(0,0,0);

    for(const normal of normSet1){
        if(normal.lengthSq() < 1e-12){
            continue;
        }
        let result = overlapAlongNormal(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        if(!result.overlap){
            colide = false;
            return {colide:colide};
        }
        if(minOverLap == undefined || result.val < minOverLap){
            minOverLap = result.val;
            colideClass = 'box1 face box 2 vertex';
            colideNormal = normal;
            box1ContactPoint = normal.clone().multiplyScalar(result.lenBox12P);
            box2ContactPoint = normal.clone().multiplyScalar(result.lenBox22P);
        }
    }

    for(const normal of normSet2){
        if(normal.lengthSq() < 1e-12){
            continue;
        }
        let result = overlapAlongNormal(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        if(!result.overlap){
            colide = false;
            return {colide:colide};
        }
        if(minOverLap == undefined || result.val < minOverLap){
            minOverLap = result.val;
            colideClass = 'box2 face box1 vertex';
            colideNormal = normal;
            box1ContactPoint = normal.clone().multiplyScalar(result.lenBox12P);
            box2ContactPoint = normal.clone().multiplyScalar(result.lenBox22P);
        }
    }

    for(const normal of crossProdNormals){
        if(normal.lengthSq() < 1e-12){
            continue;
        }
        let result = overlapAlongNormal(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        if(!result.overlap){
            colide = false;
            return {colide:colide};
        }
        if(minOverLap == undefined || result.val < minOverLap){
            minOverLap = result.val;
            colideClass = 'no vertex';
            colideNormal = normal;
            box1ContactPoint = normal.clone().multiplyScalar(result.lenBox12P);
            box2ContactPoint = normal.clone().multiplyScalar(result.lenBox22P);
        }
    }
    return {colide:colide,class:colideClass,normal:colideNormal,contact:{box1:box1ContactPoint,box2:box2ContactPoint}};
}

function overlapAlongNormal(shape1,shape2,unitNormal){
    let int1 = projectShape(shape1,unitNormal);
    let int2 = projectShape(shape2,unitNormal);

    return intervalOverlap(int1,int2);
}

function intervalOverlap(int1,int2){
    let dif1 = int1[1] - int2[0];
    let dif2 = int1[0] - int2[1];
    let overlap;
    let val = 0;

    if((dif1 < 0 && dif2 < 0) || (dif1 > 0 && dif2 > 0)){
        overlap = false;
    }else{
        overlap = true;
        val = Math.min(Math.abs(dif1),Math.abs(dif2));
    }

    return {overlap:overlap,val:val,lenBox12P:int1[1]-int1[0],lenBox22P:int2[0]-int2[1]};
}

function projectShape(vert,unit){//projects shape onto unit vector
    if(vert.length == 0){
        return -1;
    }
    let minD = vert[0].dot(unit);
    let maxD = minD;

    for(const node of vert){
        let porjDist = node.dot(unit);
        minD = Math.min(porjDist,minD);
        maxD = Math.max(porjDist,maxD);
    }
    return [minD,maxD];
}



export {cloideBox2Box,resolveCollision,updateArrCollisions,resolveCollisionPlane}