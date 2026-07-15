import * as THREE from 'three';

class meshFace{
    constructor(normal){
        this.edge = null;//one half edge
        this.normal = new THREE.Vector3(normal.x,normal.y,normal.z);
        this.globalNormal = new THREE.Vector3(normal.x,normal.y,normal.z);
    }
}

class halfEdge{
    constructor(){
        this.preEdge = null;//clockwise
        this.nextEdge = null;//anticlockwise
        this.pair = null;
        this.tipVertex = null;//pointing vertex
        this.face = null;//consistant with normal right hand rule
    }
}

class vertex{
    constructor(pos){
        this.pos = new THREE.Vector3(pos.x,pos.y,pos.z);
        this.globalPos = new THREE.Vector3(pos.x,pos.y,pos.z);
        this.edge = null;//edge where vertex is origin
        //one
    }
}

class meshInfo{
    constructor(){
        this.edges = [];
        this.faces = [];
        this.vertexs = [];
    }

    updateGlobal(pos,rMatrix){
        for(const node of this.vertexs){
            node.globalPos.copy(node.pos);
            node.globalPos.applyMatrix3(rMatrix);
            node.globalPos.add(pos);
        }

        for(const aFace of this.faces){
            aFace.globalNormal.copy(aFace.normal);
            aFace.globalNormal.applyMatrix3(rMatrix);
        }
    }

    queryEdge(from,to){
        for(const edge of this.edges){
            if(edge.tipVertex == to && edge.pair.tipVertex == from){
                //    v1-edge->v2   edge
                //             from
                //    v1<=edge-v2    edge.pair
                //    to 
                return edge;
            }
        }
        return false;
    }
}


//v1->v2
function newEdge(v1,v2){
    let nEdge = new halfEdge();
    nEdge.tipVertex = v2;
    if(v1.edge == null){
        v1.edge = nEdge;
    }

    let pEdge = new halfEdge();
    pEdge.tipVertex = v1;
    if(v2.edge == null){
        v2.edge = pEdge;
    }

    nEdge.pair = pEdge;
    pEdge.pair = nEdge;

    return nEdge;
}

class simpleMeshClass{
    constructor(vertex){
        this.vertex = vertex;
        this.face = [];
    }

    addFace(vertexIndexs,normal){
        this.face.push({vertex:vertexIndexs,normal:normal});
    }
}

//simpleMeshClass
function makeMesh(simpleDataMesh){
    //debugger;
    let newHMesh = new meshInfo();
    for(const node of simpleDataMesh.vertex){
        newHMesh.vertexs.push(new vertex(node));
    }//add vertexs

    for(const face of simpleDataMesh.face){
        let newHFace = new meshFace(face.normal);
        newHMesh.faces.push(newHFace);
        let newHEdge;
        let predEdge;
        let startEdge;
        for(let i = 0;i<face.vertex.length;i++){
            newHEdge = undefined;
            let fromVer = newHMesh.vertexs[face.vertex[i]];
            let toVer = newHMesh.vertexs[face.vertex[(i+1)%face.vertex.length]];

            newHEdge = newHMesh.queryEdge(fromVer,toVer);
            if(!newHEdge){
                newHEdge = newEdge(fromVer,toVer);
                newHMesh.edges.push(newHEdge);
                newHMesh.edges.push(newHEdge.pair);
            }
            newHEdge.face = newHFace;
            if(startEdge == undefined){
                startEdge = newHEdge;
            }
            if(predEdge){
                newHEdge.preEdge = predEdge;
                predEdge.nextEdge = newHEdge;
            }
            predEdge = newHEdge;
        }
        startEdge.preEdge = newHEdge;
        newHEdge.nextEdge = startEdge;

        newHFace.edge = newHEdge;
    }

    return newHMesh;
}

function halfEdgeBoxMesh(width,height,thickness){
    let offx = width*0.5;
    let offy = height*0.5;
    let offz = thickness*0.5;
    let simpleDataStruct = new simpleMeshClass([
        new THREE.Vector3(offx,offy,offz),//0
        new THREE.Vector3(offx,offy,-offz),//1
        new THREE.Vector3(offx,-offy,offz),//2
        new THREE.Vector3(offx,-offy,-offz),//3
        new THREE.Vector3(-offx,offy,offz),//4
        new THREE.Vector3(-offx,offy,-offz),//5
        new THREE.Vector3(-offx,-offy,offz),//6
        new THREE.Vector3(-offx,-offy,-offz)//7
    ]);
    simpleDataStruct.addFace([4,0,1,5],new THREE.Vector3(0,1,0));
    simpleDataStruct.addFace([2,6,7,3],new THREE.Vector3(0,-1,0));

    simpleDataStruct.addFace([0,2,3,1],new THREE.Vector3(1,0,0));
    simpleDataStruct.addFace([6,4,5,7],new THREE.Vector3(-1,0,0));

    simpleDataStruct.addFace([2,0,4,6],new THREE.Vector3(0,0,1));
    simpleDataStruct.addFace([7,5,1,3],new THREE.Vector3(0,0,-1));

    return makeMesh(simpleDataStruct);
}

function halfEdgeFlatFace(points){//points in clockwise order, right hand rule
    let newHFace = new meshFace();
    newHFace.normal = new THREE.Vector3(0,1,0);
    newHFace.edge = new halfEdge();

    let oldAntiwiseEdge;
    let oldClockwiseEdge;
    let oldPoint;
    for(let i = 0;i<points.length;i++){
        let point = points[(i+1)%points.length];
        let newP = new vertex(point);
        let newClockwiseEdge = new halfEdge();
        let newAntiwiseEdge = new halfEdge();

        newClockwiseEdge.face = newHFace;
        newAntiwiseEdge.face = newHFace;

        oldAntiwiseEdge.pair = newClockwiseEdge;
        newClockwiseEdge.pair = oldAntiwiseEdge;

        oldAntiwiseEdge.nextEdge = newAntiwiseEdge;
        oldClockwiseEdge.nextEdge = newClockwiseEdge;

        newAntiwiseEdge.preEdge = oldAntiwiseEdge;
        newClockwiseEdge.preEdge = oldClockwiseEdge;

        oldAntiwiseEdge.tipVertex = newP;
        newClockwiseEdge.tipVertex = oldPoint;

        newP.edge = newAntiwiseEdge;

        oldPoint = newP;
        oldAntiwiseEdge = newAntiwiseEdge;
        oldClockwiseEdge = newClockwiseEdge;
    }
    return newHFace;
}

function planeMesh(pos,normal){
    let newPlaneMesh = new meshInfo();
    newPlaneMesh.faces.push(new meshFace(normal));
    newPlaneMesh.vertexs.push(new vertex(pos));

    return newPlaneMesh;
}

function facesAroundVertex(vertex){
    let res = [];
    let startEdge = vertex.edge;
    let currentEdge = vertex.edge;

    do{
        res.push(currentEdge.face);
        currentEdge = currentEdge.pair.nextEdge;
    }while(currentEdge != null && currentEdge != startEdge);
    
    return res;
}

export {halfEdgeBoxMesh,planeMesh,facesAroundVertex}