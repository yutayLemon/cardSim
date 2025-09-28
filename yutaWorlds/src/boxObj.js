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

        this.omega = new THREE.Vector3(0,0,0);
        this.vel = new THREE.Vector3(0,0,0);

        this.acc = new THREE.Vector3(0,0,0);

        this.angMomentum = new THREE.Vector3(0,0,0);

        this.debugArrows = {
            vel:new debugArrow(0xff0000,scene),
            acc:new debugArrow(0x00ff00,scene),
            contact:new debugArrow(0x0000ff,scene),
            omega:new debugArrow(0xff00ff,scene),
            impulse:new debugArrow(0xff00ff,scene),
            angimplse:new debugArrow(0xff00ff,scene)
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

        this.inertiaTensors = new THREE.Matrix3();
        this.inertiaTensors.set(
            (this.mass*(this.thickness*this.thickness+this.height*this.height))/12,0,0,
            0,(this.mass*(this.thickness*this.thickness+this.width*this.width))/12,0,
            0,0,(this.mass*(this.width*this.width+this.height*this.height))/12
        );

        this.inertiaTensorInverse = new THREE.Matrix3();
        
        this.inertiaTensorInverse.set(
            1/this.inertiaTensors.elements[0],0,0,
            0,1/this.inertiaTensors.elements[4],0,
            0,0,1/this.inertiaTensors.elements[8]
        );


        const boxGemo = new THREE.BoxGeometry(this.width,this.height,this.thickness);
        const boxMet = new THREE.MeshStandardMaterial({
            color:this.color
        });
        const boxMesh = new THREE.Mesh(boxGemo,boxMet);
        this.threeJsObj = boxMesh;

        this.threeJsObj.castShadow = true;
        this.threeJsObj.name = this.name;

        this.lastTick = 0;

        this.addToScene(scene);
    }

    updateArrows(){
        this.debugArrows.acc.updateArrow(this.position,this.acc);
        this.debugArrows.vel.updateArrow(this.position,this.vel);
        this.debugArrows.contact.updateArrow(this.position);
        this.debugArrows.omega.updateArrow(this.position,this.omega);
        this.debugArrows.impulse.updateArrow(this.position);
        this.debugArrows.angimplse.updateArrow(this.position);
    }

    updateColide(otherObj){
        resolveCollision(this,otherObj);
    }

    updateBoxDebug(){

    }

    updateGlobal(){
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

    place(pos,corner){
        this.position.sub(corner);
        this.position.add(pos);
    }

    addToScene(scene){
        scene.add(this.threeJsObj);
    }

    updateTorque(){
    }
    
    updateForce(){
    }

    update(tick){
        let deltaTime = this.lastTick - tick;


        this.updateGlobal();
        this.updateForce();
        this.updateTorque();
        this.updateBoxDebug();
        let h = 1;

        this.acc.copy(this.force.clone().divideScalar(this.mass));
        //this.angacc.copy(this.torque.clone().divide(this.moment));
        this.updatePosVel(h);
        this.threeJsObj.scale.set(this.scale,this.scale,this.scale);

        this.threeJsObj.material.color.set(this.color);

        this.updateArrows();
    }

    updatePosVel(h){


        //TODO FIX THIS FUCKER
        this.position.add(this.vel.clone().multiplyScalar(h));
        ///update omega from impulse
        //this.omega = this.rotationMatrx*this.inertiaTensorInverse*this.rotationMatrx^T*this.angMomentum;
        
        let globInertia = new THREE.Matrix3()
        .multiplyMatrices(this.rotationMatrx.clone(),this.inertiaTensorInverse)
        .multiply(this.rotationMatrx.clone().transpose());
           // console.log(this.rotationMatrx.clone().transpose(),this.inertiaTensorInverse);
        //this.omega.copy(this.angMomentum.clone().applyMatrix3(globInertia));
        /////TO FUCKING DOOOO
        //console.log(this.omega);
        addOmega(this.rotationMatrx,this.omega);

        //WTFF FUCK why 4D
        const tempMatrix4 = new THREE.Matrix4().setFromMatrix3(this.rotationMatrx);
        this.eularRotation = new THREE.Euler().setFromRotationMatrix(tempMatrix4);
        
        this.threeJsObj.position.copy(this.position);
        this.threeJsObj.rotation.copy(this.eularRotation);
    }
}

export {boxObj};