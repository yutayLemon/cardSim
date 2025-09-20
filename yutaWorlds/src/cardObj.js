import { Obj } from "./physicalObj";


class cardObj{
    constructor(THREE,scene){
        this.topLeftNode = {x:0,y:0,z:0};
        this.topRightNode = {x:0,y:0,z:0};
        this.bottomLeftNode = {x:0,y:0,z:0};
        this.bottomRightNode = {x:0,y:0,z:0};

        this.force = {x:0,y:0,z:0};

        this.torque = {x:0,y:0,z:0};

        this.rotation = {x:0,y:0,z:0};

        this.scale = 1;

        this.texture;

        this.name;

        this.sizeFact = 10;
        this.cardRatio = 1.414;
        this.thickRatio = 0.1;

        this.width = this.sizeFact;
        this.height = this.sizeFact * this.ratio;
        this.thickness = this.sizeFact * this.thickRatio;

        const boxGemo = new THREE.BoxGeometry(width , height , thickness);
        const boxMet = new THREE.MeshStandardMaterial({
            color:0x00FF00
        });
        const boxMesh = new THREE.Mesh(boxGemo,boxMet);
        this.threeJsObj = boxMesh;

        this.threeJsObj.name = this.name;
        this.threeJsObj.castShadow = true;
        //const boxID = this.threeJsObj.id;
        this.threeJsObj.name = "box";

        addToScene(scene);
    }

    addToScene(scene){
        scene.add(this.threeJsObj);
    }

    updateTorque(){

    }

    updateForce(){

    }

    update(){
        this.threeJsObj.position.set(this.topRightNode.x,this.topRightNode.y,this.topRightNode.z);
        this.threeJsObj.rotation.set(this.rotation.x,this.rotation.y,this.rotation.z);
        this.threeJsObj.scale.set(this.scale,this.scale,this.scale);
    }

    colide(){

    }
}