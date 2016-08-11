
// http://minddesk.com/learn/article.php?id=22
// https://developer.mozilla.org/pt-PT/docs/Web/JavaScript/Reference/Global_Objects/TypedArray

const Qubicle = {

  read: function(ab) {
    const o = {};

    const dv = new DataView(ab);

    let offset = 0;

    let size = 4;
    const versionB = new Uint8Array(ab, offset, size); offset += size;
    o.version = [versionB[0], versionB[1], versionB[2], versionB[3]].join('.');

    o.colorFormat = dv.getUint32(offset, true); offset += size;
    o.colorFormat = (o.colorFormat === 0 ? 'RGBA' : 'BGRA');

    o.zAxisOrientation = dv.getUint32(offset, true); offset += size;
    o.zAxisOrientation = (o.compressed === 0 ? 'left' : 'right');

    o.compressed = dv.getUint32(offset, true); offset += size;
    o.compressed = (o.compressed === 1); // 0=alpha 0 or 255, 1=alpha encodes visible sides

    o.visibilityMaskEncoded = dv.getUint32(offset, true); offset += size;
    o.visibilityMaskEncoded = (o.visibilityMaskEncoded === 1); // 0=alpha 0 or 255, 1=alpha encodes visible sides

    o.numMatrices = dv.getUint32(offset, true); offset += size;

    o.matrices = [];

    function getter(x, y, z) {
      return this.matrix[ x + y*this.size[1] + z*this.size[0] ];
    }

    function setter(x, y, z, val) {
      this.matrix[ x + y*this.size[1] + z*this.size[0] ] = val;
    }

    for (let mI = 0; mI < o.numMatrices; ++mI) {
      const m = {};
      o.matrices.push(m);

      size = 1;
      const nameLen = dv.getUint8(offset); offset += size;

      size = nameLen;
      const nameB = new Uint8Array(ab, offset, size);
      m.name = String.fromCharCode.apply(null, nameB);
      offset += size;

      size = 4;

      m.size = [];
      m.size.push( dv.getUint32(offset, true) ); offset += size;
      m.size.push( dv.getUint32(offset, true) ); offset += size;
      m.size.push( dv.getUint32(offset, true) ); offset += size;

      m.pos = [];
      m.pos.push( dv.getFloat32(offset, true) ); offset += size;
      m.pos.push( dv.getFloat32(offset, true) ); offset += size;
      m.pos.push( dv.getFloat32(offset, true) ); offset += size;

      const I = m.size[0] * m.size[1] * m.size[2];
      const matrix = new Uint32Array(I);
      for (let i = 0; i < I; ++i) {
        matrix[i++] = dv.getUint32(offset, false); offset += size; // TODO: check endian
        // .toString(16)
      }
      // for order is z > y > x
      m.matrix = matrix;
      m.get = getter;
      m.set = setter;
    }
    window.o = o;
    return o;
  },

  write: function(fileName, dims, pos, objWithGetter) {
    const n = fileName.length;
    const I = dims[0] * dims[1] * dims[2];

    const sizeInBytes = 0
    + 4 // 4 * uint8  version
    + 4 // 1 * uint32 colorFormat
    + 4 // 1 * uint32 zAxisOrientation
    + 4 // 1 * uint32 compressed
    + 4 // 1 * uint32 visibilityMaskEncoded
    + 4 // 1 * uint32 numMatrices
    + 1 // 1 * uint8  filename length
    + n // n * uint8  filename string
    + 12 // 3 * uint32  size
    + 12 // 3 * float32 pos
    + 4 * I; // I * uint32 voxel data

    const ab = new ArrayBuffer(sizeInBytes);
    const dv = new DataView(ab);

    let offset = 0;
    let size = 4;
    dv.setUint8(offset,   1); // version
    dv.setUint8(offset+1, 1);
    dv.setUint8(offset+2, 0);
    dv.setUint8(offset+3, 0); offset += size;

    dv.setUint32(offset, 0, true); offset += size; // colorFormat 0=RGBA
    dv.setUint32(offset, 1, true); offset += size; // zAxisOrientation 1=right
    dv.setUint32(offset, 0, true); offset += size; // compressed format 0=RGBA
    dv.setUint32(offset, 0, true); offset += size; // visibilityMaskEncoded format 0=false
    dv.setUint32(offset, 1, true); offset += size; // numMatrices

    size = 1;
    dv.setUint8(offset, n); offset += size;

    for (let sI = 0; sI < n; ++sI) {
      dv.setUint8(offset++, fileName.charCodeAt(sI) );
    }

    size = 4;
    dv.setUint32(offset, dims[0], true); offset += size;
    dv.setUint32(offset, dims[1], true); offset += size;
    dv.setUint32(offset, dims[2], true); offset += size;

    dv.setFloat32(offset, pos[0], true); offset += size;
    dv.setFloat32(offset, pos[1], true); offset += size;
    dv.setFloat32(offset, pos[2], true); offset += size;

    let x, y, z;
    for (z = 0; z < dims[2]; ++z) {
      for (y = 0; y < dims[1]; ++y) {
        for (x = 0; x < dims[0]; ++x) {
          dv.setUint32(offset, objWithGetter.get(x, y, z), false); offset += size; // TODO: check endian
        }
      }
    }

    return ab;
  }

};

module.export = Qubicle;
