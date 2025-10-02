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

    //TO DO CHEAK
    //sepetaing test failing.... FUCK
    if(obj1.position.clone().sub(obj2.position).dot(collision.normal)){
        collision.normal.multiplyScalar(-1);
    }

    let velp1 = obj1.vel.clone().add(obj1.omega.clone().cross(collision.contact.box1));
    let velp2 = obj2.vel.clone().add(obj2.omega.clone().cross(collision.contact.box2));

    let relativeVel = velp2.clone().sub(velp1);

    let relativeAlongN = relativeVel.dot(collision.normal);

    if(relativeAlongN < 0){
        return {fail:true};
    }

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

    return {fail:false,val:impulse/den};
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



export {solveLinear,transformToCordinate,reConstruct,addOmega,crossMatrix,addMatrx,getImpulse}