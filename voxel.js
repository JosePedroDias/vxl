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



function colorize(id) {
  return [
    (id >> 16) & 255,
    (id >>  8) & 255,
     id        & 255
  ];
}



function createScene() {
  const SZ = 32;

  const scene = new BABYLON.Scene(engine);

  const cam = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, SZ*2, -SZ*4), scene);
  cam.setTarget(BABYLON.Vector3.Zero());
  cam.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);

  //const sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);
  //sphere.position.y = 1;

  const cube = BABYLON.Mesh.CreateBox('box1', SZ, scene);
  cube.material = new BABYLON.StandardMaterial('mat1', scene);
  cube.material.wireframe = true;
  cube.material.alpha = 0.5;
  //cube.material.ambientColor = new BABYLON.Color3(1, 1, 1);
  cube.material.emissiveColor = new BABYLON.Color3(1, 1, 1);


  //const ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene);



  const av = new AVoxel(SZ);
  //av.add(0, 0, 0, 0xFF0000);
  //av.add(2, 2, 2, 0x00FF00);
  //av.addSphere(16, 16, 16, 15, 0xFF0000);
  av.addBox(0, 0, 0, 15, 31, 31, 0x00FF00);
  const vox = av.toBabylon('vox', scene);

  /*const vox2 = new CEWBS.VoxelMesh('vox2', scene);
  vox2.setDimensions([SZ, SZ, SZ]);
  av.traverse((x, y, z, c) => {
    vox2.setVoxelAt([x, y, z], c);
  });
  vox2.position.x -= SZ/2;
  vox2.position.y -= SZ/2;
  vox2.position.z -= SZ/2;
  vox2.coloringFunction = colorize;
  vox2.updateMesh();*/


  return scene;
};
