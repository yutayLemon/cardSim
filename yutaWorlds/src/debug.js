import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

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

class debugArrow{
    constructor(color,scene){
        this.dir = new THREE.Vector3(0,1,0);
        this.origin = new THREE.Vector3(0,0,0);
        this.len = 1;
        this.color = color;
        this.txt = "testTxt";
        this.THREEArrow = new THREE.ArrowHelper(this.dir,this.origin,this.len,color);
        scene.add(this.THREEArrow);
        const self = this;

        const textGeo = new TextGeometry(self.txt,
        {
            font: window.globalFont,
            depth:1,
            size: 0.2,
            height: 1,
            curveSegments: 12,
            bevelEnabled: false
        });
            const textMet = new THREE.MeshBasicMaterial({color:color});
            const textMesh = new THREE.Mesh(textGeo,textMet);
            //scene.add(textMesh);
            self.THREEText = textMesh;
    }


    updateArrow(origin,dir){
        if(origin){
            this.origin.set(origin.x,origin.y,origin.z);
        }
        if(dir){
            this.dir.set(dir.x,dir.y,dir.z);
        }
        this.THREEArrow.setDirection(this.dir.normalize());
        this.THREEArrow.position.set(this.origin.x,this.origin.y,this.origin.z);
        this.THREEArrow.setLength(this.len);
    }
}
export {updateDebug,initDebug,debugVertex,addDebugPoint,debugP,debugArrow}