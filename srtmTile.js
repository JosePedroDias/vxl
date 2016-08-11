'use strict';



function loadSrtmTile(url, cb) {
  const imgEl = document.createElement('img');
  imgEl.src = url;
  document.body.appendChild(imgEl);

  imgEl.onload = function() {
    const W = imgEl.width;
    const H = imgEl.height;

    const o = {
      w    : W,
      h    : H,
      data : new Uint32Array( W * H )
    };

    const canvasEl = document.createElement('canvas');
    canvasEl.width  = W;
    canvasEl.height = H;
    document.body.appendChild(canvasEl);

    const ctx = canvasEl.getContext('2d');
    ctx.drawImage(imgEl, 0, 0);
    const id = ctx.getImageData(0, 0, W, H);

    function unmap2(r, g, b) { return r*256 + g; }

    let x, y;
    for (y = 0; y < H; ++y) {
      for (x = 0; x < W; ++x) {
        const i = 4 * ( W * y + x );
        o.data[W * y + x] = unmap2(id.data[i], id.data[i+1], id.data[i+2]);
      }
    }

    document.body.removeChild(imgEl);
    document.body.removeChild(canvasEl);

    o.get = function(x, y) {
      return this.data[ this.w * y + x ];
    };

    cb(o);
  };
}
