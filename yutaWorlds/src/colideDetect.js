import * as THREE from 'three';
import {calcFrictionImpulse,solveLinear,transformToCordinate,reConstruct,getImpulse,calcCollsionImpulse,evalCorrectionVal} from './colideMath.js'
import {debugPrintContact,debugPrintEdge} from './debug.js'

//one collsion reolver
//calsses box-box plane-box ...
class collsionResolver{
    constructor(arr){
        this.obj1;
        this.obj2;
        this.class;
        this.contactP1;
        this.contactP2;
        this.normal;
        this.overlap;
        this.collsionClass;
        this.int1;
        this.int2;
        this.info;
        this.objects = arr;
    }

    
    resolveCollisionImpulse(obj1,obj2){
        this.init(obj1,obj2,obj1.geometryClass+'-'+obj2.geometryClass);
        let colide = this.testCollsion();
        if(colide){
        
            let impulse = this.impulseCalc();
            if(impulse.fail || isNaN(impulse.val)){
                evalCorrectionVal(this);
                return;
            }
            calcCollsionImpulse(this,impulse.val);
            //calcFrictionImpulse(this,impulse.val);
            evalCorrectionVal(this);
        }
    }

    init(obj1,obj2,colClass){
        this.obj1 = obj1;
        this.obj2 = obj2;
        this.class = colClass;
        this.contactP1 = new THREE.Vector3(0,0,0);
        this.contactP2 = new THREE.Vector3(0,0,0);

        this.normal = new THREE.Vector3(0,0,0);

        this.overlap = Infinity;
        this.collsionClass = "null";

        this.int1 = undefined;
        this.int2 = undefined;

        this.info = {};
    }
    
    testCollsion(){
        switch (this.class){
            case "box-box":
                return this.cloideBox2Box();
            case "box-plane":
                return this.colideBoxPlane();
            case "plane-box":
                return this.colideBoxPlane();
            default:
                return -1;
        }
    }

    updateArrCollisions(){
    for(let i = 0;i<this.objects.length;i++){
        for(let j = i;j<this.objects.length;j++){
            if(i!=j){
                this.resolveCollisionImpulse(this.objects[i],this.objects[j]);
            }
        }
    }
    }

    impulseCalc(){
        return getImpulse(this,1);
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
        let minVer = [];
        
        let planecolide = false;
        for(const node of box.verticeArrGlobal){
            if(node.y <= plane.position.y){
                if(node.y-plane.position.y < this.overlap){
                    this.overlap = node.y-plane.position.y;
                }
                minVer.push(node);
                planecolide = true;
            }
        }
        if(!planecolide){
            return false;   
        }
        let contNode = new THREE.Vector3(0,0,0);
        let i = 0;
        for(;i<minVer.length;i++){
            contNode.add(minVer[i]);
        }
        contNode.multiplyScalar(1/i);
        this.overlap = Math.abs(this.overlap);
        let planeContP = new THREE.Vector3(0,0,0);
        let boxContP = contNode.clone().sub(box.position);
        this.normal = plane.globalSurfaceNormal[0];
        if(this.obj1.class == "plane"){
            this.contactP1 = planeContP;
            this.contactP2 = boxContP;
        }else{
            this.contactP1 = boxContP;
            this.contactP2 = planeContP;
        }

        return true;   
    }


    
    cloideBox2Box(){
    this.overlap = Infinity;
    this.collsionClass;

    let edgeEdgeTest = this.testEdgeToEdge();
    if(!edgeEdgeTest){
        return false;
    }

    let faceVertexTest = this.testFaceToVertex();
    if(!faceVertexTest){
        return false;
    }

    //comute contact points
    let box1Cont;
    let box2Cont;
    if(this.collsionClass == "box1face-vertex"){
        let contactVes = contactPointVertexFace(this.obj1,this.obj2,this.int2.vert[0]);
        box1Cont = contactVes.face;
        box2Cont = contactVes.vertex;
    }else if(this.collsionClass == "box2face-vertex"){
        let contactVes = contactPointVertexFace(this.obj2,this.obj1,this.int1.vert[0]);
        box1Cont = contactVes.vertex;
        box2Cont = contactVes.face;
    }else if(this.collsionClass == "edge-edge"){
        let edge1 = [this.int1.vert[1],findEdgeEnd(this.int1.vert[1],this.obj1.verticeArrGlobal,this.normal)];
        let edge2 = [this.int2.vert[0],findEdgeEnd(this.int2.vert[0],this.obj2.verticeArrGlobal,this.normal)];
        //console.log(debugPrintEdge(edge1,"lin1"));
        //console.log(debugPrintEdge(edge2,"lin2"));

        let edgeContact = contactPointEdegToEdge(
                                {obj1:edge1,obj2:edge2},
                                {src1:this.info.srcnorm1,src2:this.info.srcnorm2,norm:this.normal});

        box1Cont = edgeContact.edge1.sub(this.obj1.position);
        box2Cont = edgeContact.edge2.sub(this.obj2.position);
    }else{
        console.log("collsion class could not be found");
    }

    this.contactP1 = box1Cont;
    this.contactP2 = box2Cont;
    
    return true;
    }



