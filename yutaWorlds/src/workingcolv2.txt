import * as THREE from 'three';
import {solveLinear,transformToCordinate,reConstruct,getImpulse,applyImpulse,evalCorrectionVal} from './colideMath.js'
import {debugPrintContact,debugPrintEdge} from './debug.js'

//one collsion reolver
//calsses box-box plane-box ...
class objectCollision{
    constructor(){
        this.obj1;
        this.obj2;
        this.class;
        this.contactP1;
        this.contactP2;

        this.normal;
        this.overlap;
    }

    init(obj1,obj2,colClass){
        this.obj1 = obj1;
        this.obj2 = obj2;
        this.class = colClass;
        this.contactP1 = new THREE.Vector3(0,0,0);
        this.contactP2 = new THREE.Vector3(0,0,0);

        this.normal = new THREE.Vector3(0,0,0);
    }
    
    testCollsion(){
        switch (this.class){
            case "box-box":
                break;
            case "box-plane":
                break;
            case "plane-box":
                break;
            default:
                //defult box-box
                break;
        }
    }

    impulseCalc(){
        if(this.class == "box-box"){

        }
    }



    colideBoxPlane(){
        let box;let plane;
        if(this.obj1.class == "plane"){
            box = this.obj2;
            plane = this.obj1;
        }else{
            box = this.obj1;
            plane = this.obj2;
        }
        this.overlap = Infinity;
        let minVer;
        let norm = plane.surfaceNormal[0];
        //plane to box
        //TODO clean up
        for(const node of box.verticeArrGlobal){
            let dist = node.clone().sub(plane.position).dot(norm);
            if(dist < this.overlap){
                this.overlap = dist;
                minVer = node;
            }
        }
        if(this.overlap > 0){
            return false;   
        }
        let planeContP = minVer.clone().sub(plane.position).sub(norm.clone().multiplyScalar(this.overlap));
        let boxContP = minVer.clone().sub(box.position);
        this.normal = norm;
        if(this.obj1.class == "plane"){
            this.contactP1 = planeContP;
            this.contactP2 = boxContP;
        }else{
            this.contactP1 = boxContP;
            this.contactP2 = planeContP;
        }
        return;   
    }

    
}

function updateArrCollisions(arr){
    for(let i = 0;i<arr.length;i++){
        for(let j = 0;j<i;j++){
            arr[i].updateColide(arr[j]);
        }
    }
}

function resolveCollision(obj1,obj2){
        let collision = cloideBox2Box(obj1,obj2);

        if(collision.colide){
            let impulse = getImpulse(obj1,obj2,1,collision);
            if(impulse.fail || isNaN(impulse.val)){
                return;
            }
            applyImpulse(obj1,obj2,collision,impulse.val);
            evalCorrectionVal(obj1,obj2,collision);


            obj1.debugArrows.contact.dir.set(collision.contact.box1.x,collision.contact.box1.y,collision.contact.box1.z);
            obj1.debugArrows.contact.len = 15;
            obj2.debugArrows.contact.len = 15;
            obj2.debugArrows.contact.dir.set(collision.contact.box2.x,collision.contact.box2.y,collision.contact.box2.z);
            obj2.debugArrows.coliNorm.dir.set(collision.normal.x,collision.normal.y,collision.normal.z);
            obj2.debugArrows.coliNorm.len = 20;
        }
    }


    //TODO fix ,set inertia values
function resolveCollisionPlane(plane,obj){
        let collision = colideBoxPlane(plane,obj);
        plane.mass = Infinity;
        plane.vel.set(0,0,0);

        if(collision.colide){
            let impulse = getImpulse(plane,obj,1,collision);
            console.log(collision);
            if(!isNaN(impulse.val) && !impulse.fail){
                applyImpulse(plane,obj,collision,impulse.val);
                evalCorrectionVal(plane,obj,collision);
            }   
        }
        return;
}

