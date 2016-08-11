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
      this.data[i] = V;
    }
    return dst;
  }

  subtract (v) { // removes this from v
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

  intersect (dst) { // keeps only in v where both are set
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

  paint (fn) {
    const ws = this.size;
    let x, y, z;
    for (z = 0; z < ws; ++z) {
      for (y = 0; y < ws; ++y) {
        for (x = 0; x < ws; ++x) {
          const block = this.get(x, y, z);
          if (block) {
            const c = fn(x, y, z);
            this.add(x, y, z, c);
          }
        }
      }
    }
  }

  emptyClone () {
    return new AVoxel(this.size);
  }

};

module.exports = AVoxel;
