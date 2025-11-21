import * as THREE from 'three';
import {vectorisNaN,debugPrintEdge,debugA} from './debug.js';
import { cross } from 'three/src/nodes/TSL.js';
//solve linear equasions in cordinate system
//{n1,n2,normal}
//solve n1,n2 intersection and interpolate for z
//global cords
function solveLinear(line1,line2){

    vectorisNaN(line1[1]);
    vectorisNaN(line1[0]);

    vectorisNaN(line2[1]);
    vectorisNaN(line2[0]);
    if(line1[0] == line1[1] || line2[0] == line2[1]){
        console.warn("point not line");
        return {cross:false};
    }

    let topt = (line2[1].x-line2[0].x)*(line1[0].y - line2[0].y)-(line2[1].y-line2[0].y)*(line1[0].x - line2[0].x);
    let bottomt = (line2[1].y-line2[0].y)*(line1[1].x-line1[0].x)-(line2[1].x-line2[0].x)*(line1[1].y-line1[0].y);

    let topu = (line1[0].x - line2[0].x)*(line1[1].y-line1[0].y)-(line1[0].y - line2[0].y)*(line1[1].x-line1[0].x);
    let bottomu = (line1[1].y-line1[0].y)*(line2[1].x-line2[0].x) -(line2[1].y-line2[0].y)*(line1[1].x-line1[0].x);
    
    let t = topt/bottomt;
    let u = topu/bottomu;

    if(t == -Infinity){//FIX correctly consider overlaping case
        return {cross:true,contactP1:line1[0],contactP2:line2[1]};
    }
    if(t == Infinity){//FIX correctly consider overlaping case
        return {cross:true,contactP1:line1[1],contactP2:line2[0]};
    }
    
    if((t < 0 || t > 1) || (u < 0 || u > 1)){//out of bounds
        return {cross:false}
    }
    let xCord = line1[0].x + (line1[1].x-line1[0].x)*t;
    let yCord = line1[0].y + (line1[1].y-line1[0].y)*t;

    let xRatio1 = t;
    let xRatio2 = u;

    let zCrod1 = line1[0].z + (line1[1].z-line1[0].z)*xRatio1;
    let zCrod2 = line2[0].z + (line2[1].z-line2[0].z)*xRatio2;
    
    let intersectP1 = {x:xCord,y:yCord,z:zCrod1};
    let intersectP2 = {x:xCord,y:yCord,z:zCrod2};

    vectorisNaN(intersectP1);
    vectorisNaN(intersectP2);

    return {cross:true,contactP1:intersectP1,contactP2:intersectP2};
}

//transform vect{x,y,z} to vect in cordinate system
//{n1,n2,normal}
//global cords
function transformToCordinate(vect,n1,n2,normal){
    vectorisNaN(vect);
    vectorisNaN(n1);
    vectorisNaN(n2);
    vectorisNaN(normal);

    return {x:n1.dot(vect),y:n2.dot(vect),z:normal.dot(vect)};
}

function reConstruct(vect,n1,n2,normal){
    vectorisNaN(vect);
    vectorisNaN(n1);
    vectorisNaN(n2);
    vectorisNaN(normal);
    
    let res = n1.clone().multiplyScalar(vect.x);
    res.add(n2.clone().multiplyScalar(vect.y));
    res.add(normal.clone().multiplyScalar(vect.z));
    vectorisNaN(res);

    return res;
}

function addOmega(matrix,omega,h){
    //let h = 1;
    //addMatrx(matrix,crossColm(matrix,omega.clone().multiplyScalar(h)));
    let newMatrix = crossMatrix(omega).multiplyScalar(h).multiply(matrix);

    //fix to world view
    //let matrixB = crossMatrix(omega).multiplyScalar(h);
    //let matrxiA = new THREE.Matrix3().multiplyMatrices(matrix,matrixB);
    addMatrx(matrix,newMatrix);

    const xCol = new THREE.Vector3();
    const yCol = new THREE.Vector3();
    const zCol = new THREE.Vector3();

    matrix.extractBasis(xCol, yCol, zCol); 
    xCol.normalize();
    //yCol.normalize();
    //zCol.normalize();
    yCol.sub(xCol.clone().multiplyScalar(yCol.dot(xCol))).normalize();
    zCol.crossVectors(xCol,yCol);
    
    matrix.set(
    xCol.x, yCol.x, zCol.x,
    xCol.y, yCol.y, zCol.y,
    xCol.z, yCol.z, zCol.z
  );
}

function addAngVel(matrix,omega,h){
    applyRotation(omega,matrix)

}

