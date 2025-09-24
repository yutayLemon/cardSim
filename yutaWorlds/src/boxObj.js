import * as THREE from 'three';
import {addDebugPoint,updateDebug} from './debug.js'
import {cloideBox2Box} from './colideDetect.js'

class boxObj{
    constructor(scene,size,cardRatio,thickRatio){
        this.sizeFact = size;
        this.cardRatio = cardRatio;
        this.thickRatio = thickRatio;

        this.width = this.sizeFact;
        this.height = this.sizeFact * this.cardRatio;
        this.thickness = this.sizeFact * this.thickRatio;

        this.debugPoints = [];

        this.position = new THREE.Vector3(0,0,0);

        this.force = new THREE.Vector3(0,0,0);

        this.mass = 1;

        this.color = 0x000000;

        this.torque = new THREE.Vector3(0,0,0);

        this.rotation = new THREE.Euler(0,0,0);
        this.angacc = new THREE.Vector3(0,0,0);
        this.angvel = new THREE.Vector3(0,0,0);

        this.acc = new THREE.Vector3(0,0,0);
        this.vel = new THREE.Vector3(0,0,0);

        this.scale = 1;

        this.restitutionFactor = 0.8;

        this.texture;

        this.name;

        this.width = this.sizeFact;
        this.height = this.sizeFact * this.cardRatio;
        this.thickness = this.sizeFact * this.thickRatio;

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

        this.mass = 1;
        this.moment = new THREE.Vector3((this.mass*(this.thickness*this.thickness+this.height*this.height))/12,
                                        (this.mass*(this.thickness*this.thickness+this.width*this.width))/12,
                                        (this.mass*(this.width*this.width+this.height*this.height))/12);

        const boxGemo = new THREE.BoxGeometry(this.width , this.height , this.thickness);
        const boxMet = new THREE.MeshStandardMaterial({
            color:this.color
        });
        const boxMesh = new THREE.Mesh(boxGemo,boxMet);
        this.threeJSMesh = boxMesh;
        this.threeJsObj = boxMesh;

        this.threeJsObj.name = this.name;
        this.threeJsObj.castShadow = true;
        this.threeJsObj.name = this.name;

        this.addToScene(scene);
    }

    updateColide(otherObj){
        let collision = cloideBox2Box(this,otherObj);
        if(collision.colide){
            let relativeVel = this.vel.dot(collision.normal) - otherObj.vel.dot(collision.normal);//TOdo cheak signs
            let impulse = collision.normal.dot(collision.normal.clone().multiplyScalar(relativeVel*(this.restitutionFactor-1)));
            impulse /= collision.normal.dot(collision.normal.clone().multiplyScalar((1/this.mass+1/otherObj.mass)));
            console.log(collision.normal);
            //console.log(relativeVel,impulse,collision.normal,this.restitutionFactor);

            if(isNaN(impulse)){
            }else{
                this.vel.add(collision.normal.clone().multiplyScalar(impulse/this.mass));
                otherObj.vel.sub(collision.normal.clone().multiplyScalar(impulse/otherObj.mass));
            }
        }
    }

    updateBoxDebug(){

    }

    updateGlobal(){
        for(let i = 0;i<this.verticeArr.length;i++){
            this.verticeArrGlobal[i].copy(this.verticeArr[i].clone());
            this.verticeArrGlobal[i].applyEuler(this.rotation);
            this.verticeArrGlobal[i].add(this.position);
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

    update(){
        this.updateGlobal();
        this.updateForce();
        this.updateTorque();
        this.updateBoxDebug();
        let h = 1;

        this.acc.copy(this.force.clone().divideScalar(this.mass));
        this.angacc.copy(this.torque.clone().divide(this.moment));

        this.vel.add(this.acc.clone().multiplyScalar(h));
        this.angvel.add(this.angacc.clone().multiplyScalar(h));

        this.position.add(this.vel.clone().multiplyScalar(h));
        this.rotation.x += this.angvel.x * h;
        this.rotation.y += this.angvel.y * h;
        this.rotation.z += this.angvel.z * h;
        
        this.threeJsObj.position.copy(this.position);
        this.threeJsObj.rotation.copy(this.rotation);
        this.threeJsObj.scale.set(this.scale,this.scale,this.scale);

        this.threeJSMesh.material.color.set(this.color);
    }
}



export {boxObj};