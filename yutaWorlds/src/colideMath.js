import * as THREE from 'three';
//solve linear equasions in cordinate system
//{n1,n2,normal}
//solve n1,n2 intersection and interpolate for z
//global cords
function solveLinear(line1,line2){
    let topt = (line2[1].x-line2[0].x)*(line1[0].y - line2[0].y)-(line2[1].y-line2[0].y)*(line1[0].x - line2[0].x);
    let bottomt = (line2[1].y-line2[0].y)*(line1[1].x-line1[0].x)-(line2[1].x-line2[0].x)*(line1[1].y-line1[0].y);

    let topu = (line1[0].x - line2[0].x)*(line1[1].y-line1[0].y)-(line1[0].y - line2[0].y)*(line1[1].x-line1[0].x);
    let bottomu = (line1[1].y-line1[0].y)*(line2[1].x-line2[0].x) -(line2[1].y-line2[0].y)*(line1[1].x-line1[0].x);
    
    let t = topt/bottomt;
    let u = topu/bottomu;
    let xCord = line1[0].x + (line1[1].x-line1[0].x)*t;
    let yCord = line1[0].y + (line1[1].y-line1[0].y)*t;

    let xRatio1 = t;
    let xRatio2 = u;

    let zCrod1 = line1[0].z + (line1[1].z-line1[0].z)*xRatio1;
    let zCrod2 = line2[0].z + (line2[1].z-line2[0].z)*xRatio2;
    
    return {contactP1:{x:xCord,y:yCord,z:zCrod1},contactP2:{x:xCord,y:yCord,z:zCrod2}};
}

//transform vect{x,y,z} to vect in cordinate system
//{n1,n2,normal}
//global cords
function transformToCordinate(vect,n1,n2,normal){
    return {x:n1.dot(vect),y:n2.dot(vect),z:normal.dot(vect)};
}

function reConstruct(vect,n1,n2,normal){
    let res = n1.clone().multiplyScalar(vect.x);
    res.add(n2.clone().multiplyScalar(vect.y));
    res.add(normal.clone().multiplyScalar(vect.z));

    return res;
}

