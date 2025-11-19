import * as THREE from 'three';
import {addDebugPoint,updateDebug,debugArrow,vectorisNaN} from './debug.js'
import {addOmega} from './colideMath.js';
import {exportObjBox} from "./import.js";
import {halfEdgeBoxMesh,facesAroundVertex} from './halfEdgeData.js'

class boxObj{
    constructor(scene,size,faceRatio,thickRatio){
        this.name = "box";
        this.class = "box";
        this.geometryClass = "box";
        this.width = size;
        this.faceRatio = faceRatio;
        this.thickRatio = thickRatio;

        this.height = this.width * this.faceRatio;
        this.thickness = this.width * this.thickRatio;

        this.position = new THREE.Vector3(0,0,0);
        this.meshData = halfEdgeBoxMesh(this.width,this.height,this.thickness);
        
        this.surfaceMaterial = "plastic";

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
        
        this.mdlOffset = new THREE.Vector3(0,0,0);
        this.scale = 1;

        this.restitutionFactor = 0.8;

        this.texture;

        this.name;

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
        const boxGemo = new THREE.BoxGeometry(this.width,this.height,this.thickness);
        const boxMet = new THREE.MeshStandardMaterial({
            color:this.color,
            transparent:true,
            opacity:0.5,
            wireframe:false
        });
        this.THREEjsBoundingBox = new THREE.Mesh(boxGemo,boxMet);
        scene.add(this.THREEjsBoundingBox);
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

    updateBoxDebug(){

    }

    updateGlobalPos(){
        this.meshData.updateGlobal(this.position,this.rotationMatrx);
    }

    updateTorque(h){
    }
    
    updateForce(h){
    }

    updateApplieForce(h){
        //console.log(this.force);
        this.acc.set((this.force.x*h)/this.mass,(this.force.y*h)/this.mass,(this.force.z*h)/this.mass);
        this.vel.add(this.acc.clone().multiplyScalar(h));
        vectorisNaN(this.acc);
        vectorisNaN(this.vel);
    }

    updatePos(h){
        this.position.add(this.vel.clone().multiplyScalar(h));
        vectorisNaN(this.position);
        ///update omega from impulse
        //this.omega = this.rotationMatrx*this.inertiaTensorInverse*this.rotationMatrx^T*this.angMomentum;
        
        /*
        let globInertia = new THREE.Matrix3()
        .multiplyMatrices(this.rotationMatrx.clone(),this.inertiaTensorInverse)
        .multiply(this.rotationMatrx.clone().transpose());
*/
    }

    updateRotation(h){
        addOmega(this.rotationMatrx,this.omega.clone(),h);
        vectorisNaN(this.omega);
    }

    updateThreeJS(){
        if(this.THREEjsBoundingBox){
            this.THREEjsBoundingBox.visible = window.simulation.debug.bounds;
            this.THREEjsBoundingBox.position.copy(this.position);
            const tempMatrix4 = new THREE.Matrix4().setFromMatrix3(this.correctionRotationMatrx.clone().multiply(this.rotationMatrx));
            this.eularRotation = new THREE.Euler().setFromRotationMatrix(tempMatrix4);
            this.THREEjsBoundingBox.rotation.copy(this.eularRotation);

            if(this.THREEjsBoundingBox.material && this.THREEjsBoundingBox.material.color){
                this.THREEjsBoundingBox.material.color.set(this.color);
            }
        }
        //this.threeJsObj.position.copy(this.position.sub(this.mdlOffset));
        this.threeJsObj.position.copy(this.position);
        //WTF FUCK why 4D
        let totalRotation = this.correctionRotationMatrx.clone().multiply(this.rotationMatrx);
        const tempMatrix4 = new THREE.Matrix4().setFromMatrix3(totalRotation);
        this.eularRotation = new THREE.Euler().setFromRotationMatrix(tempMatrix4);
        this.threeJsObj.rotation.copy(this.eularRotation);

        this.threeJsObj.position.add(this.mdlOffset.clone().applyMatrix3(totalRotation));
        if(this.threeJsObj.material && this.threeJsObj.material.color){
             this.threeJsObj.material.color.set(this.color);
        }
    }
    updatePositionCorrection(h){

    }

    applyCorrection(h){
        this.vel.add(this.correction.deltaVel.clone().multiplyScalar(h));
        this.position.add(this.correction.deltaPos.clone().multiplyScalar(h));
        
        this.omega.add(this.correction.deltaOmega.clone().multiplyScalar(h));
        vectorisNaN(this.vel);
        vectorisNaN(this.omega);
        vectorisNaN(this.position);
        //addOmega(this.rotationMatrx,this.correction.deltaRotation,1);
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
        vectorisNaN(this.position);
    }

    addToScene(scene){
        scene.add(this.threeJsObj);
    }

    exportObj(){
        return exportObjBox(this);
    }

    delete(scene){
        let item = this.threeJsObj;
        scene.remove(item);
        if(item.geometry){
            item.geometry.dispose();
        }
        if(item.material){
            if(Array.isArray(item.material)){
                for(const elm of item.material){
                    elm.dispose();
                }
            }else{
            item.material.dispose();
        }
        }
        for(const arrow in this.debugArrows){
            this.debugArrows[arrow].delete(scene);
        }
        this.meshData = null;
    }
            
}

export {boxObj};