import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { color } from 'three/src/nodes/TSL.js';

let debugP = [];
let debugA = [];
let debugObj;

function vectorisNaN(vect){
    if(!vect){
        console.error(vect);
        console.error("vector undefined");
        throw new Error("vector undefined");
        return;
    }
    if(isNaN(vect.x)){
        console.error(vect);
        console.error("x value NaN");
        throw new Error("x value of vector NaN");
    }
    if(isNaN(vect.y)){
        console.error(vect);
        console.error("y value NaN");
        throw new Error("y value of vector NaN");
    }
    if(isNaN(vect.z)){
        console.error(vect);
        console.error("z value NaN");
        throw new Error("z value of vector NaN");
    }
}

function updateDebug(arr){
    updateDebugPoints();
    allUpdateArrow(arr);
}

function allUpdateArrow(arr){
    for(const item of arr){
        item.updateArrows();
        item.updateBoxDebug();
    }
}

function updateDebugPoints(){
    if(window.simulation.debug.points){
    const flat = new Float32Array(debugP.length * 3);
    const colors = new Float32Array(debugP.length * 3);
    for (let i = 0; i < debugP.length; i++) {
        const p = debugP[i];
        flat.set([p.pos.x, p.pos.y, p.pos.z], i * 3);
        colors.set([p.color.r, p.color.g, p.color.b], i * 3);
    }
    debugObj.geometry.setAttribute('position',new THREE.BufferAttribute(flat,3));
    debugObj.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    }
    
    debugObj.visible = window.simulation.debug.points;
    debugObj.geometry.attributes.position.needsUpdate = true;
    
    debugP = [];
}

function deleteDebugPoints(scene){
        scene.remove(debugObj);
        if(debugObj.geometry){
            debugObj.geometry.dispose();
        }
        if(debugObj.material){
            if(Array.isArray(debugObj.material)){
                for(const elm of debugObj.material){
                    elm.dispose();
                }
            }else{
            debugObj.material.dispose();
        }
        }
}

function initDebug(scene){
    debugA = new arrowPool();
    debugP.length = 0;
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

class arrowPool{
    constructor(scene){
        this.arrows = [];
        this.i = 0;
        this.scene = scene;
    }

    init(){
        for(let i = 0;i<this.arrows.length;i++){
            this.arrows[i].THREEArrow.visible = false;
        }
        this.i = 0;
    }

    add(color,origin,dir){
        if(this.index >= this.arrows.length){
            this.arrows.push(new debugArrow(color,this.scene));
        }
        this.arrows[this.index].THREEArrow.visible = true;
        this.arrows[this.index].updateArrow(origin,dir);
        this.index++;
    }
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
            font: window.simulation.globalFont,
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
        if(window.simulation.debug.arrow){
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
        this.THREEArrow.visible = window.simulation.debug.arrow;
    }

    delete(scene){
        scene.remove(this.THREEArrow);
        if(this.THREEArrow.geometry){
            this.THREEArrow.geometry.dispose();
        }
        if(this.THREEArrow.material){
            if(Array.isArray(this.THREEArrow.material)){
                for(const elm of this.THREEArrow.material){
                    elm.dispose();
                }
            }else{
            this.THREEArrow.material.dispose();
        }
        }
    }
}


function debugPrintContact(box1,box2,box1Cont,box2Cont,minimumInfo){
    let str = '';
    str += stringBox(box1,"box1");
    str += stringBox(box2,"box2");

    str += stringCords(box1Cont.clone().add(box1.position),"C","box1");
    str += stringCords(box2Cont.clone().add(box2.position),"C","box2");

    str += "#" + minimumInfo.class+'\n';

    return str;
}

function debugPrintEdge(edge,sub){
    let str = '';
    str += stringCords(edge[0],"e",sub+"1");
    str += stringCords(edge[1],"e",sub+"2");

    str += '(e_{'+sub+'2}.x+(e_{'+sub+'1}.x-e_{'+sub+'2}.x)*t,e_{'+sub+'2}.y+(e_{'+sub+'1}.y-e_{'+sub+'2}.y)*t,e_{'+sub+'2}.z+(e_{'+sub+'1}.z-e_{'+sub+'2}.z)*t)\n';

    return str;
}

function stringBox(box,id){
    let str = '';
    let vertexs = box.verticeArrGlobal;
    for(let i = 0;i<vertexs.length;i++){
        str += stringCords(vertexs[i],'P',id+'i'+i);
    }
    str += stringCords(box.position,"O",id);
    return str;
}
function stringCords(cord,nam,sub){
    return nam+'_{'+sub+'}=('+cord.x+','+cord.z+','+cord.y+')\n';
}



export {arrowPool,vectorisNaN,deleteDebugPoints,updateDebug,initDebug,debugVertex,addDebugPoint,debugP,debugArrow,debugPrintContact,debugPrintEdge}