function addOmega(matrix,omega){
    let h = 1;
    //addMatrx(matrix,crossColm(matrix,omega.clone().multiplyScalar(h)));
    addMatrx(matrix,crossMatrix(omega).multiply(matrix));

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


function getImpulse(obj1,obj2,eFact,collision){//assumed that colidion normal is unit

    collision.normal.normalize();
    if(obj2.position.clone().sub(obj1.position).dot(collision.normal) < 0){
        collision.normal.multiplyScalar(-1);
    }

    let velp1 = obj1.vel.clone().add(new THREE.Vector3().crossVectors(obj1.omega,collision.contact.box1));
    let velp2 = obj2.vel.clone().add(new THREE.Vector3().crossVectors(obj2.omega,collision.contact.box2));

    let relativeVel = velp2.clone().sub(velp1);

    let relativeAlongN = relativeVel.dot(collision.normal);
    // -> <-
    // <- <- neg

    if(relativeAlongN > 0){
        return {fail:true};
    }

    let impulse = collision.normal.dot(relativeVel.clone().multiplyScalar((-1)*(eFact+1)));

    let impInvRcrossR1 = new THREE.Vector3().crossVectors(collision.contact.box1,collision.normal);
    impInvRcrossR1.cross(collision.contact.box1);
    impInvRcrossR1.applyMatrix3(obj1.inertiaTensorInverse);

    let impInvRcrossR2 = new THREE.Vector3().crossVectors(collision.contact.box2,collision.normal);
    impInvRcrossR2.cross(collision.contact.box2);
    impInvRcrossR2.applyMatrix3(obj2.inertiaTensorInverse);

    let den = 0;
    den += 1/obj1.mass;
    den += 1/obj2.mass;

    den += collision.normal.dot(impInvRcrossR1);
    den += collision.normal.dot(impInvRcrossR2);

    return {fail:false,val:impulse/den};
}

function evalCorrectionVal(obj1,obj2,collsion){//time for impulse derives velocity to seperate coligion
    /*
    let velPoint1 = obj1.vel.clone().add(obj1.correction.deltaVel);
    let velPoint2 = obj2.vel.clone().add(obj2.correction.deltaVel);

    let relativeVel = velPoint2.clone().sub(velPoint1);
    let relativeAlongNormal = Math.abs(relativeVel.dot(collsion.normal));

    let resolutionTime = (Math.abs(collsion.overlap) - relativeAlongNormal)/relativeAlongNormal;
    */

    let deltaX1 = collsion.overlap * ((obj2.mass)/(obj1.mass + obj2.mass));
    let deltaX2 = collsion.overlap * ((obj1.mass)/(obj1.mass + obj2.mass));

    let colNormal = collsion.normal;
    if(obj2.position.clone().sub(obj1.position).dot(colNormal) < 0){
        colNormal.multiplyScalar(-1);
    }

    let deltaPos1 = colNormal.multiplyScalar(-deltaX1);
    let deltaPos2 = colNormal.multiplyScalar(deltaX2);

    //TODO account for vel change
    obj1.correction.deltaPos.set(deltaPos1.x,deltaPos1.y,deltaPos1.z);
    obj2.correction.deltaPos.set(deltaPos2.x,deltaPos2.y,deltaPos2.z);


/*
    //impulse based
    let velPoint1 = obj1.vel.clone().add(obj1.correction.deltaVel).add(new THREE.Vector3().crossVectors(obj1.omega,collsion.contact.box1));
    let velPoint2 = obj2.vel.clone().add(obj2.correction.deltaVel).add(new THREE.Vector3().crossVectors(obj2.omega,collsion.contact.box2));

    let relativeVel = velPoint2.clone().sub(velPoint1);
    let relativeAlongNormal = Math.abs(relativeVel.dot(collsion.normal));

    let resolutionTime = (Math.abs(collsion.overlap) - relativeAlongNormal)/relativeAlongNormal;
    //let resolutionTime = (Math.abs(collsion.overlap))/relativeAlongNormal;

    let correctionPos1 = obj1.vel.clone().multiplyScalar(resolutionTime);
    let correctionPos2 = obj2.vel.clone().multiplyScalar(resolutionTime);

    let correctionRotation1 = obj1.omega.clone().add(obj1.correction.deltaOmega).multiplyScalar(resolutionTime);
    let correctionRotation2 = obj2.omega.clone().add(obj1.correction.deltaOmega).multiplyScalar(resolutionTime);

    obj1.correction.deltaPos.set(correctionPos1.x,correctionPos1.y,correctionPos1.z);
    obj2.correction.deltaPos.set(correctionPos2.x,correctionPos2.y,correctionPos2.z);

    obj1.correction.deltaRotation.set(correctionRotation1.x,correctionRotation1.y,correctionRotation1.z);
    obj2.correction.deltaRotation.set(correctionRotation2.x,correctionRotation2.y,correctionRotation2.z);
    */
}

function applyImpulse(obj1,obj2,collision,impulse){
    let obj1Vel = collision.normal.clone().multiplyScalar(-impulse/obj1.mass);
    let obj2Vel = collision.normal.clone().multiplyScalar(impulse/obj2.mass);
    obj1.correction.deltaVel.set(obj1Vel.x,obj1Vel.y,obj1Vel.z);
    obj2.correction.deltaVel.set(obj2Vel.x,obj2Vel.y,obj2Vel.z);

    let deltaOmega1 = new THREE.Vector3().crossVectors(collision.contact.box1,collision.normal);
    deltaOmega1.applyMatrix3(obj1.inertiaTensorInverse)
               .multiplyScalar(-impulse);

    let deltaOmega2 = new THREE.Vector3().crossVectors(collision.contact.box2,collision.normal);
    deltaOmega2.applyMatrix3(obj2.inertiaTensorInverse)
               .multiplyScalar(impulse);

    obj1.correction.deltaOmega.set(deltaOmega1.x,deltaOmega1.y,deltaOmega1.z);
    obj2.correction.deltaOmega.set(deltaOmega2.x,deltaOmega2.y,deltaOmega2.z);
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

export {solveLinear,transformToCordinate,reConstruct,addOmega,crossMatrix,addMatrx,getImpulse,applyImpulse,evalCorrectionVal}