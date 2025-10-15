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
}

function getFrictionFactor(obj1,obj2){
    let friction = window.simulation.friction[obj1.surfaceMaterial+'ON'+obj2.surfaceMaterial];
    if(friction == undefined){
        friction = window.simulation.friction[obj2.surfaceMaterial+'ON'+obj1.surfaceMaterial];
    } 
    return {static:friction.static,dynamic:friction.dynamic};
}

function calcFrictionImpulse(collision,impulse){
    let obj1 = collision.obj1;
    let obj2 = collision.obj2;
    let normal = collision.normal.clone();
    if(obj2.position.clone().sub(obj1.position).dot(normal) < 0){
        normal.negate();
    }
    let {lenAlongNormal,relativeVel} = getRelativeVel(collision,normal);
    //nromal corrected in relative vel


    if(obj2.position.clone().sub(obj1.position).dot(normal) < 0){
        normal.negate();
    }
    
    let tangent = relativeVel.clone();
    tangent.sub(normal.clone().multiplyScalar(relativeVel.dot(normal)));
    if(tangent.lengthSq() == 0){
        return;
    }
    tangent.normalize();

    let frictionConstants = getFrictionFactor(collision.obj1,collision.obj2);
    let staticImpulse = frictionConstants.static*Math.abs(impulse)*1.5;
    let dynamicImpulse = frictionConstants.dynamic*Math.abs(impulse)*1.5;

    let frictionImpulse1;
    let frictionImpulse2;
    if(obj1.mass*relativeVel.dot(tangent) <= staticImpulse){
        frictionImpulse1 = tangent.clone();
        frictionImpulse1.multiplyScalar(-1*obj1.mass*relativeVel.dot(tangent));
    }else{
        frictionImpulse1 = tangent.clone();
        frictionImpulse1.multiplyScalar(-1*dynamicImpulse);
    }

    if(obj2.mass*relativeVel.dot(tangent) <= staticImpulse){
        frictionImpulse2 = tangent.clone();
        frictionImpulse2.multiplyScalar(-1*obj2.mass*relativeVel.dot(tangent));
    }else{
        frictionImpulse2 = tangent.clone();
        frictionImpulse2.multiplyScalar(-1*dynamicImpulse);
    }

    obj1.correction.deltaVel.sub(frictionImpulse1.clone().multiplyScalar(1/obj1.mass));
    obj2.correction.deltaVel.sub(frictionImpulse2.clone().multiplyScalar(1/obj2.mass));

    let delatOmega1 = new THREE.Vector3().crossVectors(collision.contactP1,normal);
    delatOmega1.applyMatrix3(obj1.inertiaTensorInverse)
               .multiplyScalar(frictionImpulse1.dot(tangent));

    let delatOmega2 = new THREE.Vector3().crossVectors(collision.contactP2,normal);
    delatOmega2.applyMatrix3(obj2.inertiaTensorInverse)
               .multiplyScalar(frictionImpulse2.dot(tangent));
    
    //obj1.correction.deltaOmega.sub(delatOmega1);
    //obj2.correction.deltaOmega.sub(delatOmega2);
    return;
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



export {calcFrictionImpulse,applyRotation,solveLinear,transformToCordinate,reConstruct,addOmega,crossMatrix,addMatrx,getImpulse,calcCollsionImpulse,evalCorrectionVal}