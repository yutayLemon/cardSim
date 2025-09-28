import * as THREE from 'three';
//solve linear equasions in cordinate system
//{n1,n2,normal}
//solve n1,n2 intersection and interpolate for z
//global cords
function solveLinear(line1,line2){
    let m1 = (line1[0].y-line1[1].y)/(line1[0].x-line1[1].x);
    let m2 = (line2[0].y-line2[1].y)/(line2[0].x-line2[1].x);

    let b1 = line1[0].y-m1*line1[0].x;
    let b2 = line2[0].y-m2*line2[0].x;

    let xCord = (b2-b1)/(m1-m2);

    let yCord = xCord * m1 +b1;

    let xRatio1 = (xCord - line1[0].x)/(line1[1].x-line1[0].x);
    let xRatio2 = (xCord - line2[0].x)/(line2[1].x-line2[0].x);
    //ratio how how far the intersection is

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
    let velp1 = obj1.vel.clone().add(obj1.omega.clone().cross(collision.contact.box1));
    let velp2 = obj2.vel.clone().add(obj2.omega.clone().cross(collision.contact.box2));

    let relativeVel = velp2.clone().sub(velp1);
    let impulse = collision.normal.dot(relativeVel.clone().multiplyScalar((-1)*eFact-1));

    let impInvRcrossR1 = collision.contact.box1.clone();
    impInvRcrossR1.cross(collision.normal);
    impInvRcrossR1.cross(collision.contact.box1);
    impInvRcrossR1.applyMatrix3(obj1.inertiaTensorInverse);

    let impInvRcrossR2 = collision.contact.box2.clone();
    impInvRcrossR2.cross(collision.normal);
    impInvRcrossR2.cross(collision.contact.box2);
    impInvRcrossR2.applyMatrix3(obj2.inertiaTensorInverse);

    let den = 0;
    den += 1/obj1.mass;
    den += 1/obj2.mass;

    den += collision.normal.dot(impInvRcrossR1);
    den += collision.normal.dot(impInvRcrossR2);

    return impulse/den;
}


export {solveLinear,transformToCordinate,reConstruct,addOmega,crossMatrix,addMatrx,getImpulse}