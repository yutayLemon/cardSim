import * as THREE from 'three';

let debugP = [];
let debugObj;

function updateDebug(){
    let flat = [];
    let colors = [];
    for(const point of debugP){
        flat.push(point.pos.x);
        flat.push(point.pos.y);
        flat.push(point.pos.z);

        colors.push(point.color.r);
        colors.push(point.color.g);
        colors.push(point.color.b);
    }
    debugObj.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(flat),3));
    debugObj.geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(colors),3));
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

    const material = new THREE.PointsMaterial({ color: 0xff0000, size: 0.1 });
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

export {updateDebug,initDebug,debugVertex,addDebugPoint}