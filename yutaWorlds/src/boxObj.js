import * as THREE from 'three';
import {addDebugPoint,updateDebug,debugArrow} from './debug.js'
import {resolveCollision} from './colideDetect.js'
import {addOmega} from './colideMath.js';

class boxObj{
    constructor(scene,size,cardRatio,thickRatio){
        this.width = size;
        this.cardRatio = cardRatio;
        this.thickRatio = thickRatio;

        this.height = this.width * this.cardRatio;
        this.thickness = this.width * this.thickRatio;

        this.position = new THREE.Vector3(0,0,0);


        this.mass = 1;

        this.color = 0x000000;

        this.torque = new THREE.Vector3(0,0,0);
        this.force = new THREE.Vector3(0,0,0);

        this.eularRotation = new THREE.Euler(0,0,0);
        this.rotationMatrx = new THREE.Matrix3(
            1,0,0,
            0,1,0,
            0,0,1
        );
        this.correctionRotationMatrx = new THREE.Matrix3(
            1,0,0,
            0,1,0,
            0,0,1
        );

        this.omega = new THREE.Vector3(0,0,0);
        this.vel = new THREE.Vector3(0,0,0);

        this.acc = new THREE.Vector3(0,0,0);

        this.angMomentum = new THREE.Vector3(0,0,0);

        this.correction = {
            deltaVel: new THREE.Vector3(0,0,0),
            deltaPos: new THREE.Vector3(0,0,0),
            deltaOmega: new THREE.Vector3(0,0,0),
            deltaRotation: new THREE.Vector3(0,0,0)
        }
        
        this.scale = 1;

        this.restitutionFactor = 0.8;

        this.texture;

        this.name;

        let offx = this.width*0.5;
        let offy = this.height*0.5;
        let offz = this.thickness*0.5;

        this.verticeArr = [new THREE.Vector3(offx,offy,offz),
                           new THREE.Vector3(offx,offy,-offz),

                           new THREE.Vector3(-offx,offy,offz),
                           new THREE.Vector3(-offx,offy,-offz),

                           new THREE.Vector3(offx,-offy,offz),
                           new THREE.Vector3(offx,-offy,-offz),

                           new THREE.Vector3(-offx,-offy,offz),
                           new THREE.Vector3(-offx,-offy,-offz)];

        this.vertex = {
            topRight:[this.verticeArr[0],this.verticeArr[1]],
            topLeft:[this.verticeArr[2],this.verticeArr[3]],
            bottomRight:[this.verticeArr[4],this.verticeArr[5]],
            bottomLeft:[this.verticeArr[6],this.verticeArr[7]]
        }

        this.verticeArrGlobal = [new THREE.Vector3(offx,offy,offz),
                           new THREE.Vector3(offx,offy,-offz),

                           new THREE.Vector3(-offx,offy,offz),
                           new THREE.Vector3(-offx,offy,-offz),

                           new THREE.Vector3(offx,-offy,offz),
                           new THREE.Vector3(offx,-offy,-offz),

                           new THREE.Vector3(-offx,-offy,offz),
                           new THREE.Vector3(-offx,-offy,-offz)];

        this.globalVertex = {
            topRight:[this.verticeArrGlobal[0],this.verticeArrGlobal[1]],
            topLeft:[this.verticeArrGlobal[2],this.verticeArrGlobal[3]],
            bottomRight:[this.verticeArrGlobal[4],this.verticeArrGlobal[5]],
            bottomLeft:[this.verticeArrGlobal[6],this.verticeArrGlobal[7]]
        }

        this.surfaceNormal = [
            new THREE.Vector3(1,0,0),
            new THREE.Vector3(0,1,0),
            new THREE.Vector3(0,0,1)
        ];

        this.globalSurfaceNormal = [
            new THREE.Vector3(1,0,0),
            new THREE.Vector3(0,1,0),
            new THREE.Vector3(0,0,1)
        ];

        this.planeP = [
            this.verticeArrGlobal[1],
            this.verticeArrGlobal[6]
        ];

        this.inertiaTensors = new THREE.Matrix3();
        this.inertiaTensorInverse = new THREE.Matrix3();
        this.lastTick = 0;
        this.debugSetUp(scene);
        this.calcInertia();
    }

    loadModel(scene){

        const boxGemo = new THREE.BoxGeometry(this.width,this.height,this.thickness);
        const boxMet = new THREE.MeshStandardMaterial({
            color:this.color
        });
        const boxMesh = new THREE.Mesh(boxGemo,boxMet);
        this.threeJsObj = boxMesh;

        this.threeJsObj.castShadow = true;
        this.threeJsObj.receiveShadow = true;
        this.threeJsObj.name = this.name;


        this.addToScene(scene);
    }
    