function crossMatrix(vect){
  const result = new THREE.Matrix3();
    result.set(
        0,vect.z,vect.y,
        vect.z,0,-vect.x,
        -vect.y,vect.x,0
    );
    return result;
}

function addMatrx(subject,Matrix){
    for(let i = 0;i<3*3;i++){
        subject.elements[i] += Matrix.elements[i];
    }
}

function getRelativeVel(collision,normal){
    let obj1 = collision.obj1;
    let obj2 = collision.obj2;
    if(obj2.position.clone().sub(obj1.position).dot(normal) < 0){
        normal.negate();
    }


    let velPoint1 = obj1.vel.clone().add(obj1.correction.deltaVel).add(new THREE.Vector3().crossVectors(obj1.omega.clone().add(obj1.correction.deltaOmega),collision.contactP1));
    let velPoint2 = obj2.vel.clone().add(obj2.correction.deltaVel).add(new THREE.Vector3().crossVectors(obj2.omega.clone().add(obj2.correction.deltaOmega),collision.contactP2));
    let relativeVel = velPoint2.clone().sub(velPoint1);

    let lenAlongNormal = relativeVel.dot(normal);
    vectorisNaN(relativeVel);

    return {lenAlongNormal:lenAlongNormal,relativeVel:relativeVel};
    //relativeVel - relative VECTOR
    //normalVel - velocity along normal
}

function getRelativeVelPreCollission(collision,normal){
    let obj1 = collision.obj1;
    let obj2 = collision.obj2;
    if(obj2.position.clone().sub(obj1.position).dot(normal) < 0){
        normal.negate();
    }


    let velPoint1 = obj1.vel.clone().add(new THREE.Vector3().crossVectors(obj1.omega.clone(),collision.contactP1));
    let velPoint2 = obj2.vel.clone().add(new THREE.Vector3().crossVectors(obj2.omega.clone(),collision.contactP2));
    let relativeVel = velPoint2.clone().sub(velPoint1);

    let lenAlongNormal = relativeVel.dot(normal);
    vectorisNaN(relativeVel);
    return {lenAlongNormal:lenAlongNormal,relativeVel:relativeVel};
    //relativeVel - relative VECTOR
    //normalVel - velocity along normal
}


//TODO
//Add multi contact point support

//TODO correct normal direction in
//get impulse
//calc impulse

function getImpulse(collision,eFact){//assumed that colidion normal is unit
    let contact1 = collision.contactP1;
    let contact2 = collision.contactP2;
    let obj1 = collision.obj1;
    let obj2 = collision.obj2;
    let normal = collision.normal.clone();
    let {lenAlongNormal,relativeVel} = getRelativeVelPreCollission(collision,normal);
    if(obj2.position.clone().sub(obj1.position).dot(normal) < 0){
        normal.negate();
    }

    if(lenAlongNormal > 0){
        return {fail:true};
    }

    let impulse = normal.dot(relativeVel.clone().multiplyScalar((-1)*(eFact+1)));

    let impInvRcrossR1 = new THREE.Vector3().crossVectors(contact1,normal);
    impInvRcrossR1.cross(contact1);
    impInvRcrossR1.applyMatrix3(obj1.inertiaTensorInverse);

    let impInvRcrossR2 = new THREE.Vector3().crossVectors(contact2,normal);
    impInvRcrossR2.cross(contact2);
    impInvRcrossR2.applyMatrix3(obj2.inertiaTensorInverse);

    let den = 0;
    den += 1/obj1.mass;
    den += 1/obj2.mass;

    den += normal.dot(impInvRcrossR1.add(impInvRcrossR2));
    return {fail:false,val:impulse/den};
}

function evalCorrectionVal(collsion){//time for impulse derives velocity to seperate coligion
    /*
    let velPoint1 = obj1.vel.clone().add(obj1.correction.deltaVel);
    let velPoint2 = obj2.vel.clone().add(obj2.correction.deltaVel);

    let relativeVel = velPoint2.clone().sub(velPoint1);
    let relativeAlongNormal = Math.abs(relativeVel.dot(collsion.normal));

    let resolutionTime = (Math.abs(collsion.overlap) - relativeAlongNormal)/relativeAlongNormal;
    */

    //TDOOO
    let obj1 = collsion.obj1;
    let obj2 = collsion.obj2;
    let normal = collsion.normal.clone();
    
    let {lenAlongNormal,relativeVel} = getRelativeVel(collsion,normal);
    //normal corrected in function
    
    if(obj2.position.clone().sub(obj1.position).dot(normal) < 0){
        normal.negate();
    }
    //let diff = collsion.overlap + Math.abs(relativeAlongNormal);
    //let diff = collsion.overlap;
    let diff = collsion.overlap + lenAlongNormal;
    let deltaX1 = diff * ((obj2.mass)/(obj1.mass + obj2.mass));
    let deltaX2 = diff * ((obj1.mass)/(obj1.mass + obj2.mass));
    if(obj1.mass + obj2.mass == Infinity){
        if(obj2.mass == Infinity){
            deltaX1 = diff;
            deltaX2 = 0;
        }
        if(obj1.mass == Infinity){
            deltaX2 = diff;
            deltaX1 = 0;
        }
    }

    let deltaPos1 = normal.clone().multiplyScalar(-deltaX1);
    let deltaPos2 = normal.clone().multiplyScalar(deltaX2);
    //TODO account for vel change
    
    obj1.correction.deltaPos.add(deltaPos1);
    obj2.correction.deltaPos.add(deltaPos2);
    
    vectorisNaN(obj1.correction.deltaPos);
    vectorisNaN(obj2.correction.deltaPos);
}

