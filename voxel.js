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
  const SZ = 128;

  const scene = new BABYLON.Scene(engine);

  // scene.debugLayer.show();

  //const cam = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, SZ*2, -SZ*4), scene);
  const cam = new BABYLON.ArcRotateCamera('camera1', 1, 0.8, SZ*1.2, new BABYLON.Vector3(0, 0 - SZ/2, 0), scene);
  cam.setTarget(BABYLON.Vector3.Zero());
  cam.attachControl(canvas, true);

  //const hLight = new BABYLON.HemisphericLight('hLight', new BABYLON.Vector3(0, 1, 0), scene);
  const dLight = new BABYLON.DirectionalLight('dLight', new BABYLON.Vector3(0.4, -0.8, 0.2), scene);
  //const dLight2 = new BABYLON.DirectionalLight('dLight2', new BABYLON.Vector3(-0.6, -0.7, -0.3), scene);
  //dLight2.intensity = 0.3;

  //const sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);
  //sphere.position.y = 1;

  /*const cube = BABYLON.Mesh.CreateBox('box1', SZ, scene);
  cube.position.y += SZ/2;
  cube.material = new BABYLON.StandardMaterial('mat1', scene);
  cube.material.wireframe = true;
  cube.material.alpha = 0.5;
  cube.material.emissiveColor = new BABYLON.Color3(1, 1, 1);*/

  //const ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene);



  const LOD_DISTS = [400, 800];
  //const LOD_DISTS = []; // disables LOD

  let totalJobs = 0;
  let finishedJobs = 0;

  document.title = '0%';

  function voxelFromSRTM(srtmPath, pos, cb) {
    const clock = false;

    totalJobs += 4;

    loadSrtmTile4(srtmPath, function(srtms) { // funchal lisboa lagos
      srtms.forEach(function(srtm, i) {
        if (i === 0) console.log('preparing voxel for %s...', srtmPath);

        if (clock) console.time('voxel ops');
          const av = paintSrtm(srtm);
        if (clock) console.timeEnd('voxel ops');

        if (clock) console.time('voxel meshing');
          const vox = av.toBabylon(scene, LOD_DISTS);
        if (clock) console.timeEnd('voxel meshing');

        vox.position.x = pos[0] + (i % 2 ? 0 : SZ);
        vox.position.y = pos[1];
        vox.position.z = pos[2] + (i < 2 ? 0 : SZ);

        let parts = srtmPath.split(/[\.\/]/);
        const coords = [];
        parts.pop();
        coords.unshift( parts.pop() );
        coords.unshift( parts.pop() );

        const label = createBillboardLabel(scene, coords.join(','));
        label.position.x = pos[0];
        label.position.y = pos[1] + 16;
        label.position.z = pos[2];

        ++finishedJobs;

        document.title = `${ ~~(finishedJobs/totalJobs * 100) }%`;

        if (cb) {
          cb(vox);
        }

        // scene.render(); // TODO Lazy load
      });
    });
  }

  function paintSrtm(srtm) {
    let av = new AVoxel(SZ);
    let x, y, z;
    for (y = 0; y < SZ; ++y) {
      for (x = 0; x < SZ; ++x) {
        let v = srtm.get(x, y);
        v = Math.round( v / 30 );
        if (v > SZ) { throw `v too high ${v} at ${x},${y}`; }
        const v2 = Math.min(v*6, 255);
        const v3 = Math.min(64 + v2*2, 255);
        for (z = 0; z < v; ++z) {
          av.add(SZ - 1 - x, z, y, rgb2hex(v2, v3, v2)); // TODO Weird coord mapping?
          //av.add(SZ - 1 - x, z, y, rgb2hex(255, 0, 255)); // TODO Weird coord mapping?
        }
      }
    }
    return av;
  }



  let x0, y0, dx, dy;
  //x0=486; y0=626; dx=3; dy=2; // sagres
  //x0=485; y0=632; dx=3; dy=3; // lisboa
  //x0=462; y0=610; dx=3; dy=2; // funchal
  //x0=485; y0=631; dx=1; dy=1; // lx2
  //x0=488; y0=636; dx=3; dy=3; // serra da estrela FAILS
  x0=488; y0=636; dx=2; dy=2; // serra da estrela1.5
  //x0=489; y0=634; dx=2; dy=2; // serra da estrela2 FAILS

  let x, y;
  for (y = 0; y < dy; ++y) {
    for (x = 0; x < dx; ++x) {
      const url = `http://127.0.0.1:9999/10/${x0+x}/${y0-y}.png`;
      const pos = [2*SZ*(-x+dx/2-0.5), 0, 2*SZ*(y-dy/2+0.5)];
      //console.log(url, pos);
      voxelFromSRTM(url, pos);
    }
  }


  //voxelFromSRTM('funchal.png', [-256, 0, 0]);
  //voxelFromSRTM('lisboa.png',  [   0, 0, 0]);
  //voxelFromSRTM('lagos.png',   [ 256, 0, 0]);



  return scene;
};