    calcInertia(){
        this.inertiaTensors.set(
            (this.mass*(this.thickness*this.thickness+this.height*this.height))/12,0,0,
            0,(this.mass*(this.thickness*this.thickness+this.width*this.width))/12,0,
            0,0,(this.mass*(this.width*this.width+this.height*this.height))/12
        );
        
        this.inertiaTensorInverse.set(
            1/this.inertiaTensors.elements[0],0,0,
            0,1/this.inertiaTensors.elements[4],0,
            0,0,1/this.inertiaTensors.elements[8]
        );
    }

    //debug
    debugSetUp(scene){
        this.debugArrows = {
            vel:new debugArrow(0xff0000,scene),
            acc:new debugArrow(0x00ff00,scene),
            contact:new debugArrow(0x0000ff,scene),
            omega:new debugArrow(0xff00ff,scene),
            impulse:new debugArrow(0xff00ff,scene),
            angimplse:new debugArrow(0xff00ff,scene),
            coliNorm:new debugArrow(0x777777,scene)
        }

    }
    //debug
    updateArrows(){
        this.debugArrows.acc.updateArrow(this.position,this.acc);
        this.debugArrows.vel.updateArrow(this.position,this.vel);
        this.debugArrows.contact.updateArrow(this.position);
        this.debugArrows.omega.updateArrow(this.position,this.omega);
        this.debugArrows.impulse.updateArrow(this.position);
        this.debugArrows.angimplse.updateArrow(this.position);
        this.debugArrows.coliNorm.updateArrow(this.coliNorm);
    }

    updateColide(otherObj){
        resolveCollision(this,otherObj);
    }

    updateBoxDebug(){

    }

    updateGlobalPos(){
        for(let i = 0;i<this.verticeArr.length;i++){
            this.verticeArrGlobal[i].copy(this.verticeArr[i]);
            this.verticeArrGlobal[i].applyMatrix3(this.rotationMatrx);
            this.verticeArrGlobal[i].add(this.position);
        }


        for(let i = 0;i<this.surfaceNormal.length;i++){
            this.globalSurfaceNormal[i].copy(this.surfaceNormal[i]);
            this.globalSurfaceNormal[i].applyMatrix3(this.rotationMatrx);
        }
    }

    updateTorque(){
    }
    
    updateForce(){
    }

    updateApplieForce(h){
        this.acc.copy(this.force.clone().divideScalar(this.mass).multiplyScalar(h));
        //this.vel.add(this.acc.clone().multiplyScalar(h));
    }

    updatePos(h){
        this.position.add(this.vel.clone().multiplyScalar(h));
        ///update omega from impulse
        //this.omega = this.rotationMatrx*this.inertiaTensorInverse*this.rotationMatrx^T*this.angMomentum;
        
        /*
        let globInertia = new THREE.Matrix3()
        .multiplyMatrices(this.rotationMatrx.clone(),this.inertiaTensorInverse)
        .multiply(this.rotationMatrx.clone().transpose());
*/
    }

    updateRotation(h){
        addOmega(this.rotationMatrx,this.omega.clone().multiplyScalar(h));
    }

    updateThreeJS(){
        this.threeJsObj.position.copy(this.position);
        //WTF FUCK why 4D
        const tempMatrix4 = new THREE.Matrix4().setFromMatrix3(this.correctionRotationMatrx.clone().multiply(this.rotationMatrx));
        this.eularRotation = new THREE.Euler().setFromRotationMatrix(tempMatrix4);
        this.threeJsObj.rotation.copy(this.eularRotation);

        if(this.threeJsObj.material && this.threeJsObj.material.color){
             this.threeJsObj.material.color.set(this.color);
        }
    }

    updatePositionCorrection(){

    }

    applyCorrection(){
        this.vel.add(this.correction.deltaVel);
        this.position.add(this.correction.deltaPos);
        
        this.omega.add(this.correction.deltaOmega);
        addOmega(this.rotationMatrx,this.correction.deltaRotation);
    }

    initForCycle(){
        this.correction.deltaOmega.set(0,0,0);
        this.correction.deltaPos.set(0,0,0);
        this.correction.deltaVel.set(0,0,0);
        this.correction.deltaRotation.set(0,0,0);
    }

    
    place(pos,corner){
        this.position.sub(corner);
        this.position.add(pos);
    }

    addToScene(scene){
        scene.add(this.threeJsObj);
    }

}

export {boxObj};