function calcCollsionImpulse(collision,impulse){
    let obj1 = collision.obj1;
    let obj2 = collision.obj2;

    let normal = collision.normal.clone();
    if(obj2.position.clone().sub(obj1.position).dot(normal) < 0){
        normal.negate();
    }

    let obj1Vel = normal.clone().multiplyScalar(-impulse/obj1.mass);
    let obj2Vel = normal.clone().multiplyScalar(impulse/obj2.mass);
    obj1.correction.deltaVel.add(obj1Vel);
    obj2.correction.deltaVel.add(obj2Vel);

    let deltaOmega1 = new THREE.Vector3().crossVectors(collision.contactP1,normal);
    deltaOmega1.applyMatrix3(obj1.inertiaTensorInverse)
               .multiplyScalar(-impulse);

    let deltaOmega2 = new THREE.Vector3().crossVectors(collision.contactP2,normal);
    deltaOmega2.applyMatrix3(obj2.inertiaTensorInverse)
               .multiplyScalar(impulse);

    obj1.correction.deltaOmega.add(deltaOmega1);
    obj2.correction.deltaOmega.add(deltaOmega2);

    vectorisNaN(obj1.correction.deltaOmega);
    vectorisNaN(obj2.correction.deltaOmega);

    vectorisNaN(obj1.correction.deltaVel);
    vectorisNaN(obj2.correction.deltaVel);

}

function getFrictionFactor(obj1,obj2){
    let friction = window.simulation.friction[obj1.surfaceMaterial+'ON'+obj2.surfaceMaterial];
    if(friction == undefined){
        friction = window.simulation.friction[obj2.surfaceMaterial+'ON'+obj1.surfaceMaterial];
    } 
    return {static:friction.static,dynamic:friction.dynamic};
}

function calcFrictionImpulse(collision,impulse){
}

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


function applyRotation(rotx,roty,rotz,matrix){
    const euler = new THREE.Euler(rotx,roty,rotz, 'XYZ');
    const rotationMatrix4 = new THREE.Matrix4().makeRotationFromEuler(euler);
    const rotationMatrix3 = new THREE.Matrix3().setFromMatrix4(rotationMatrix4);
    matrix.multiply(rotationMatrix3);
}


//start with face A clip off face B
function clipAnotB(faceA,faceB){//seperate with faceB
    let startEdge = faceA.edge;
    let startP = startEdge.pair.tipVertex;
    let currentEdge = faceA.edge;
    let lastPoint = startEdge.pair.tipVertex;
    let currentPoint;
    let lastVonFace = isPointInConvex(faceB,lastPoint);
    let currentVonFace;
    console.log("startP:",lastPoint);

    let colidePoints = [];
    let str = "";
    do{
        currentPoint = currentEdge.tipVertex;
        currentVonFace = isPointInConvex(faceB,currentPoint);
        vectorisNaN(lastPoint.globalPos);
        vectorisNaN(currentPoint.globalPos);
        if(lastVonFace && currentVonFace){
            str += "a";
            //colidePoints.push(lastPoint.globalPos);
            colidePoints.push(currentPoint.globalPos.clone());
        }else if(!lastVonFace && currentVonFace){
            str += "b";
            let crossLin = getPolygonIntersection(faceB,lastPoint.globalPos,currentPoint.globalPos);
            colidePoints.push(new THREE.Vector3(crossLin.contactP2.x,crossLin.contactP2.y,crossLin.contactP2.z));
            colidePoints.push(currentPoint.globalPos.clone());
            vectorisNaN(crossLin.contactP2);
        }else if(lastVonFace && !currentVonFace){
            str += "c";
            console.log(lastPoint.globalPos,currentPoint.globalPos);
            let crossLin = getPolygonIntersection(faceB,lastPoint.globalPos,currentPoint.globalPos);
            //cover undefined case TODO FUCKER
            colidePoints.push(new THREE.Vector3(crossLin.contactP2.x,crossLin.contactP2.y,crossLin.contactP2.z));
            //colidePoints.push(currentPoint.globalPos);
            vectorisNaN(crossLin.contactP2);
        }

        currentEdge = currentEdge.nextEdge;
        lastVonFace = currentVonFace;
        lastPoint = currentPoint;
        currentVonFace = null;
    }while(startEdge != currentEdge);
    //clip below face step
    //clip points of faceA in faceB
    

    for(const p of colidePoints){
        debugA.add(0xff00ff,p,faceB.globalNormal);
    }
    console.log(str);

    return colidePoints;
}

