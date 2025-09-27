import * as THREE from 'three';
import {addDebugPoint} from './debug.js'
import { int } from 'three/src/nodes/TSL.js';

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
        let result = overlapAlongNormalVertFace(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        //let result = overlapAlongNormal(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        if(!result.collision.result){
            colide = false;
            return {colide:colide};
        }
            console.log(result.contactInfo);
        if(minOverLap == undefined || result.collision.val < minOverLap){
            minOverLap = result.collision.val;
            colideClass = 'box1 face box 2 vertex';
            colideNormal = normal;
            let contactVes = contactPointVertexFace(box2,box1,result.contactInfo.vert);
            box1ContactPoint = contactVes.face;
            box2ContactPoint = contactVes.vertex;
        }
    }

    for(const normal of normSet2){
        if(normal.lengthSq() < 1e-12){
            continue;
        }
        let result = overlapAlongNormalVertFace(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        //let result = overlapAlongNormal(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        if(!result.collision.result){
            colide = false;
            return {colide:colide};
        }
        if(minOverLap == undefined || result.collision.val < minOverLap){
            minOverLap = result.collision.val;
            colideClass = 'box2 face box1 vertex';
            colideNormal = normal;
            console.log(result.contactInfo);
            let contactVes = contactPointVertexFace(box1,box2,result.contactInfo.vert);

            box1ContactPoint = contactVes.vertex;
            box2ContactPoint = contactVes.face;
        }
    }

    for(let j = 0;j<normSet1.length;j++){
        let norm1 = normSet1[j];
        let norm2 = normSet2[j];
        let normal = norm1.clone().cross(norm2);
        //FUCKING FIGURE OUT SIGN DIR THE FUCK

        if(normal.lengthSq() < 1e-12){
            continue;
        }
        let result = overlapAlongNormalEdgeEdge(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        /*let result = contactPointEdegToEdge(
            {edge:,obj:,srcNormal:},
            {edge:,obj:,srcNormal:},
            normal);*/
        //let result = overlapAlongNormal(box1.verticeArrGlobal,box2.verticeArrGlobal,normal);
        if(!result.collision.result){
            colide = false;
            return {colide:colide};
        }
        if(minOverLap == undefined || result.collision.val < minOverLap){
            let edgesStuff = contactPointEdegToEdge(
            {edge:result.contactInfo.edge1,obj:box1,srcNormal:norm1},
            {edge:result.contactInfo.edge2,obj:box2,srcNormal:norm2},
            normal);


            minOverLap = result.collision.val;
            colideClass = 'no vertex';
            colideNormal = normal;
            box1ContactPoint = edgesStuff.edge1;
            box2ContactPoint = edgesStuff.edge2;
        }
    }
    return {colide:colide,class:colideClass,normal:colideNormal,contact:{box1:box1ContactPoint,box2:box2ContactPoint}};
}

function contactPointVertexFace(vertexObj,faceObj,peneratingVertex){
    //global cordinate input
    //TODO fix gloabl trasfomration

    let vertexContactPoint = peneratingVertex.clone().sub(vertexObj.position);
    let faceConactPoint = peneratingVertex.clone().sub(faceObj.position);

    //relative output
    return {face:faceConactPoint,vertex:vertexContactPoint};
}

function contactPointEdegToEdge(obj1Info,obj2Info,normal){
    //obj1Info .edge    .obj   .srcNormal
    //obj 1 is origin normal is pointing away from
    let n1 = obj1Info.srcNormal;
    let n2 = obj2Info.srcNormal;
    
    let line1 = [];
    line1.push(transformToCordinate(obj1Info.edge[0],n1,n2,normal));
    line1.push(transformToCordinate(obj1Info.edge[1],n1,n2,normal));
    
    let line2 = [];
    line2.push(transformToCordinate(obj2Info.edge[0],n1,n2,normal));
    line2.push(transformToCordinate(obj2Info.edge[1],n1,n2,normal));
    //x:srcNormal1
    //y:srcNormal2

    let globalContactPoints = solveLinear(line1,line2);
    let contP1 = reConstruct(globalContactPoints.contactP1,n1,n2,normal);
    let contP2 = reConstruct(globalContactPoints.contactP2,n1,n2,normal);

    contP1.sub(obj1Info.obj.position);
    contP2.sub(obj2Info.obj.position);

    return {edge1:contP1,edge2:contP2};
}


//transform vect{x,y,z} to vect in cordinate system
//{n1,n2,normal}
//global cords
function transformToCordinate(vect,n1,n2,normal){
    return {x:n1.dot(vect),y:n2.dot(vect),z:normal.dot(vect)};
}

