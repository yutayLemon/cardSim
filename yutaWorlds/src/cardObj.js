import {boxObj} from './boxObj'
import * as THREE from 'three';
import {state} from './keyInput.js'
import {addDebugPoint} from './debug.js'
import {makeCardMdl,loadCardMdl,woodPlane} from './cardMdl.js'

let g = new THREE.Vector3(0,-0.1,0);

class cardObj extends boxObj{
    constructor(scene,size){
        super(scene,size,1.5,0.04);
        this.name = "card";
        this.class = "card";
        this.geometryClass = "box";

        this.mdlOffset = new THREE.Vector3(0.029,-0.06,0.01);

        this.color = 0xffff00;
        this.mass = 0.6;
        this.loadModel(scene);
        this.calcInertia();
    }

    loadModel(scene){
        this.threeJsObj = makeCardMdl(this.width);
        this.threeJsObj.castShadow = true;
        this.threeJsObj.receiveShadow = true;
        this.addToScene(scene);
    }

    updateBoxDebug(){
        addDebugPoint(this.globalVertex.topRight[0],{r:100,g:0,b:200});
        addDebugPoint(this.globalVertex.topRight[1],{r:100,g:0,b:200});

        addDebugPoint(this.globalVertex.topLeft[0],{r:0,g:100,b:200});
        addDebugPoint(this.globalVertex.topLeft[1],{r:0,g:100,b:200});

        addDebugPoint(this.globalVertex.bottomLeft[0],{r:100,g:50,b:200});
        addDebugPoint(this.globalVertex.bottomLeft[1],{r:100,g:50,b:200});

        addDebugPoint(this.globalVertex.bottomRight[0],{r:0,g:0,b:100});
        addDebugPoint(this.globalVertex.bottomRight[1],{r:0,g:0,b:100});
    }

    updateTorque(){
        this.torque.set(0,0,0);

    }

    updateForce(){
        this.force.set(0,0,0);
        this.force.add(g.multiplyScalar(this.mass));
        //this.force = scaleVect(this.mass,g);
    }
}

class imovable extends boxObj{
    constructor(scene,size){
        super(scene,size,0.5,1);
        this.name = "imovable";
        this.class = "imovable";
        this.geometryClass = "box";
        this.position.set(0,-this.height*0.5,0);

    
        this.color = 0xffff00;
        this.mass = Infinity;
        this.loadModel(scene);
        this.calcInertia();
    }

    updateBoxDebug(){
        addDebugPoint(this.globalVertex.topRight[0],{r:100,g:0,b:200});
        addDebugPoint(this.globalVertex.topRight[1],{r:100,g:0,b:200});

        addDebugPoint(this.globalVertex.topLeft[0],{r:0,g:100,b:200});
        addDebugPoint(this.globalVertex.topLeft[1],{r:0,g:100,b:200});

        addDebugPoint(this.globalVertex.bottomLeft[0],{r:100,g:50,b:200});
        addDebugPoint(this.globalVertex.bottomLeft[1],{r:100,g:50,b:200});

        addDebugPoint(this.globalVertex.bottomRight[0],{r:0,g:0,b:100});
        addDebugPoint(this.globalVertex.bottomRight[1],{r:0,g:0,b:100});
    }
}

class playerObj extends boxObj{
    constructor(scene,size){
        super(scene,size,1,1);
        this.name = "player";
        this.class = "player";
        this.geometryClass = "box";

        this.color = 0xff0000;

        this.fowardVect = new THREE.Vector3(1,0,0);
        this.rightVect = new THREE.Vector3(0,0,1);
        this.upVect = new THREE.Vector3(0,1,0);

        this.loadModel(scene);
    }

    updateDirVects(camera){
        let velFact = 0.05;
        this.fowardVect.x = (camera.position.x/camera.position.length())*(-1)*velFact;
        this.fowardVect.y = 0;
        this.fowardVect.z = camera.position.z/camera.position.length()*(-1)*velFact;

        this.rightVect.x = this.fowardVect.z;
        this.rightVect.y = 0;
        this.rightVect.z = (-1)*this.fowardVect.x;

        this.upVect.set(0,velFact,0);
    }

    updateBoxDebug(){
        addDebugPoint(this.globalVertex.topRight[0],{r:100,g:0,b:200});
        addDebugPoint(this.globalVertex.topRight[1],{r:100,g:0,b:200});

        addDebugPoint(this.globalVertex.topLeft[0],{r:0,g:100,b:200});
        addDebugPoint(this.globalVertex.topLeft[1],{r:0,g:100,b:200});

        addDebugPoint(this.globalVertex.bottomLeft[0],{r:100,g:50,b:200});
        addDebugPoint(this.globalVertex.bottomLeft[1],{r:100,g:50,b:200});

        addDebugPoint(this.globalVertex.bottomRight[0],{r:0,g:0,b:100});
        addDebugPoint(this.globalVertex.bottomRight[1],{r:0,g:0,b:100});
        
        addDebugPoint(new THREE.Vector3(0,2,0),{r:0,g:200,b:200});
        addDebugPoint(this.position.clone().add(new THREE.Vector3(0,1,0)),{r:200,g:0,b:200});
    }
    updateTorque(){
        //TODO add global update
        this.torque.set(0,0,0);
    }

    updateForce(){
        this.force.set(0,0,0);
        this.vel.set(0,0,0);
        let ff = 0.000001;
        
        if(state['KeyW']){
            this.vel.add(this.fowardVect);
        }
        if(state['KeyS']){
            this.vel.sub(this.fowardVect);
        }
        if(state['KeyD']){
            this.vel.sub(this.rightVect);
        }
        if(state['KeyA']){
            this.vel.add(this.rightVect);
        }
        if(state['Space']){
            this.vel.add(this.upVect);
        }
        if(state['ShiftLeft'] || state['ShiftRight']){
            this.vel.sub(this.upVect);
        }
        if(state['KeyZ']){
           // this.angvel.x = 0.1;
        }
        if(state['KeyX']){
           // this.angvel.y = 0.1;
        }
        if(state['KeyC']){
            //this.angvel.z = 0.1;
        }
    }
}

class approxPlane extends boxObj{
    //collsion resolution
    constructor(scene,size){
        super(scene,size,0.005,1);
        this.correctionRotationMatrx.set(
                    1,0,0,
                    0,Math.cos(Math.PI*0.5),-Math.sin(Math.PI*0.5),
                    0,Math.sin(Math.PI*0.5),Math.cos(Math.PI*0.5)
                );
        
        this.class = "plane";
        this.name = "plane";
        this.geometryClass = "plane";
        this.color = 0xffffff;
        this.restitutionFactor = 1;
        this.position.set(0,0,0);
        this.mass = Infinity;

        this.surfaceNormal = [
            new THREE.Vector3(0,1,0)
        ];

        this.calcInertia();
        this.loadModel(scene);

    }
    

    loadModel(scene){
        this.threeJsObj = woodPlane(this.width);
        this.threeJsObj.castShadow = true;
        this.threeJsObj.receiveShadow = true;
        this.addToScene(scene);
    }
}

export {cardObj,playerObj,approxPlane,imovable}