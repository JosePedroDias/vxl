
// babylon voxel custom colors
function hex2rgb(hex) {
  return [
    (hex >> 16) & 255,
    (hex >>  8) & 255,
     hex        & 255
  ];
}

function rgb2hex(r, g, b) {
  return ((r << 16) + (g << 8) + b);
}

function rndId() {
  return ( ~~( Math.random() * Math.pow(2, 24) ) ).toString(32);
}

function clone(o) {
  return JSON.parse( JSON.stringify(o) );
}



class AVoxel {

  constructor (size) {
    this.size = size;
    this.xx = size;
    this.yy = size;
    this.zz = size;
    this.xxyy = this.xx * this.yy;
    this.xyz = this.xx * this.yy * this.zz;
    this.data = new Uint32Array( this.xyz );
  }

  add (x, y, z, clr) {
    this.data[ x + y*this.xx + z*this.xxyy ] = clr;
  }

  rem (x, y, z) {
    this.data[ x + y*this.xx + z*this.xxyy ] = 0;
  }

  get (x, y, z) {
    return this.data[ x + y*this.xx + z*this.xxyy ];
  }

  getClone () {
    return new AVoxel(this.size);
  }

  addBox (x0, y0, z0, x1, y1, z1, clr) {
    const ws = this.size;
    if (x0 < 0) { x0 = 0; }
    if (y0 < 0) { y0 = 0; }
    if (z0 < 0) { z0 = 0; }
    if (x1 >= ws) { x1 = ws - 1; }
    if (y1 >= ws) { y1 = ws - 1; }
    if (z1 >= ws) { z1 = ws - 1; }
    let x, y, z;
    for (z = z0; z <= z1; ++z) {
      for (y = y0; y <= y1; ++y) {
        for (x = x0; x <= x1; ++x) {
          this.add(x, y, z, clr);
        }
      }
    }
  }

  addSphere (xc, yc, zc, r, clr) {
    const ws = this.size;
    let x, y, z;
    for (z = 0; z < ws; ++z) {
      for (y = 0; y < ws; ++y) {
        for (x = 0; x < ws; ++x) {
          const dx = x - xc;
          const dy = y - yc;
          const dz = z - zc;
          if (Math.sqrt( dx*dx + dy*dy + dz*dz ) > r) { continue; }

          this.add(x, y, z, clr);
        }
      }
    }
  }

  inverted (dst) {
    if (!dst) { dst = this.emptyClone(); }
    for (let i = 0; i < this.xyz; ++i) {
      const v = this.data[i];
      const V = (v === 0) ? 0xFFFFFF : 0;
      dst.data[i] = V;
    }
    return dst;
  }

  subtract (v) { // removes this from v TODO CHECK
    const ws = this.size;
    const wsV = v.size;
    let x, y, z, dx, dy, dz;
    for (dz = 0; dz < wsV; ++dz) {
      z = z0 + dz;
      if (z >= ws) { break; }
      for (dy = 0; dy < wsV; ++dy) {
        y = y0 + dy;
        if (y >= ws) { break; }
        for (dx = 0; dx < wsV; ++dx) {
          x = x0 + dx;
          if (x >= ws) { break; }
          if (!v.get(x, y, z)) { continue; }
          v.rem(x, y, z);
        }
      }
    }
    return v;
  }

  intersect (dst) { // keeps only in v where both are set TODO CHECK
    const ws = this.size;
    const wsV = v.size;
    let x, y, z, dx, dy, dz;
    for (dz = 0; dz < wsV; ++dz) {
      z = z0 + dz;
      if (z >= ws) { break; }
      for (dy = 0; dy < wsV; ++dy) {
        y = y0 + dy;
        if (y >= ws) { break; }
        for (dx = 0; dx < wsV; ++dx) {
          x = x0 + dx;
          if (x >= ws) { break; }
          if (!v.get(x, y, z) || !this.get(x, y, z)) {
            v.rem(x, y, z);
          }
          else {
            v.add(x, y, z, 0xFFFFFF);
          }
        }
      }
    }
    return v;
  }

  simplify (dst) {
    if (!dst) { dst = new AVoxel(this.size/2); }

    const ws = this.size;
    let x, y, z;
    for (z = 0; z < ws; ++z) {
      if (z % 2) { continue; }
      for (y = 0; y < ws; ++y) {
        if (y % 2) { continue; }
        for (x = 0; x < ws; ++x) {
          if (x % 2) { continue; }
          const clr = this.get(x, y, z);
          dst.add(x/2, y/2, z/2, clr);
        }
      }
    }

    return dst;
  }

  paint (fn) {
    const ws = this.size;
    let x, y, z;
    for (z = 0; z < ws; ++z) {
      for (y = 0; y < ws; ++y) {
        for (x = 0; x < ws; ++x) {
          const block = this.get(x, y, z);
          if (block) {
            const c = fn(x, y, z);
            this.add(x, y, z, rgb2hex(c[0], c[1], c[2]));
          }
        }
      }
    }
  }

  traverse (fn) {
    const ws = this.size;
    let x, y, z;
    for (z = 0; z < ws; ++z) {
      for (y = 0; y < ws; ++y) {
        for (x = 0; x < ws; ++x) {
          const block = this.get(x, y, z);
          if (block) {
            fn(x, y, z, block);
          }
        }
      }
    }
  }

  _toBabylon (id, scene, scale) {
    const SZ = this.size;
    const vox = new CEWBS.VoxelMesh(id, scene);
    vox.setDimensions([SZ, SZ, SZ]);
    this.traverse((x, y, z, c) => {
      vox.setVoxelAt([x, y, z], c);
    });

    vox.coloringFunction = hex2rgb;
    vox.updateMesh();

    let isEmpty = false;

    vox.updateMeshPositions(function(positions) {
      if (positions === null) {
        isEmpty = true;
        return;
      }
      positions.forEach(function(p, i) {
        const ii = i % 3;
        const v = positions[i];
        if (ii === 1) {
          positions[i] = v * scale;
        }
        else {
          positions[i] = (v - SZ/2) * scale;
        }
      });
    }, false);

    if (isEmpty) { return vox; }

    vox.refreshBoundingInfo();
    vox.showBoundingBox = true; // TODO DEBUG

    return vox;
  }

  toBabylon(scene, lodDists) {
    lodDists = clone(lodDists);

    let scale = 1;
    let firstVox, lastVox;
    let lastAv = this;
    const id = rndId();

    // TODO skip best zoom level
    if (true) {
      scale *= 2;
      lastAv = lastAv.simplify();
    }

    firstVox = lastAv._toBabylon(id, scene, scale);
    lastVox = firstVox;

    let dist;
    while (dist = lodDists.shift()) {
      scale *= 2;
      lastAv = lastAv.simplify();
      lastVox = lastAv._toBabylon([id, scale].join('_'), scene, scale);
      firstVox.addLODLevel(dist, lastVox);
    }

    return firstVox;
  }

  emptyClone () {
    return new AVoxel(this.size);
  }

};

//module.exports = AVoxel;
