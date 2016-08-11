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
  const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);
  camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(canvas, true);
  const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
  const sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);
  sphere.position.y = 1;
  const ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene);

  //Create the mesh like a standard Babylon Mesh.
  const voxMesh1 = new CEWBS.VoxelMesh('testMesh1', scene);

  //Set the bounding box of the Voxel area, !IMPORTANT! [Does not need to be cubic, can be rectangular]
  //If your code stops working, it's probably because you forgot to set the dimensions before anything else.
  voxMesh1.setDimensions([3,3,3]);

  //setVoxelAt([x,y,z], meta)
  voxMesh1.setVoxelAt([1,1,0], 2);
  voxMesh1.setVoxelAt([2,0,1], 3);

  var voxColors = [
    [  0,   0,   0], //ID 1 is black
    [255,   0,   0], //ID 1 is red
    [  0, 255,   0], //ID 2 is green
    [  0,   0, 255]  //ID 3 is blue
  ];

  voxMesh1.coloringFunction = function(id) {
    return voxColors[id];
  };

  voxMesh1.updateMesh();

  return scene;
};
