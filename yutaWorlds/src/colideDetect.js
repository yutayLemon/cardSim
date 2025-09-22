import { max } from "three/src/nodes/TSL.js";

function cloideBox2Box(box1,box2){
    let colide = true;;
    let normSet1 = box1.surfaceNormal;
    let normSet2 = box2.surfaceNormal;

    let crossProdNormals = [];
    for(let i = 0;i<normSet1.length;i++){
        crossProdNormals.push(new THREE.Vector3().crossVectors(normSet1[i],normSet2[i]));
    }

    for(const normal of normSet1){
        let result = overlapAlongNormal(box1.vvver,box2,normal);
        if(result  = -1 ){//TODOOO
            colide = false;
        }
    }

    for(const normal of normSet2){
        let result = overlapAlongNormal(box1.vvver,box2,normal);
        if(result  = -1 ){//TODOOO
            colide = false;
        }
    }

    for(const normal of crossProdNormals){
        let result = overlapAlongNormal(box1.vvver,box2,normal);
        if(result  = -1 ){//TODOOO
            colide = false;
        }
    }

    return colide;
}

function overlapAlongNormal(shape1,shape2,unitNormal){
    let int1 = projectShape(shape1,unitNormal);
    let int2 = projectShape(shape2,unitNormal);

    return intervalOverlap(int1,int2);
}

function intervalOverlap(int1,int2){
    let dif1 = int1[1] - int2[0];
    let dif2 = int1[0] - int2[1];
    if((dif1 < 0 && dif2 < 0) || (dif1 > 0 && dif2 > 0)){
        return -1;//no overlap
    }else{////TODOOOOOOOOOOOO
        return min(abs(dif1,dif2));//overlap
    }
}

function projectShape(vert,unit){//projects shape onto unit vector
    if(vert.length == 0){
        return -1;
    }
    let minD = vert[0].dot(unit);
    let maxD = minD;

    for(const node of vert){
        let porjDist = node.dot(unit);
        minD = min(porjDist,minD);
        maxD = max(porjDist,maxD);
    }
    return [minD,maxD];
}
