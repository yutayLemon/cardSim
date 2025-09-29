import * as THREE from 'three';
import {addDebugPoint} from './debug.js'
import { int } from 'three/src/nodes/TSL.js';
import {solveLinear,transformToCordinate,reConstruct,getImpulse} from './colideMath.js'


//fuck this shit
//i'm going naive
function distFromPlaneSqu(normal,planePoint,points){
    //assume normal is unit
    let d = normal.dot(planePoint);
    let minSqLen;
    let minV;
    for(const p of points){
        let newSqLen = Math.abs(p.dot(normal)-d);

        if(minSqLen == undefined || newSqLen < minSqLen){
            minSqLen = newSqLen;
            minV = p;
        }
    }

    return p;
}

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
        },
        class:undefined
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


//TODO FUCCCK RELATIVE CONTAT POINT FLIPED
function testFaceToVertex(faceObj,vertexObj,normalSet,minimumInfo){
    let contInfo;
    for(const normal of normalSet){
        if(normal.lengthSq() < 1e-12){
            continue;
        }

        let res1 = testOneFace(faceObj,vertexObj,normal,minimumInfo,faceObj.planeP[0]);
        let res2 = testOneFace(faceObj,vertexObj,normal,minimumInfo,faceObj.planeP[1]);
        if(res1 == 1 || res2 == 1){
            return {colide:false};
        }
        if(res2 == -1){
            contInfo = res1;
        }else{
            contInfo = res2;
        }
    }
    return {colide:true,faceContactP:contInfo.face,vertexContactP:contInfo.vertex};
}

function testOneFace(faceObj,vertexObj,normal,minimumInfo,planePoint){
        let result = overlapAlongNormalVertFace(faceObj,vertexObj,normal,planePoint);
        if(!result.collision.result){
            return 1;
        }
        if(minimumInfo.overlap == undefined || result.collision.val < minimumInfo.overlap){
            minimumInfo.overlap = result.collision.val;
            minimumInfo.class = "face-vertex";
            minimumInfo.collisionNormal = normal;
            //let GcontactPointVertex = distFromPlaneSqu(normal,faceObj.)
            let contactVes = contactPointVertexFace(faceObj,vertexObj,result.contactInfo.vert);
            
            //CHEAK FUCKING CORRECT SIGN
            return contactVes;
        } 
        return -1;
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
                            if (normal.dot(dir) < 0) normal.multiplyScalar(-1);
        if(normal.lengthSq() < 1e-12){
            continue;
        }
        let res = overlapAlongNormalEdgeEdge(box1,box2,normal,box1.planeP[0]);
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

        res = overlapAlongNormalEdgeEdge(box1,box2,normal,box1.planeP[1]);
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

//TODO FUCCCK RELATIVE CONTAT POINT FLIPED
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


function overlapAlongNormalVertFace(shape1,shape2,unitNormal,planePoint){
    
    //normal along face of shape1
    let newNorm = unitNormal.clone();
    if(planePoint.clone().sub(shape2.position).dot(unitNormal) < 0){
        newNorm.multiplyScalar(-1);
    }
    let int1 = projectShapeVert(shape1.verticeArrGlobal,newNorm,planePoint);
    let int2 = projectShapeVert(shape2.verticeArrGlobal,newNorm,planePoint);
    //brekake case to select min or max side

    return {collision:intervalOverlap(int1.inter,int2.inter),contactInfo:{face:shape1,vert:int2.vert[1]}};
}

function overlapAlongNormalEdgeEdge(shape1,shape2,unitNormal,planePoint){
    let newNorm = unitNormal.clone();
    if(planePoint.clone().sub(shape1.position).dot(unitNormal) < 0){
        newNorm.multiplyScalar(-1);
    }
    let int1 = projectShapeVert(shape1.verticeArrGlobal,newNorm,planePoint);
    let int2 = projectShapeVert(shape2.verticeArrGlobal,newNorm,planePoint);
        //TODO add direction resolveer


        //TODO cheak direction
    let edge1Max = [int1.vert[1],findEdgeEnd(int1.vert[1],shape1.verticeArrGlobal,newNorm)];
    let edge2Min = [int2.vert[0],findEdgeEnd(int2.vert[0],shape2.verticeArrGlobal,newNorm)];

    return {collision:intervalOverlap(int1.inter,int2.inter),contactInfo:{edge1:edge1Max,edge2:edge2Min}};
}


function intervalOverlap(int1,int2){
    let dif1 = int1[1] - int2[0];
    let dif2 = int1[0] - int2[1];
    let val = 0;

    if((dif1 < 0 && dif2 < 0) || (dif1 > 0 && dif2 > 0)){
        return {result:false};
    }else{
        val = Math.min(int1[1], int2[1])-Math.max(int1[0], int2[0]);
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


function projectShapeVert(vert,unit,planePoint){//projects shape onto unit vector
    //assume all vertexes on one side of 
    //get closest to stuff
    if(vert.length == 0){
        console.error("err:0 len");
        return -1;
    }
    let minD, minV, maxD, maxV;

    for(const node of vert){
        let porjDist = node.clone().sub(planePoint).dot(unit);
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

export {cloideBox2Box,resolveCollision,updateArrCollisions,resolveCollisionPlane}