/*

  Builds on raster.js, this time drawing to a CANVAS element.
  Requires calling .bake() to blit imageData back to canvas.

 */


(function() {
  'use strict';


  function rgba2hex(r, g, b, a) {
    return (
      (r << 24) +
      (g << 16) +
      (b <<  8) +
       a
    );
  }

  function hex2rgba(h) {
    return [
      (h >> 24) & 255, // R
      (h >> 16) & 255, // G
      (h >>  8) & 255, // B
       h        & 255  // A
    ];
  }



  window.getRasterCanvas = function(canvasEl) {
    const W = canvasEl.width;
    const H = canvasEl.height;
    const ctx = canvasEl.getContext('2d');
    const id = ctx.getImageData(0, 0, W, H);

    const setPixel = function(x, y, c) {
      if (x < 0 || y < 0 || x >= W || y >= H) { return; }
      const channels = hex2rgba(c);
      //console.log(channels);
      let i = (W * y + x) * 4;
      id.data[i++] = channels[0];
      id.data[i++] = channels[1];
      id.data[i++] = channels[2];
      id.data[i  ] = channels[3];
    };

    const getPixel = function(x, y) {
      let i = (W * y + x) * 4;
      const r = id.data[i++];
      const g = id.data[i++];
      const b = id.data[i++];
      const a = id.data[i  ];
      const h = rgba2hex(r, g, b, a);
      return h;
    }

    const api = window.getRaster(setPixel);

    api.getPixel = getPixel;
    api.setPixel = setPixel;

    api.bake = function() {
      ctx.putImageData(id ,0, 0);
    };

    return api;
  };

})();
