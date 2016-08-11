'use strict';

const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);
const scene = createScene();

engine.runRenderLoop(function() {
  scene.render();
});

window.addEventListener('resize', function() {
  engine.resize();
});



function createScene() {
  const scene = new BABYLON.Scene(engine);

  const cam = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);
  cam.setTarget(BABYLON.Vector3.Zero());
  cam.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);

  //const sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);
  //sphere.position.y = 1;

  const cube = BABYLON.Mesh.CreateBox('box1', 3, scene);
  cube.material = new BABYLON.StandardMaterial('mat1', scene);
  cube.material.wireframe = true;
  cube.material.alpha = 0.5;
  //cube.material.ambientColor = new BABYLON.Color3(1, 1, 1);
  cube.material.emissiveColor = new BABYLON.Color3(1, 1, 1);


  //const ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene);



  function colorize(id) {
    return [
      (id >> 16) & 255,
      (id >>  8) & 255,
       id        & 255
    ];
  }


  /*
  const vox1 = new CEWBS.VoxelMesh('vox1', scene);
  vox1.setDimensions([3,3,3]);
  vox1.setVoxelAt([1,1,0], 2);
  vox1.setVoxelAt([2,0,1], 3);
  vox1.setVoxelAt([0,0,0], 1);
  vox1.setVoxelAt([2,2,2], 1);
  vox1.position.x -= 1.5;
  vox1.position.y -= 1.5;
  vox1.position.z -= 1.5;

  var voxColors = [
    [  0,   0,   0], //ID 1 is black
    [255,   0,   0], //ID 1 is red
    [  0, 255,   0], //ID 2 is green
    [  0,   0, 255]  //ID 3 is blue
  ];
  vox1.coloringFunction = function(id) {
    return voxColors[id];
  };
  vox1.updateMesh();
  */

  const vox2 = new CEWBS.VoxelMesh('vox2', scene);
  vox2.setDimensions([3,3,3]);
  vox2.setVoxelAt([0,0,0], 0xFF0000);
  vox2.setVoxelAt([2,2,2], 0x00FF00);
  vox2.position.x -= 1.5;
  vox2.position.y -= 1.5;
  vox2.position.z -= 1.5;
  vox2.coloringFunction = colorize;
  vox2.updateMesh();


  return scene;
};
