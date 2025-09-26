import * as THREE from 'three';
import {addDebugPoint} from './debug.js'

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


                console.log(collision.contact.box2.clone()
                ,collision.normal);
        }
    }
}
/*
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
}*/

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
    let box1ContactPoint;//FOR FUCK SAKE  fixx this shit
    let box2ContactPoint;

    for(const normal of normSet1){
        if(normal.lengthSq() < 1e-12){
            continue;
        }
        let result = overlapAlongNormal(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        if(!result.collision.result){
            colide = false;
            return {colide:colide};
        }
        if(minOverLap == undefined || result.collision.val < minOverLap){
            minOverLap = result.collision.val;
            colideClass = 'box1 face box 2 vertex';
            colideNormal = normal;
            box1ContactPoint = normal.clone().multiplyScalar(1);
            box2ContactPoint = normal.clone().multiplyScalar(1);
        }
    }

    for(const normal of normSet2){
        if(normal.lengthSq() < 1e-12){
            continue;
        }
        let result = overlapAlongNormal(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        if(!result.collision.result){
            colide = false;
            return {colide:colide};
        }
        if(minOverLap == undefined || result.collision.val < minOverLap){
            minOverLap = result.collision.val;
            colideClass = 'box2 face box1 vertex';
            colideNormal = normal;
            box1ContactPoint = normal.clone().multiplyScalar(1);
            box2ContactPoint = normal.clone().multiplyScalar(1);
        }
    }

    for(const normal of crossProdNormals){
        if(normal.lengthSq() < 1e-12){
            continue;
        }
        let result = overlapAlongNormal(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        if(!result.collision.result){
            colide = false;
            return {colide:colide};
        }
        if(minOverLap == undefined || result.collision.val < minOverLap){
            minOverLap = result.collision.val;
            colideClass = 'no vertex';
            colideNormal = normal;
            box1ContactPoint = normal.clone().multiplyScalar(1);
            box2ContactPoint = normal.clone().multiplyScalar(1);
        }
    }
    return {colide:colide,class:colideClass,normal:colideNormal,contact:{box1:box1ContactPoint,box2:box2ContactPoint}};
}

/*
//TODO implemnt naivly JUST GET THIS SHIT WORKING FOR FUC SAKE
function vertexFace(vertexObj,faceside){
    contact point for vertexobj = vertexObj.minimal
    contact point faceside = (-faceside.pos)+vertexObj.pos+ContactPOintRelativeVertexObj
}//6 out if the 15 FUCK

function EdgeToEdge(edge1obj,eg2obj){

    edges
    -edge1 ie normal obj
        -maxD connect to next such that perpendicular
    -edge2 ie -normal obj
        -minD coonect ti next perpendictular


    remove normal compaonet from all vertecys
        - creates a line
        - find over lap solution

        ...somehow transform to cordinate system???
                -use original 2 vectors to get cross prod
        y=m1x+b1
        y=m2x+b2
        (m1-m2)x=b2-b2
        x=(b2-b1)/(m1-m2)

        recontruct n1*n1cord+n2*n2cord+normal*0.5peneratrion
        add normal *0.5 penetration

        first one from normal ppinting obj
        contact point other2 = (-other2.pos)+other1.pos+other1.contactpoint relative

    get closests eges 
    project onto plane defined by colidion normal
    set to middle plane thing

    repeat and stuff
}*/

function overlapAlongNormal(shape1,shape2,unitNormal){
    let int1 = projectShape(shape1,unitNormal);
    let int2 = projectShape(shape2,unitNormal);

    return {collision:intervalOverlap(int1.inter,int2.inter),contactInfo:{}};
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

    return {result:overlap,val:val};
}

function projectShape(vert,unit){//projects shape onto unit vector
    if(vert.length == 0){
        return -1;
    }
    let minD;
    let minV;
    let maxD;
    let maxV;

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



export {cloideBox2Box,resolveCollision,updateArrCollisions,resolveCollisionPlane}