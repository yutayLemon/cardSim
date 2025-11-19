import * as THREE from 'three';
import {calcFrictionImpulse,solveLinear,transformToCordinate,reConstruct,getImpulse,calcCollsionImpulse,evalCorrectionVal, clipAnotB} from './colideMath.js'
import {vectorisNaN,debugPrintContact,debugPrintEdge} from './debug.js'
import {facesAroundVertex} from './halfEdgeData.js'
import { cross } from 'three/src/nodes/TSL.js';

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
        this.sepFace;

        this.globalCollisionPoints1 = [];
        this.globalCollisionPoints2 = [];

        this.relativeCollisionPoints1 = [];
        this.relativeCollisionPoints2 = [];
    }

    
    resolveCollisionImpulse(obj1,obj2){
        this.init(obj1,obj2,obj1.geometryClass+'-'+obj2.geometryClass);
        let colide = this.testCollsion();//gets global collsion points in array
        //this.update global collsion points
        this.calcRelativeColsionP();
        
        
        if(colide){
            //for each collsion point
            //calculate impulse
            for(let i = 0;i<this.relativeCollisionPoints1.length;i++){
                this.contactP1 = this.relativeCollisionPoints1[i];
                this.contactP2 = this.relativeCollisionPoints2[i];

                let impulse = this.impulseCalc();
                if(impulse.fail || isNaN(impulse.val)){
                    evalCorrectionVal(this);
                    continue;
                }
                calcCollsionImpulse(this,impulse.val);
                //calcFrictionImpulse(this,impulse.val);
                evalCorrectionVal(this);
            }
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
        this.sepFace;

        this.globalCollisionPoints1 = [];
        this.globalCollisionPoints2 = [];

        this.relativeCollisionPoints1 = [];
        this.relativeCollisionPoints2 = [];
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
    
    calcRelativeColsionP(){
        this.relativeCollisionPoints1 = [];
        this.relativeCollisionPoints2 = [];

        for(const point of this.globalCollisionPoints1){
            vectorisNaN(point);
            this.relativeCollisionPoints1.push(point.clone().sub(this.obj1.position));
        }
        for(const point of this.globalCollisionPoints2){
            vectorisNaN(point);
            this.relativeCollisionPoints2.push(point.clone().sub(this.obj2.position));
        }
    }

    impulseCalc(){
        return getImpulse(this,1);
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
        for(const node of box.meshData.vertexs){
            if(node.globalPos.y <= plane.position.y){
                if(node.globalPos.y-plane.position.y < this.overlap){
                    this.overlap = node.globalPos.y-plane.position.y;
                }
                minVer.push(node.globalPos);
                planecolide = true;
            }
        }
        if(!planecolide){
            return false;   
        }
        let contNode = new THREE.Vector3(0,0,0);
        let i = 0;
        for(;i<minVer.length;i++){
            contNode.add(minVer[i]);//fixxxxxx
        }
        contNode.multiplyScalar(1/i);

        this.overlap = Math.abs(this.overlap);
        this.normal = plane.meshData.faces[0].globalNormal;

        vectorisNaN(contNode);
        this.globalCollisionPoints1.push(contNode);//add global contact point
        this.globalCollisionPoints2.push(contNode);//add global contact point
        return true;   
    }


    
    cloideBox2Box(){//TODO cheakc ordering of priotrity
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
    if(this.collsionClass == "box1face-vertex"){
        //clip anti and collsion face
        vectorisNaN(this.int2.vert[0]);
        this.globalCollisionPoints1.push(this.int2.vert[0].clone());
        this.globalCollisionPoints2.push(this.int2.vert[0].clone());
        getAntiface(this.sepFace,this.obj2.meshData);
    }else if(this.collsionClass == "box2face-vertex"){
        vectorisNaN(this.int1.vert[0]);
        this.globalCollisionPoints1.push(this.int1.vert[0].clone());
        this.globalCollisionPoints2.push(this.int1.vert[0].clone());
        getAntiface(this.sepFace,this.obj1.meshData);
    }else if(this.collsionClass == "edge-edge"){
        let edge1 = [this.int1.vert[1],findEdgeEnd(this.int1.vert[1],this.obj1.meshData,this.normal)];
        let edge2 = [this.int2.vert[0],findEdgeEnd(this.int2.vert[0],this.obj2.meshData,this.normal)];
        //console.log(debugPrintEdge(edge1,"lin1"));
        //console.log(debugPrintEdge(edge2,"lin2"));

        let edgeContact = contactPointEdegToEdge({obj1:edge1,obj2:edge2},
                                                 {src1:this.info.srcnorm1,src2:this.info.srcnorm2,norm:this.normal});
        
        
        
        if(edgeContact.cross){
        vectorisNaN(edgeContact.edge1);
        vectorisNaN(edgeContact.edge2);

        this.globalCollisionPoints1.push(edgeContact.edge1.clone());
        this.globalCollisionPoints2.push(edgeContact.edge2.clone());
        }
    }else{
        console.log("collsion class could not be found");
    }
    return true;
    }



    testFaceToVertex(){
        let faceSet1 = this.obj1.meshData.faces;
        let faceSet2 = this.obj2.meshData.faces;
        for(const face of faceSet1){
        if(!this.testOneFace(face,"box1")){
            return false
        }
        }
    for(const face of faceSet2){
        if(!this.testOneFace(face,"box2")){
            return false;
        }
    }
    return true;
    }


    testOneFace(face,subject){
        let normal = face.globalNormal.clone();
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

        let newNorm = normal;
        if(vertexObj.position.clone().sub(faceObj.position).dot(newNorm) < 0){
            newNorm.negate();
        }
        let int1 = projectShapeVert(faceObj.meshData,newNorm);
        let int2 = projectShapeVert(vertexObj.meshData,newNorm);
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
            this.sepFace = face;
            this.normal.set(newNorm.x,newNorm.y,newNorm.z);
        } 
        return true;
    }


    //Cheak point
    testEdgeToEdge(){
        let faceSet1 = this.obj1.meshData.faces;
        let faceSet2 = this.obj2.meshData.faces;
        //len normal1 == normal2
        for(let i = 0;i<faceSet1.length;i++){
        for(let j = 0;j<i;j++){
            let norm1 = faceSet1[i].globalNormal.clone();
            let norm2 = faceSet2[j].globalNormal.clone();
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

    let int1 = projectShapeVert(this.obj1.meshData,newNorm);
    let int2 = projectShapeVert(this.obj2.meshData,newNorm);
        
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

function getAntiface(face,shape2){
    let n1 = face.normal;
    let faces = shape2.faces;

    let minDot = Infinity;
    let antiFace;
    for(const f of faces){
        let dotF = f.normal.dot(n1);
        if(dotF < minDot){
            minDot = dotF;
            antiFace = f;
        }
    }
    console.log(clipAnotB(antiFace,face));

    //clip antiface and face
    //clip antiface with face
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
    if(globalContactPoints.cross){
        let contP1 = reConstruct(globalContactPoints.contactP1,n1,n2,normals.norm);
        let contP2 = reConstruct(globalContactPoints.contactP2,n1,n2,normals.norm);
        vectorisNaN(contP1);
        vectorisNaN(contP2);
        //gloabl
        return {cross:true,edge1:contP1,edge2:contP2};
    }
    return {cross:false};
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


//TODO refactor
function findEdgeEnd(start, mesh, normal) {
    for (const node of mesh.vertexs) {
        let difVect = start.clone().sub(node.globalPos);

        if (difVect.lengthSq() < 1e-24) continue; // same vector

        let dot = difVect.dot(normal);
        if (Math.abs(dot) < 1e-12) {
            return node.globalPos; // perpendicular
        }
    }
    return -1;
}

function projectShapeVert(mesh,unit){//projects shape onto unit vector
    //assume all vertexes on one side of 
    //get closest to stuff
    if(mesh.vertexs.length == 0){
        console.error("err:0 len");
        return -1;
    }
    let minD = Infinity;
    let minV;
    let maxD = -Infinity; 
    let maxV;

    for(const node of mesh.vertexs){
        let porjDist = node.globalPos.dot(unit);
        if(minD >= porjDist){
            minD = porjDist;
            minV = node.globalPos;
        }
        if(maxD <= porjDist){
            maxD = porjDist;
            maxV = node.globalPos;
        }
    }
    return {inter:[minD,maxD],vert:[minV,maxV]};
}

export {collsionResolver}