    testFaceToVertex(){
        let normalset1 = this.obj1.globalSurfaceNormal;
        let normalset2 = this.obj2.globalSurfaceNormal;
        for(const normal of normalset1){
            if(normal.lengthSq() < 1e-12){
                continue;
            }

        if(!this.testOneFace(normal,"box1")){
            return false
        }
        }
    for(const normal of normalset2){
        if(normal.lengthSq() < 1e-12){
            continue;
        }

        if(!this.testOneFace(normal,"box2")){
            return false;
        }
    }
    return true;
    }


    testOneFace(normal,subject){
        let faceObj;
        let vertexObj;
        if(subject == "box1"){
            faceObj = this.obj1;
            vertexObj = this.obj2;
        }else if(subject == "box2"){
            faceObj = this.obj2;
            vertexObj = this.obj1;
        }else{

        }

        let newNorm = normal.clone();
        if(vertexObj.position.clone().sub(faceObj.position).dot(newNorm) < 0){
            newNorm.negate();
        }
        let int1 = projectShapeVert(faceObj.verticeArrGlobal,newNorm);
        let int2 = projectShapeVert(vertexObj.verticeArrGlobal,newNorm);
        //brekake case to select min or max side

        let overlapTest = intervalOverlap(int1.inter,int2.inter);
        if(!overlapTest.result){
            return false;
        }
        if(overlapTest.val < this.overlap){
            this.collsionClass = subject+"face-vertex";
            this.int1 = int1;
            this.int2 = int2;
            this.overlap = overlapTest.val;
            this.normal.set(newNorm.x,newNorm.y,newNorm.z);
        } 
        return true;
    }


    //Cheak point
    testEdgeToEdge(){
        let normSet1 = this.obj1.globalSurfaceNormal;
        let normSet2 = this.obj2.globalSurfaceNormal;
        //len normal1 == normal2
        for(let i = 0;i<normSet1.length;i++){
        for(let j = 0;j<i;j++){
            let norm1 = normSet1[i];
            let norm2 = normSet2[j];
            let normal = new THREE.Vector3().crossVectors(norm2,norm1);
            if(normal.lengthSq() < 1e-12){
                continue;
            }
            normal.normalize();

            if(!this.testOneEdge(norm1,norm2,normal)){
                return false  
            }
        }
        }
    return true;
    }

    testOneEdge(norm1,norm2,normal){
    let newNorm = normal.clone();
    if(this.obj2.position.clone().sub(this.obj1.position).dot(newNorm) < 0){
        newNorm.negate();
    }

    let int1 = projectShapeVert(this.obj1.verticeArrGlobal,newNorm);
    let int2 = projectShapeVert(this.obj2.verticeArrGlobal,newNorm);
        
    let collision = intervalOverlap(int1.inter,int2.inter);

    if(!collision.result){
        return false;
    }
    if(collision.val <= this.overlap){            
        this.collsionClass = "edge-edge";
        this.int1 = int1;
        this.int2 = int2;
        this.overlap = collision.val;
        this.normal.set(newNorm.x,newNorm.y,newNorm.z);
        
        this.info.srcnorm1 = norm1.clone();
        this.info.srcnorm2 = norm2.clone();
    }
    return true;
    }
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

export {collsionResolver}