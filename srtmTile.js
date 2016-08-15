'use strict';



function loadSrtmTile(url, cb) {
  const imgEl = document.createElement('img');
  imgEl.crossOrigin = 'Anonymous'; // only works for * CORS
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
      //return 100;
    };

    cb(o);
  };
}



function loadSrtmTile4(url, cb) {
  loadSrtmTile(url, function(o) {
    const H = o.h/2;
    const w2 = o.w;// / 2;
    const h2 = o.h;// / 2;

    const a = { data:o.data, w:w2, h:h2 }; a.g = o.get; a.get = function(x, y) { return this.g(x,   y);   }
    const b = { data:o.data, w:w2, h:h2 }; b.g = o.get; b.get = function(x, y) { return this.g(x+H, y);   }
    const c = { data:o.data, w:w2, h:h2 }; c.g = o.get; c.get = function(x, y) { return this.g(x,   y+H); }
    const d = { data:o.data, w:w2, h:h2 }; d.g = o.get; d.get = function(x, y) { return this.g(x+H, y+H); }

    cb([a, b, c, d]);

  });
}
