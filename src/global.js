window.simulation = {
  debug:{
    arrow:true,
    selection:true,
    points:true,
    bounds:true
  },
  state:{
    simPause:false,
    step:false
  },
  camera:{
    flow:false
  },
  objects:[],
  improtState:undefined,
  friction:{
    //metrials:plastic,paper,wood
  }
}

window.simulation.friction["plasticONplastic"] = {};
window.simulation.friction["plasticONplastic"].static = 0.35;
window.simulation.friction["plasticONplastic"].dynamic = 0.25; 

window.simulation.friction["plasticONpaper"] = {};
window.simulation.friction["plasticONpaper"].static = 0.7;
window.simulation.friction["plasticONpaper"].dynamic = 0.5; 

window.simulation.friction["plasticONwood"] = {};
window.simulation.friction["plasticONwood"].static = 0.5;
window.simulation.friction["plasticONwood"].dynamic = 0.31; 

window.simulation.friction["paperONpaper"] = {};
window.simulation.friction["paperONpaper"].static = 0.8;
window.simulation.friction["paperONpaper"].dynamic = 0.6; 

window.simulation.friction["paperONwood"] = {};
window.simulation.friction["paperONwood"].static = 0.6;
window.simulation.friction["paperONwood"].dynamic = 0.5; 

window.simulation.friction["woodONwood"] = {};
window.simulation.friction["woodONwood"].static = 0.5;
window.simulation.friction["woodONwood"].dynamic = 0.4; 
