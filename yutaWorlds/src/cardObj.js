import { Obj } from "./physicalObj";
import * as THREE from 'three';

let g = new THREE.Vector3(0,-0.001,0);


class cardObj{
    constructor(scene,size){
        this.sizeFact = size;
        this.cardRatio = 1.414;
        this.thickRatio = 0.1;

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
        this.vertices = {//index of corosponding vertex
            topRight:[0,1],
            topLeft:[2,3],
            bottomRight:[4,5],
            bottomLeft:[6,7]
        }

        this.vertex = {
            topRight:()=>{return [this.verticeArr[0],this.verticeArr[1]]},
            topLeft:()=>{return [this.verticeArr[2],this.verticeArr[3]]},
            bottomRight:()=>{return [this.verticeArr[4],this.verticeArr[5]]},
            bottomLeft:()=>{return [this.verticeArr[6],this.verticeArr[7]]}
        }

        this.verticeArrGlobal = [new THREE.Vector3(offx,offy,offz),
                           new THREE.Vector3(offx,offy,-offz),

                           new THREE.Vector3(-offx,offy,offz),
                           new THREE.Vector3(-offx,offy,-offz),

                           new THREE.Vector3(offx,-offy,offz),
                           new THREE.Vector3(offx,-offy,-offz),

                           new THREE.Vector3(-offx,-offy,offz),
                           new THREE.Vector3(-offx,-offy,-offz)];

        this.surfaceNormal = [
            new THREE.Vector3(1,0,0),
            new THREE.Vector3(0,1,0),
            new THREE.Vector3(0,0,1)
        ];

        this.position = new THREE.Vector3(0,0,0);

        this.force = new THREE.Vector3(0,0,0);

        this.mass = 1;
        this.moment = new THREE.Vector3((this.mass*(this.thickness*this.thickness+this.height*this.height))/12,
                                        (this.mass*(this.thickness*this.thickness+this.width*this.width))/12,
                                        (this.mass*(this.width*this.width+this.height*this.height))/12);

        this.torque = new THREE.Vector3(0,0,0);

        this.rotation = new THREE.Euler(0,0,0);
        this.angacc = new THREE.Vector3(0,0,0);
        this.angvel = new THREE.Vector3(0,0,0);

        this.acc = new THREE.Vector3(0,0,0);
        this.vel = new THREE.Vector3(0,0,0);

        this.scale = 1;

        this.restitutionFactor = 1;

        this.texture;

        this.name;

        

        const boxGemo = new THREE.BoxGeometry(this.width , this.height , this.thickness);
        const boxMet = new THREE.MeshStandardMaterial({
            color:0xFFFF00
        });
        const boxMesh = new THREE.Mesh(boxGemo,boxMet);
        this.threeJsObj = boxMesh;

        this.threeJsObj.name = this.name;
        this.threeJsObj.castShadow = true;
        //const boxID = this.threeJsObj.id;
        this.threeJsObj.name = "box";

        this.addToScene(scene);
    }

    updateGlobal(){
        for(let i = 0;i<this.verticeArr.length;i++){
            this.verticeArrGlobal[i].copy(this.verticeArr[i].clone().add(this.position));
            //rotation
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
        this.torque.set(0,0,0);

    }

    updateForce(){
        this.force.set(0,0,0);
        this.force.add(g);
        //this.force = scaleVect(this.mass,g);
    }

    update(){
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
    }

    groundCalc(){

    }

    colide(){

    }
}

export {cardObj}