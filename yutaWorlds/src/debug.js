import * as THREE from 'three';

let debugP = [];
let debugObj;

function updateDebug(){
    const flat = new Float32Array(debugP.length * 3);
    const colors = new Float32Array(debugP.length * 3);
    for (let i = 0; i < debugP.length; i++) {
        const p = debugP[i];
        flat.set([p.pos.x, p.pos.y, p.pos.z], i * 3);
        colors.set([p.color.r, p.color.g, p.color.b], i * 3);
    }
    debugObj.geometry.setAttribute('position',new THREE.BufferAttribute(flat,3));
    debugObj.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    debugObj.geometry.attributes.position.needsUpdate = true;


    debugP = [];
}

function initDebug(scene){
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        1,0,0,
        0,1,0,
        0,0,1
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({size: 0.1 ,vertexColors:true});
    debugObj = new THREE.Points(geometry, material);
    scene.add(debugObj);
}

class debugVertex{
    constructor(pos,color){
        this.pos  = pos.clone();
        this.color = color;
    }
}

function addDebugPoint(pos,color){
    let newDebug = new debugVertex(pos,color);
    debugP.push(newDebug);
}

export {updateDebug,initDebug,debugVertex,addDebugPoint,debugP}