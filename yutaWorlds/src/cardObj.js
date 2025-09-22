import {boxObj} from './boxObj'
import * as THREE from 'three';
import {state} from './keyInput.js'

let g = new THREE.Vector3(0,-0.001,0);

class cardObj extends boxObj{
    constructor(scene,size){
        super(scene,size,1.414,0.1);
        this.name = "card";
        this.color = 0xffff00;
    }

    updateTorque(){
        this.torque.set(0,0,0);

    }

    updateForce(){
        this.force.set(0,0,0);
        this.force.add(g);
        //this.force = scaleVect(this.mass,g);
    }

    groundCalc(){

    }

    colide(){

    }
}

class playerObj extends boxObj{
    constructor(scene,size){
        super(scene,size,1,1);
        this.name = "player";
        this.color = 0xff0000;
    }

    updateTorque(){
        this.torque.set(0,0,0);

    }

    updateForce(){
        this.force.set(0,0,0);
        this.vel.set(0,0,0);
        let ff = 0.000001;
        if(state['KeyW']){
            this.vel.x = 0.1;
        }
        if(state['KeyS']){
            this.vel.x = -0.1;
        }
        if(state['KeyD']){
            this.vel.z = 0.1;
        }
        if(state['KeyA']){
            this.vel.z = -0.1;
        }
        if(state['Space']){
            this.vel.y = 0.1;
        }
        if(state['ShiftLeft'] || state['ShiftRight']){
            this.vel.y = -0.1;
        }
    }

    groundCalc(){

    }

    colide(){

    }
}


export {cardObj,playerObj}