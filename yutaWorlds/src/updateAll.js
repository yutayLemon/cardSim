
function allUpdateGlobalPos(arr){for(const item of arr){
    item.updateGlobalPos();}}

function allUpdateForce(arr){for(const item of arr){
    item.updateForce();}}

function allUpdateTorque(arr){for(const item of arr){
    item.updateTorque();}}

function allUpdateApplieForce(arr,h){for(const item of arr){
    item.updateApplieForce(h);}}

function allUpdatePos(arr,h){for(const item of arr){
    item.updatePos(h);}}

function allUpdateRotation(arr,h){for(const item of arr){
    item.updateRotation(h);}}

function allUpdateThreeJS(arr){for(const item of arr){
    item.updateThreeJS();}}

function allApplyCorrection(arr){for(const item of arr){
    item.applyCorrection();}}

function allInitForCycle(arr){for(const item of arr){
    item.initForCycle();}}

export {allInitForCycle,allApplyCorrection,allUpdateThreeJS,allUpdateRotation,allUpdatePos,allUpdateGlobalPos,allUpdateForce,allUpdateTorque,allUpdateApplieForce}