function getPolygonIntersection(face,v1,v2){
    vectorisNaN(v1);
    vectorisNaN(v2);
    let startEdge = face.edge;
    let currentEdge = face.edge;
    let cordinateBasis = cordinateAlongNormal(face.globalNormal);//cheack normalll...TODO
    let terminate = false;
    do{
        let startV = currentEdge.pair.tipVertex.globalPos;
        let endV = currentEdge.tipVertex.globalPos;
        let res = solveLinear(
            [transformToCordinate(startV,cordinateBasis.n1,cordinateBasis.n2,cordinateBasis.normal),
            transformToCordinate(endV,cordinateBasis.n1,cordinateBasis.n2,cordinateBasis.normal)],
            [transformToCordinate(v1,cordinateBasis.n1,cordinateBasis.n2,cordinateBasis.normal),
            transformToCordinate(v2,cordinateBasis.n1,cordinateBasis.n2,cordinateBasis.normal)]
        );

        if(res.cross){
            res.contactP1 = reConstruct(res.contactP1,cordinateBasis.n1,cordinateBasis.n2,cordinateBasis.normal);
            res.contactP2 = reConstruct(res.contactP2,cordinateBasis.n1,cordinateBasis.n2,cordinateBasis.normal);
            return res;
        }
        currentEdge = currentEdge.nextEdge;
    }while(currentEdge != null && startEdge != currentEdge);
    return {cross:false};
}

function cordinateAlongNormal(normal){//generates one non parralel vector for a basis
    let u1 = normal.clone();
    if(u1.x == 0 && u1.z == 0){
        //(0,y,0)
        //(0,y,1) not pararell
        u1.z++;
    }else{
        u1.y++;
    }

    u1.sub(normal.clone().multiplyScalar(normal.dot(u1)));
    let u2 = new THREE.Vector3().crossVectors(u1,normal);
    u2.normalize();

    return {n1:u1,n2:u2,normal:normal.clone()};
}

function isPointInConvex(face,queryVertex){
    //add binary serch mby
    let facePtoQuery = queryVertex.globalPos.clone().sub(face.edge.tipVertex.globalPos.clone());
    let queryV = queryVertex.globalPos.clone().sub(face.globalNormal.clone().multiplyScalar(facePtoQuery.dot(face.globalNormal)));
    
    let startEdge = face.edge;

    let startV = startEdge.tipVertex;
    let currentEdge = startEdge.nextEdge;
    let currentVertex;
    let endReached = false;
    
    while(currentEdge && !endReached){
        if(currentEdge == startEdge){//runs one more time
            endReached = true;
        }
        currentVertex = currentEdge.tipVertex;
        let startToCurrent = currentVertex.globalPos.clone().sub(startV.globalPos);
        let startToQuery = queryV.clone().sub(startV.globalPos);

        let cross = new THREE.Vector3().crossVectors(startToCurrent,startToQuery);

        let dir = cross.dot(face.globalNormal);

        currentEdge = currentEdge.nextEdge;

        //cheacks if point is on right or left of partition
        if(dir < 0){
            break;
        }
    }

    let boundMax = currentEdge.preEdge.tipVertex;
    let boundMin = currentEdge.preEdge.preEdge.tipVertex;

    let boundMinToMax = boundMax.globalPos.clone().sub(boundMin.globalPos);
    let boundMinToQuery = queryV.clone().sub(boundMin.globalPos);

    let cross = new THREE.Vector3().crossVectors(boundMinToMax,boundMinToQuery);
    let dir = cross.dot(face.globalNormal);

    if(dir==0){
        return boundMinToMax.lengthSq() <= boundMinToQuery.lengthSq();
    }

    if(dir<0){
        return false;
    }else{
        return true;
    }
}


export {clipAnotB,calcFrictionImpulse,applyRotation,solveLinear,transformToCordinate,reConstruct,addOmega,crossMatrix,addMatrx,getImpulse,calcCollsionImpulse,evalCorrectionVal}