function colideBoxPlane(plane,box){
    let minDep = Infinity;
    let minVer;
    let norm = plane.surfaceNormal[0];
    //TODO clean up
    for(const node of box.verticeArrGlobal){
        let dist = plane.position.clone().sub(node).dot(norm);
        dist*= -1;
        if(dist < minDep){
            minDep = dist;
            minVer = node;
        }
    }
    if(minDep > 0){
        return {colide:false};   
    }
    let box1PlaneCont = minVer.clone().sub(plane.position);
    let box2Cont = minVer.clone().sub(box.position);
    return {colide:true,normal:norm,contact:{box1:box1PlaneCont,box2:box2Cont}};    
}

function cloideBox2Box(box1,box2){
    let normSet1 = box1.globalSurfaceNormal;
    let normSet2 = box2.globalSurfaceNormal;

    let minimumInfo = {
        overlap:Infinity,
        collisionNormal:undefined,
        contactPoint:{
            box1:undefined,
            box2:undefined
        },
        class:undefined,
        srcnorm1:undefined,
        srcnorm2:undefined,
        int1:undefined,
        int2:undefined
    };


    let faceVertexTest = testFaceToVertex(box1,box2,normSet1,normSet2,minimumInfo);
    if(!faceVertexTest.colide){
        return {colide:false}
    }

    let edgeEdgeTest = testEdgeToEdge(box1,box2,normSet1,normSet2,minimumInfo);
    if(!edgeEdgeTest.colide){
        return {colide:false}
    }

    //comute contact points
    let box1Cont;
    let box2Cont;
    if(minimumInfo.class == "box1face-vertex"){
        let contactVes = contactPointVertexFace(box1,box2,minimumInfo.int2.vert[0]);
        box1Cont = contactVes.face;
        box2Cont = contactVes.vertex;
    }else if(minimumInfo.class == "box2face-vertex"){
        let contactVes = contactPointVertexFace(box2,box1,minimumInfo.int1.vert[0]);
        box1Cont = contactVes.vertex;
        box2Cont = contactVes.face;
    }else if(minimumInfo.class == "edge-edge"){
        let edge1 = [minimumInfo.int1.vert[1],findEdgeEnd(minimumInfo.int1.vert[1],box1.verticeArrGlobal,minimumInfo.collisionNormal)];
        let edge2 = [minimumInfo.int2.vert[0],findEdgeEnd(minimumInfo.int2.vert[0],box2.verticeArrGlobal,minimumInfo.collisionNormal)];
        //console.log(debugPrintEdge(edge1,"lin1"));
        //console.log(debugPrintEdge(edge2,"lin2"));

        let edgeContact = contactPointEdegToEdge(
                                {obj1:edge1,obj2:edge2},
                                {src1:minimumInfo.srcnorm1,src2:minimumInfo.srcnorm2,norm:minimumInfo.collisionNormal});

        box1Cont = edgeContact.edge1.sub(box1.position);
        box2Cont = edgeContact.edge2.sub(box2.position);
    }else{
        console.log("collsion class could not be found");
    }

    //let txtDebug = debugPrintContact(box1,box2,box1Cont,box2Cont,minimumInfo);
    //console.log(txtDebug);
    return {colide:true,normal:minimumInfo.collisionNormal,contact:{box1:box1Cont,box2:box2Cont},overlap:minimumInfo.overlap};
}

function testFaceToVertex(box1,box2,normalset1,normalset2,minimumInfo){
    for(const normal of normalset1){
        if(normal.lengthSq() < 1e-12){
            continue;
        }

        if(!testOneFace(box1,box2,normal,minimumInfo,"box1")){
            return {colide:false};
        }
    }
    for(const normal of normalset2){
        if(normal.lengthSq() < 1e-12){
            continue;
        }

        if(!testOneFace(box2,box1,normal,minimumInfo,"box2")){
            return {colide:false};
        }
    }
    return {colide:true};
}

