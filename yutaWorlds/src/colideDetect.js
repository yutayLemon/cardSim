import * as THREE from 'three';
import {addDebugPoint} from './debug.js'
import { int } from 'three/src/nodes/TSL.js';
import {solveLinear,transformToCordinate,reConstruct,getImpulse} from './colideMath.js'

function resolveCollision(obj1,obj2){
    let collision = cloideBox2Box(obj1,obj2);

        if(collision.colide){
            let impulse = getImpulse(obj1,obj2,1,collision);
        if(isNaN(impulse)){
        }else{
                obj1.vel.sub(collision.normal.clone().multiplyScalar(impulse/obj1.mass));
                obj2.vel.add(collision.normal.clone().multiplyScalar(impulse/obj2.mass));

                obj1.omega.sub(collision.contact.box1.clone()
                .cross(collision.normal)
                .applyMatrix3(obj1.inertiaTensorInverse)
                .multiplyScalar(impulse));
                
                obj2.omega.add(collision.contact.box2.clone()
                .cross(collision.normal)
                .applyMatrix3(obj2.inertiaTensorInverse)
                .multiplyScalar(impulse));

                obj1.debugArrows.contact.dir.set(collision.contact.box1.x,collision.contact.box1.y,collision.contact.box1.z);
                obj1.debugArrows.contact.len = 15;
                obj2.debugArrows.contact.len = 15;
                obj2.debugArrows.contact.dir.set(collision.contact.box2.x,collision.contact.box2.y,collision.contact.box2.z);
        }
    }
}

