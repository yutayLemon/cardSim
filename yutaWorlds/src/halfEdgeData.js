import * as THREE from 'three';


class meshFace{
    constructor(normal){
        this.edge = null;//one half edge
        this.normal = normal;
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

//v1->v2
function newEdge(v1,v2){
    let nEdge = new halfEdge();
    nEdge.tipVertex = v2;
    if(!v1.edge){
        v1.edge = nEdge;
    }

    let pEdge = new halfEdge();
    pEdge.tipVertex = v1;
    if(!v2.edge){
        v2.edge = pEdge;
    }

    nEdge.pair = pEdge;
    pEdge.pair = nEdge;

    return nEdge;
}

class vertex{
    constructor(pos){
        this.pos = pos;
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

    queryEdge(from,to){
        for(const edge of this.edges){
            if(edge.tipVertex == from && edge.pair.tipVertex == to){
                //    v1-edge->v2   edge
                //             from
                //    v1<=edge-v2    edge.pair
                //    to 
                return edge.pair;
            }
        }
        return false;
    }
}

class simpleMeshClass{
    constructor(vertex){
        this.vertex = vertex;
        this.face;
    }

    addFace(vertexIndexs,normal){
        this.face.push({vertex:vertexIndexs,normal:normal});
    }
}


function getOtherFace(face,edge){
    if(face == edge.face){
        return edge.pair.face;
    }else{
        return edge.face;
    }
}

function getVexes(vertex){
    let arrV = [];
    let currentV = vertex.edge.tipVertex;
    while(currentV != vertex){
        arrV.push(currentV);
        currentV = currentV.edge.nextEdge.tipVertex;
    }
    return arrV;
}

//simpleMeshClass
function makeMesh(simpleDataMesh){
    let newHMesh = new meshInfo();
    for(const node of simpleDataMesh.vertex){
        newHMesh.vertexs.push(new vertex(node));
    }//add vertexs

    for(const face of simpleDataMesh.faces){
        let newHFace = new meshFace(face.normal);
        newHMesh.faces.push(newHFace);
        let newHEdge;
        let predEdge;
        let startEdge;
        for(let i = 0;i<face.vertexIndexs.length;i++){
            let fromVer = newHMesh.vertexs[i];
            let toVer = newHMesh.vertexs[(i+1)%face.vertexIndexs.length];

            let newHEdge = newHMesh.queryEdge(fromVer,toVer);
            if(!newHEdge){
                newHEdge = newEdge(fromVer,toVer);
                newHMesh.edges.push(newHEdge);
                newHMesh.edges.push(newHEdge.pair);
            }
            newHEdge.face = newHFace;
            fromVer.edge = newHEdge;
            if(!startEdge){
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

    console.log(makeMesh(simpleDataStruct));
}

halfEdgeBoxMesh(5,7,1);