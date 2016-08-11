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

  //const sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);
  //sphere.position.y = 1;

  const cube = BABYLON.Mesh.CreateBox('box1', SZ, scene);
  cube.position.y += SZ/2;
  cube.material = new BABYLON.StandardMaterial('mat1', scene);
  cube.material.wireframe = true;
  cube.material.alpha = 0.5;
  cube.material.emissiveColor = new BABYLON.Color3(1, 1, 1);

  //const ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene);



  /*
  console.time('voxel ops');
    let av = new AVoxel(SZ);
    //av.add(0, 0, 0, 0xFF0000);
    //av.add(2, 2, 2, 0x00FF00);

    av.addSphere(SZ/2, SZ/2, SZ/2, SZ*0.6, 0xFF0000);
    av = av.inverted();

    //av.addBox(0, 0, 0, 15, 31, 31, 0x00FF00);
  console.timeEnd('voxel ops');

  console.time('voxel paint');
    const RED   = [255, 0, 0];
    const GREEN = [0, 255, 0];

    function mult(fn1, fn2) {
      return function(x, y, z) {
        const a = fn1(x, y, z);
        const b = fn2(x, y, z);
        return [
          a[0] * b[0],
          a[1] * b[1],
          a[2] * b[2]
        ];
      }
    }

    function dashN(i, n) {
      return ((i % n) < n/2);
    }


    // fns
    function dash4y(x, y, z) {
      return dashN(y, 8) ? RED : GREEN;
    }

    function checkered8(x, y, z) {
      let on = dashN(x, 16);
      on ^= dashN(y, 16);
      on ^= dashN(z, 16);
      return on ? RED : GREEN;
    }

    function gradientY64(x, y, z) {
      return [32, y/SZ*255, 32];
    }

    av.paint(checkered8); // dash4y checkered8 gradientY64 mult(checkered8, gradientY64)
  console.timeEnd('voxel paint');

  console.time('voxel meshing');
    const vox = av.toBabylon('vox', scene);
  console.timeEnd('voxel meshing');
  */



  function hex2rgb(hex) {
    return [
      (hex >> 16) & 255,
      (hex >>  8) & 255,
       hex        & 255
    ];
  }



  loadSrtmTile('funchal.png', function(o) { // funchal lisboa lagos
    console.time('voxel ops');
      let av = new AVoxel(SZ);
      let x, y, z;
      for (y = 0; y < SZ; ++y) {
        for (x = 0; x < SZ; ++x) {
          let v = o.get(x, y);
          v = Math.round( v / 30 );
          for (z = 0; z < v; ++z) {
            av.add(SZ - 1 - x, z, y, rgb2hex(64 + v*3, 255, 64 + v*3)); // TODO Weird coord mapping?
          }
        }
      }
    console.timeEnd('voxel ops');

    //av = av.simplify();
    //av = av.simplify();
    //av = av.simplify();

    console.time('voxel meshing');
      const vox = av.toBabylon('vox', scene);
      vox.position.y += SZ/2;
    console.timeEnd('voxel meshing');

    if (true) {
      vox.receiveShadows = true;
      const shadowGenerator = new BABYLON.ShadowGenerator(1024, dLight);
      shadowGenerator.getShadowMap().renderList.push(vox);
      shadowGenerator.usePoissonSampling = true;
      // shadowGenerator.bias = 0.00001;
    }
  });

  return scene;
};