//solve linear equasions in cordinate system
//{n1,n2,normal}
//global cords
function solveLinear(line1,line2){
    let m1 = (line1[0].y-line1[1].y)/(line1[0].x-line1[1].x);
    let m2 = (line2[0].y-line2[1].y)/(line2[0].x-line2[1].x);

    let b1 = line1[0].y-m1*line1[0].x;
    let b2 = line2[0].y-m2*line2[0].x;

    let xCord = (b2-b1)/(m1-m2);

    let yCord = xCord * m1 +b1;

    let zCrod1 = (line1[0].z-line1[1].z)/(line1[0].x-line1[1].x);
    zCrod1 = zCrod1*xCord+line1[0].z;

    let zCrod2 = (line2[0].z-line2[1].z)/(line2[0].x-line2[1].x);
    zCrod2 = zCrod2*xCord+line2[0].z;

    return {contactP1:{x:xCord,y:yCord,z:zCrod1},contactP2:{x:xCord,y:yCord,z:zCrod2}};
    //crod with refrence to obj 1 I think...
}

function reConstruct(vect,n1,n2,normal){
    let res = n1.clone().multiplyScalar(vect.x);
    res.add(n2.clone().multiplyScalar(vect.y));
    res.add(normal.clone().multiplyScalar(vect.z));

    return res;
}

/*
//TODO implemnt naivly JUST GET THIS SHIT WORKING FOR FUC SAKE
function vertexFace(vertexObj,faceside){
        needs:minvertex of interpenetrating
        needs:pos of face side
    contact point for vertexobj = vertexObj.minimal
    contact point faceside = (-faceside.pos)+vertexObj.pos+ContactPOintRelativeVertexObj
}//6 out if the 15 FUCK

function EdgeToEdge(edge1obj,eg2obj){
            needs:closest edegs of both and vertecys of both
            needs:nromal
            needs:srcNormal1,srcNormal2
            needs:pos of both obj
    get inerpenearting vertexys
        -on would be max    next perpendicular
        -one would be min   next perpendicular

    remove normal component:ue project onto plane of nornal
        - plot line

        -use 2 normals used to create plane normal as axis
        - find intersection from equasion
            m1=(y11-y12)/(x11-x12);
            m2=(y21-y22)/(x21-x22);

            b1=y11-m1 x11
            b2=y21-m2 x21

            x=(b2-b1)/(m1-m2)
            x=(y21-m2 x21-y11+m1 x11)/(m1-m2)
            x=(y21-y11 + m1 x11 - m2 x21)/(m1-m2)

            y=m1 x + b1

        reconstrauct 
            vect1 = n1*x+n2*y+normal*0.5 dist 
             contact point other2 = (-other2.pos)+other1.pos+other1.contactpoint relative
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

function findEdgeEnd(start,vertexs,normal){
    for(let i = 0;i<vertexs.length;i++){
        if(start.clone().sub(vertexs[i]).dot(normal) < 1e-12){
            return vertexs[i];
        }
    }
    return "FUCK";
}

function overlapAlongNormalVertFace(shape1,shape2,unitNormal){
    //normal along face of shape1
    let int1 = projectShapeVert(shape1,unitNormal);
    let int2 = projectShapeVert(shape2,unitNormal);

    return {collision:intervalOverlap(int1.inter,int2.inter),contactInfo:{face:shape1,vert:int2.vert[0]}};
}

function overlapAlongNormalEdgeEdge(shape1,shape2,unitNormal){

    //TODO FUCKING FIX EDGE JUMP
    let int1 = projectShapeGetEdges(shape1,unitNormal);
    let int2 = projectShapeGetEdges(shape2,unitNormal);

    if(int1.inter[0] <= int2.inter[1] && int1.inter[1] >= int2.inter[1]){
        return {collision:intervalOverlap(int1.inter,int2.inter),contactInfo:{edge1:int1.edge.min,edge2:int2.edge.max}};
    }
    
    if(int2.inter[0] <= int1.inter[1] && int2.inter[1] >= int1.inter[1]){
        return {collision:intervalOverlap(int1.inter,int2.inter),contactInfo:{edge1:int1.edge.max,edge2:int2.edge.min}};
    }
    return "FUCK";
}


function projectShapeVert(vert,unit){//projects shape onto unit vector
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

function projectShapeGetEdges(vert,unit){//projects shape onto unit vector
    if(vert.length == 0){
        return -1;
    }
    let minD;
    let minV;
    let minVe;
    let maxD;
    let maxV;
    let maxVe;

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