import * as THREE from 'three';

function resolveCollisions(arr){
    for(let i = 0;i<arr.length;i++){
        for(let j = 0;j<i;j++){
            arr[i].updateColide(arr[j]);
        }
    }
}

function cloideBox2Box(box1,box2){
    let colide = true;
    let normSet1 = box1.surfaceNormal;
    let normSet2 = box2.surfaceNormal;

    let crossProdNormals = [];
    for(let i = 0;i<normSet1.length;i++){
        crossProdNormals.push(new THREE.Vector3().crossVectors(normSet1[i],normSet2[i]));
    }

    let minOverLap;
    let colideNormal;
    let colideClass;
    let box1ContactPoint;
    let box2ContactPoint;

    let ZERO = new THREE.Vector3(0,0,0);

    for(const normal of normSet1){
        if(normal.equals(ZERO)){
            continue;
        }
        let result = overlapAlongNormal(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        if(!result.overlap){
            colide = false;
        }
        if(minOverLap == undefined || result.val < minOverLap){
            minOverLap = result.val;
            colideClass = 'box1 face box 2 vertex';
            colideNormal = normal;
            box1ContactPoint = normal.clone().multiplyScalar(result.box1ContactPoint);
            box2ContactPoint = normal.clone().multiplyScalar(result.box2ContactPoint);
        }
    }

    for(const normal of normSet2){
        if(normal.equals(ZERO)){
            continue;
        }
        let result = overlapAlongNormal(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        if(!result.overlap){
            colide = false;
        }
        if(minOverLap == undefined || result.val < minOverLap){
            minOverLap = result.val;
            colideClass = 'box2 face box1 vertex';
            colideNormal = normal;
            box1ContactPoint = normal.clone().multiplyScalar(result.box1ContactPoint);
            box2ContactPoint = normal.clone().multiplyScalar(result.box2ContactPoint);
        }
    }

    for(const normal of crossProdNormals){
        if(normal.equals(ZERO)){
            continue;
        }
        let result = overlapAlongNormal(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        if(!result.overlap){
            colide = false;
        }
        if(minOverLap == undefined || result.val < minOverLap){
            minOverLap = result.val;
            colideClass = 'no vertex';
            colideNormal = normal;
            box1ContactPoint = normal.clone().multiplyScalar(result.box1ContactPoint);
            box2ContactPoint = normal.clone().multiplyScalar(result.box2ContactPoint);
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



export {cloideBox2Box,resolveCollisions}