function testOneFace(faceObj,vertexObj,normal,minimumInfo,subject){

        let newNorm = normal.clone();
        if(vertexObj.position.clone().sub(faceObj.position).dot(newNorm) < 0){
            newNorm.multiplyScalar(-1);
        }
        let int1 = projectShapeVert(faceObj.verticeArrGlobal,newNorm);
        let int2 = projectShapeVert(vertexObj.verticeArrGlobal,newNorm);
        //brekake case to select min or max side

        let overlapTest = intervalOverlap(int1.inter,int2.inter);
        if(!overlapTest.result){
            return false;
        }
        if(overlapTest.val < minimumInfo.overlap){
            minimumInfo.class = subject+"face-vertex";
            minimumInfo.int1 = int1;
            minimumInfo.int2 = int2;
            minimumInfo.overlap = overlapTest.val;
            minimumInfo.collisionNormal = normal.clone();
            minimumInfo.srcnorm1 = undefined;
            minimumInfo.srcnorm2 = undefined;
        } 
        return true;
}

function testEdgeToEdge(box1,box2,normSet1,normSet2,minimumInfo){
    for(const norm1 of normSet1){
    for(const norm2 of normSet2){
        let normal = new THREE.Vector3().crossVectors(norm2,norm1);
        if(normal.lengthSq() < 1e-12){
            continue;
        }
        normal.normalize();

        if(!testOneEdge(box1,box2,norm1,norm2,normal,minimumInfo)){
            return {colide:false};    
        }
    }
    }
    return {colide:true};
}

function testOneEdge(box1,box2,norm1,norm2,normal,minimumInfo){
    //select correct plane point FUCK
    let newNorm = normal.clone();
    if(box2.position.clone().sub(box1.position).dot(newNorm) < 0){
        newNorm.multiplyScalar(-1);
    }

    let int1 = projectShapeVert(box1.verticeArrGlobal,newNorm);
    let int2 = projectShapeVert(box2.verticeArrGlobal,newNorm);
        
    let collision = intervalOverlap(int1.inter,int2.inter);

    if(!collision.result){
        return false;
    }
    if(collision.val < minimumInfo.overlap){            
        minimumInfo.class = "edge-edge";
        minimumInfo.int1 = int1;
        minimumInfo.int2 = int2;
        minimumInfo.overlap = collision.val;
        minimumInfo.collisionNormal = normal.clone();
        minimumInfo.srcnorm1 = norm1.clone();
        minimumInfo.srcnorm2 = norm2.clone();
    }
    return true;
}

function contactPointVertexFace(faceObj,vertexObj,intersectVertex){
    //face and vertex colide
    //global cordinate input
    let vertexContactPoint = intersectVertex.clone().sub(vertexObj.position);
    let faceConactPoint = intersectVertex.clone().sub(faceObj.position);

    //relative output
    return {face:faceConactPoint,vertex:vertexContactPoint};
}

function contactPointEdegToEdge(edges,normals){
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

    //gloabl
    return {edge1:contP1,edge2:contP2};
}

function intervalOverlap(int1,int2){
    let start = Math.max(int1[0],int2[0]);
    let end = Math.min(int1[1],int2[1]);

    let val = end-start;
    if(val > 0){
        return {result:true,val:val}
    }else{
        return {result:false};
    }
}

function findEdgeEnd(start, vertexs, normal) {
    for (const node of vertexs) {
        let difVect = start.clone().sub(node);

        if (difVect.lengthSq() < 1e-24) continue; // same vector

        let dot = difVect.dot(normal);
        if (Math.abs(dot) < 1e-12) {
            return node; // perpendicular
        }
    }
    return -1;
}

function projectShapeVert(vert,unit){//projects shape onto unit vector
    //assume all vertexes on one side of 
    //get closest to stuff
    if(vert.length == 0){
        console.error("err:0 len");
        return -1;
    }
    let minD = Infinity;
    let minV;
    let maxD = -Infinity; 
    let maxV;

    for(const node of vert){
        let porjDist = node.dot(unit);
        if(minD >= porjDist){
            minD = porjDist;
            minV = node;
        }
        if(maxD <= porjDist){
            maxD = porjDist;
            maxV = node;
        }
    }
    return {inter:[minD,maxD],vert:[minV,maxV]};
}

export {cloideBox2Box,resolveCollision,updateArrCollisions,resolveCollisionPlane}