function resolveCollisionPlane(plane,obj){
        let collision = cloideBox2Box(plane,obj);
        if(collision.colide){
                obj.vel.sub(plane.globalSurfaceNormal[2].clone().multiplyScalar(obj.vel.dot(plane.globalSurfaceNormal[2])));
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
    let normSet1 = box1.globalSurfaceNormal;
    let normSet2 = box2.globalSurfaceNormal;

    let minimumInfo = {
        overlap:undefined,
        collisionNormal:undefined,
        contactPoint:{
            box1:undefined,
            box2:undefined
        }
    };

    let result;

    result = testFaceToVertex(box1,box2,normSet1,minimumInfo);
    if(!result.colide){
        return {colide:false}
    }
    minimumInfo.contactPoint.box1 = result.faceContactP ? result.faceContactP : minimumInfo.contactPoint.box1;
    minimumInfo.contactPoint.box2 = result.vertexContactP ? result.vertexContactP : minimumInfo.contactPoint.box2;
    
    result = testFaceToVertex(box2,box1,normSet2,minimumInfo);
    if(!result.colide){
        return {colide:false}
    }
    minimumInfo.contactPoint.box2 = result.faceContactP ? result.faceContactP : minimumInfo.contactPoint.box2;
    minimumInfo.contactPoint.box1 = result.vertexContactP ? result.vertexContactP : minimumInfo.contactPoint.box1;

    result = testEdgeToEdge(box1,box2,normSet1,normSet2,minimumInfo);
    if(!result.colide){
        return {colide:false}
    }
    minimumInfo.contactPoint.box1 = result.contactP1 ? result.contactP1 : minimumInfo.contactPoint.box1;
    minimumInfo.contactPoint.box2 = result.contactP2 ? result.contactP2 : minimumInfo.contactPoint.box2;
    

    
    return {colide:true,normal:minimumInfo.collisionNormal,contact:{box1:minimumInfo.contactPoint.box1,box2:minimumInfo.contactPoint.box2}};
}

function testFaceToVertex(faceObj,vertexObj,normalSet,minimumInfo){
    let contactPointFace;
    let contactPointVertex;
    for(const normal of normalSet){
        if(normal.lengthSq() < 1e-12){
            continue;
        }
        let result = overlapAlongNormalVertFace(faceObj.verticeArrGlobal,vertexObj.verticeArrGlobal,normal);
        if(!result.collision.result){
            return {colide:false};
        }
        if(minimumInfo.minOverLap == undefined || result.collision.val < minimumInfo.minOverLap){
            minimumInfo.minOverLap = result.collision.val;
            minimumInfo.collisionNormal = normal;
            let contactVes = contactPointVertexFace(faceObj,vertexObj,result.contactInfo.vert);

            //CHEAK FUCKING CORRECT SIGN
            contactPointFace = contactVes.face;
            contactPointVertex = contactVes.vertex;
        }
    }
    return {colide:true,faceContactP:contactPointFace,vertexContactP:contactPointVertex};
}

function testEdgeToEdge(box1,box2,normSet1,normSet2,minimumInfo){

    let contactP1;
    let contactP2;
    for(let i = 0;i<normSet1.length;i++){
    for(let j = 0;j<normSet2.length;j++){
        let norm1 = normSet1[i];
        let norm2 = normSet2[j];
        let normal = new THREE.Vector3().crossVectors(norm2,norm1);
        
                            const dir = box1.position.clone().sub(box2.position);
    //console.log(normal);//WHAT THE FUCK
                            if (normal.dot(dir) < 0) normal.negate();

        if(normal.lengthSq() < 1e-12){
            continue;
        }
        let res = overlapAlongNormalEdgeEdge(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        if(!res.collision.result){
            return {colide:false};
        }
        if(minimumInfo.overlap == undefined || res.collision.val < minimumInfo.overlap){
            let edgeContact = contactPointEdegToEdge(
                box1,
                box2,
                {obj1:res.contactInfo.edge1,obj2:res.contactInfo.edge2},
                {src1:norm1,src2:norm2,norm:normal});


            minimumInfo.overlap = res.collision.val;
            //'edege to edeg'
            minimumInfo.collisionNormal = normal;
            contactP1 = edgeContact.edge1;
            contactP2 = edgeContact.edge2;
        }
    }
    }
    return {colide:true,contactP1:contactP1,contactP2:contactP2};
}

function contactPointVertexFace(faceObj,vertexObj,intersectVertex){
    //face and vertex colide
    //global cordinate input
    let vertexContactPoint = intersectVertex.clone().sub(vertexObj.position);
    let faceConactPoint = intersectVertex.clone().sub(faceObj.position);

    //relative output
    return {face:faceConactPoint,vertex:vertexContactPoint};
}

function contactPointEdegToEdge(obj1,obj2,edges,normals){
    //obj1Info .edge    .obj   
    //normals {src1,src2,norm}
    //edges {obj1[minedge,maxedge],obj2[minedge,maxedge]}
    //obj 1 is origin normal is pointing away from
    let n1 = normals.src1;
    let n2 = normals.src2;
    
    let line1 = [];
    line1.push(transformToCordinate(edges.obj1[0],n1,n2,normals.norm));
    line1.push(transformToCordinate(edges.obj1[1],n1,n2,normals.norm));
    
    let line2 = [];
    line2.push(transformToCordinate(edges.obj2[0],n1,n2,normals.norm));
    line2.push(transformToCordinate(edges.obj2[1],n1,n2,normals.norm));
    //x:srcNormal1
    //y:srcNormal2

    let globalContactPoints = solveLinear(line1,line2);
    let contP1 = reConstruct(globalContactPoints.contactP1,n1,n2,normals.norm);
    let contP2 = reConstruct(globalContactPoints.contactP2,n1,n2,normals.norm);

    contP1.sub(obj1.position);
    contP2.sub(obj2.position);

    return {edge1:contP1,edge2:contP2};
}


function overlapAlongNormalVertFace(shape1,shape2,unitNormal){
    //normal along face of shape1
    let int1 = projectShapeVert(shape1,unitNormal);
    let int2 = projectShapeVert(shape2,unitNormal);

    return {collision:intervalOverlap(int1.inter,int2.inter),contactInfo:{face:shape1,vert:int2.vert[0]}};
}

function overlapAlongNormalEdgeEdge(shape1,shape2,unitNormal){
    let int1 = projectShapeGetEdges(shape1,unitNormal);
    let int2 = projectShapeGetEdges(shape2,unitNormal);

    if(int1.inter[0] <= int2.inter[1] && int1.inter[1] >= int2.inter[1]){
        return {collision:intervalOverlap(int1.inter,int2.inter),contactInfo:{edge1:int1.edge.max,edge2:int2.edge.min}};
    }
    
    if(int2.inter[0] <= int1.inter[1] && int2.inter[1] >= int1.inter[1]){
        return {collision:intervalOverlap(int1.inter,int2.inter),contactInfo:{edge1:int1.edge.min,edge2:int2.edge.max}};
    }
    return {collision:intervalOverlap(int1.inter,int2.inter)};
}



function intervalOverlap(int1,int2){
    let dif1 = int1[1] - int2[0];
    let dif2 = int1[0] - int2[1];
    let val = 0;

    if((dif1 < 0 && dif2 < 0) || (dif1 > 0 && dif2 > 0)){
        return {result:false};
    }else{
        val = Math.min(Math.abs(dif1),Math.abs(dif2));
        return {result:true,val:val};
    }
}

function findEdgeEnd(start,vertexs,normal){
    //find node forming start-node edge perpendiclar to normal
    for(let i = 0;i<vertexs.length;i++){
        if(start.clone().sub(vertexs[i]).dot(normal) < 1e-12){
            return vertexs[i];
        }
    }
    return -1;
}


function projectShapeVert(vert,unit){//projects shape onto unit vector
    if(vert.length == 0){
        console.error("err:0 len");
        return -1;
    }
    let minD, minV, minVe, maxD, maxV, maxVe;

    for(const node of vert){
        let porjDist = node.dot(unit);
        if(minD == undefined || minD >= porjDist){
            minD = porjDist;
            minV = node;
        }
        if(maxD == undefined || maxD <= porjDist){
            maxD = porjDist;
            maxV = node;
        }
    }
    return {inter:[minD,maxD],vert:[minV,maxV]};
}

function projectShapeGetEdges(vert,unit){//projects shape onto unit vector
    if(vert.length == 0){
        console.error("err:0 len");
        return -1;
    }
    let minD, minV, minVe, maxD, maxV, maxVe;

    for(let i = 0;i<vert.length;i++){
        let node = vert[i];
        let porjDist = node.dot(unit);
        if(minD == undefined || minD >= porjDist){
            minD = porjDist;
            minV = node;
            minVe = findEdgeEnd(node,vert,unit);
        }
        if(maxD == undefined || maxD <= porjDist){
            maxD = porjDist;
            maxV = node;
            maxVe = findEdgeEnd(node,vert,unit);
        }
    }
    return {inter:[minD,maxD],edge:{min:[minV,minVe],max:[maxV,maxVe]}};
}

export {cloideBox2Box,resolveCollision,updateArrCollisions,resolveCollisionPlane}