import { Obj } from "./physicalObj";

let g = {x:0,y:-0.001,z:0};


class cardObj{
    constructor(THREE,scene,size){
        this.sizeFact = size;
        this.cardRatio = 1.414;
        this.thickRatio = 0.1;

        this.width = this.sizeFact;
        this.height = this.sizeFact * this.cardRatio;
        this.thickness = this.sizeFact * this.thickRatio;

        this.vertices = {
            topRight:[{x:this.width*0.5,y:this.height*0.5,z:this.thickness*0.5},
                      {x:this.width*0.5,y:this.height*0.5,z:-this.thickness*0.5}],
            topLeft:[{x:-this.width*0.5,y:this.height*0.5,z:this.thickness*0.5},
                      {x:-this.width*0.5,y:this.height*0.5,z:-this.thickness*0.5}],
            bottomRight:[{x:this.width*0.5,y:-this.height*0.5,z:this.thickness*0.5},
                      {x:this.width*0.5,y:-this.height*0.5,z:-this.thickness*0.5}],
            bottomLeft:[{x:-this.width*0.5,y:-this.height*0.5,z:this.thickness*0.5},
                      {x:-this.width*0.5,y:-this.height*0.5,z:-this.thickness*0.5}]
        }

        this.position = {x:0,y:0,z:0};

        this.force = {x:0,y:0,z:0};

        this.mass = 1;
        this.torque = {x:0,y:0,z:0};

        this.rotation = {x:0,y:0,z:0};
        this.angacc = {x:0,y:0,z:0};
        this.angvel = {x:0,y:0,z:0};

        this.acc = {x:0,y:0,z:0};
        this.vel = {x:0,y:0,z:0};

        this.scale = 1;

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

    place(pos,corner){
        this.position = addVect(pos,minusVect(this.position,corner));
    }

    addToScene(scene){
        scene.add(this.threeJsObj);
    }

    updateTorque(){
        this.torque = {x:0,y:0,z:0};

    }

    updateForce(){
        this.force = {x:0,y:0,z:0};
        this.force = scaleVect(this.mass,g);
    }

    update(){
        this.acc = scaleVect(1/this.mass,this.force);
        this.angacc = scaleVect(1/this.mass,this.torque);//appliey inertial formular

        this.vel = addVect(this.vel,this.acc);
        this.angvel = addVect(this.angvel,this.angacc);

        this.position = addVect(this.position,this.vel);
        this.rotation = addVect(this.rotation,this.angvel);

        this.threeJsObj.position.set(this.position.x,this.position.y,this.position.z);
        this.threeJsObj.rotation.set(this.rotation.x,this.rotation.y,this.rotation.z);
        this.threeJsObj.scale.set(this.scale,this.scale,this.scale);
    }

    colide(){

    }
}

function addVect(vect1,vect2){
    return {x:vect1.x+vect2.x,y:vect1.y+vect2.y,z:vect1.z+vect2.z}
}

function minusVect(vect1,vect2){
    return {x:vect1.x-vect2.x,y:vect1.y-vect2.y,z:vect1.z-vect2.z}
}

function scaleVect(num,vect){
    return {x:num*vect.x,y:num*vect.y,z:num*vect.z};
}
export {cardObj}