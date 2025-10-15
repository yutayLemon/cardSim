
function allUpdateGlobalPos(arr,h){for(const item of arr){
    item.updateGlobalPos(h);}}

function allUpdateForce(arr,h){for(const item of arr){
    item.updateForce(h);}}

function allUpdateTorque(arr,h){for(const item of arr){
    item.updateTorque(h);}}

function allUpdateApplieForce(arr,h){for(const item of arr){
    item.updateApplieForce(h);}}

function allUpdatePos(arr,h){for(const item of arr){
    item.updatePos(h);}}

function allUpdateRotation(arr,h){for(const item of arr){
    item.updateRotation(h);}}

function allUpdateThreeJS(arr,h){for(const item of arr){
    item.updateThreeJS(h);}}

function allApplyCorrection(arr,h){for(const item of arr){
    item.applyCorrection(h);}}

function allInitForCycle(arr){for(const item of arr){
    item.initForCycle();}}

function allDamp(arr){for(const item of arr){
    let factor = 0.98;
    //item.vel.multiplyScalar(factor);
    item.omega.multiplyScalar(factor);
}}



export {allDamp,allInitForCycle,allApplyCorrection,allUpdateThreeJS,allUpdateRotation,allUpdatePos,allUpdateGlobalPos,allUpdateForce,allUpdateTorque,allUpdateApplieForce}