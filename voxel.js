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
  const SZ = 256;

  const scene = new BABYLON.Scene(engine);

  //const cam = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, SZ*2, -SZ*4), scene);
  const cam = new BABYLON.ArcRotateCamera('camera1', 1, 0.8, SZ*1.2, new BABYLON.Vector3(0, 0 - SZ/2, 0), scene);
  cam.setTarget(BABYLON.Vector3.Zero());
  cam.attachControl(canvas, true);

  //const hLight = new BABYLON.HemisphericLight('hLight', new BABYLON.Vector3(0, 1, 0), scene);
  const dLight = new BABYLON.DirectionalLight('dLight', new BABYLON.Vector3(0.4, -0.8, 0.2), scene);
  const dLight2 = new BABYLON.DirectionalLight('dLight2', new BABYLON.Vector3(-0.6, -0.7, -0.3), scene);
  dLight2.intensity = 0.3;

  //const sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);
  //sphere.position.y = 1;

  /*const cube = BABYLON.Mesh.CreateBox('box1', SZ, scene);
  cube.position.y += SZ/2;
  cube.material = new BABYLON.StandardMaterial('mat1', scene);
  cube.material.wireframe = true;
  cube.material.alpha = 0.5;
  cube.material.emissiveColor = new BABYLON.Color3(1, 1, 1);*/

  //const ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene);



  function voxelFromSRTM(srtmPath, pos, cb) {
    loadSrtmTile(srtmPath, function(srtm) { // funchal lisboa lagos
      console.log('preparing voxel for %s...', srtmPath);

      console.time('voxel ops');
        const av = paintSrtm(srtm);
      console.timeEnd('voxel ops');

      console.time('voxel meshing');
        const vox = av.toBabylon(scene, [400, 800]);
      console.timeEnd('voxel meshing');

      vox.position.x = pos[0];
      vox.position.y = pos[1];
      vox.position.z = pos[2];

      if (cb) {
        cb(vox);
      }

      // scene.render(); // TODO Lazy load
    });
  }

  function paintSrtm(srtm) {
    let av = new AVoxel(SZ);
    let x, y, z;
    for (y = 0; y < SZ; ++y) {
      for (x = 0; x < SZ; ++x) {
        let v = srtm.get(x, y);
        v = Math.round( v / 30 );
        for (z = 0; z < v; ++z) {
          av.add(SZ - 1 - x, z, y, rgb2hex(64 + v*3, 255, 64 + v*3)); // TODO Weird coord mapping?
        }
      }
    }
    return av;
  }



  voxelFromSRTM('funchal.png', [-256, 0, 0]);
  voxelFromSRTM('lisboa.png',  [   0, 0, 0]);
  voxelFromSRTM('lagos.png',   [ 256, 0, 0]);



  return scene;
};
