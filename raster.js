/*
  PUBLIC API

  getRaster( function setPixel(x, y, color) )

  returns an abstract API for drawing the following:
    .drawLine(x0, y0, x1, y1, clr)
    .drawLines(arrOfPoints, clr, isClosed)
    .drawCircle(xc, yc, r, clr)
    .fillCircle(xc, yc, r, clr)
    .fillPoly(arrOfPoints, clr)

*/


(function() {
  'use strict';

const alphabet = {
  0:`
 0
0 0
0 0
0 0
 0`, 1:`
0
0
0
0
0`, 2:`
00
  0
 0
0
000`, 3:`
00
  0
00
  0
00`, 4:`
0 0
0 0
000
  0
  0`, 5:`
000
0
00
  0
00`, 6:`
 00
0
00
0 0
 0`, 7:`
000
  0
  0
 0
 0`, 8:`
 0
0 0
 0
0 0
 0`, 9:`
 0
0 0
 00
  0
00`, A:`
 0
0 0
000
0 0
0 0`, B:`
00
0 0
00
0 0
00`, C:`
 00
0
0
0
 00`, D:`
00
0 0
0 0
0 0
00`, E:`
000
0
00
0
000`, F:`
000
0
00
0
0`
};

  const alphabetLen = {};
  for (let k in alphabet) {
    let v = alphabet[k];
    v = v.substring(1).split('\n');
    let len = v.map(function(l) { return l.length; });
    len = Math.max.apply(null, len);
    alphabetLen[k] = len;
    alphabet[k] = v;
  }
  //console.log(alphabet);



  window.getRaster = function(setPixel) {

    const API = {};


    function drawLine(x0, y0, x1, y1, c) {
      let dx =  Math.abs(x1-x0), sx = x0<x1 ? 1 : -1;
      let dy = -Math.abs(y1-y0), sy = y0<y1 ? 1 : -1;
      let err = dx+dy, e2;                                   /* error value e_xy */

      for (;;){                                                          /* loop */
        setPixel(x0, y0, c);
        if (x0 == x1 && y0 == y1) break;
        e2 = 2*err;
        if (e2 >= dy) { err += dy; x0 += sx; }                        /* x step */
        if (e2 <= dx) { err += dx; y0 += sy; }                        /* y step */
      }
    }
    API.drawLine = drawLine;


    function drawLines(lines, c, isClosed) {
      const n = lines.length;
      for (let i = 0; i < n-1; ++i) {
        const a = lines[i];
        const b = lines[i+1];
        drawLine(a[0], a[1], b[0], b[1], c);
      }
      if (isClosed) {
        const a = lines[n-1];
        const b = lines[0];
        drawLine(a[0], a[1], b[0], b[1], c);
      }
    }
    API.drawLines = drawLines;


    function drawCircle(xm, ym, r, c) {
      let x = -r, y = 0, err = 2-2*r;                /* bottom left to top right */
      do {
        setPixel(xm-x, ym+y, c);                            /*   I. Quadrant +x +y */
        setPixel(xm-y, ym-x, c);                            /*  II. Quadrant -x +y */
        setPixel(xm+x, ym-y, c);                            /* III. Quadrant -x -y */
        setPixel(xm+y, ym+x, c);                            /*  IV. Quadrant +x -y */
        r = err;
        if (r <= y) err += ++y*2+1;                                   /* y step */
        if (r > x || err > y) err += ++x*2+1;                         /* x step */
      } while (x < 0);
    }
    API.drawCircle = drawCircle;


    function fillCircle(xm, ym, r, c) {
      let xi, x = -r, y = 0, err = 2-2*r;
      do {
        for (xi = xm+x; xi <= xm-x; ++xi) {
          setPixel(xi, ym-y, c);
          setPixel(xi, ym+y, c);
        }
        r = err;
        if (r <= y) err += ++y*2+1;
        if (r > x || err > y) err += ++x*2+1;
      } while (x < 0);
    }
    API.fillCircle = fillCircle;


    // scanline aux funcs

    function sign(n) {
      return ((n < 0) ? -1 : ((n > 0) ? 1 : 0));
    }

    function sortSegs(segments) {
      segments.sort(function(a, b) { return sign(a.x1-b.x1); }); // 3rd criteria, asc x1
      segments.sort(function(a, b) { return sign(b.y1-a.y1); }); // 2nd criteria, desc y1
      segments.sort(function(a, b) { return sign(b.y0-a.y0); }); // 1st criteria, desc y0
      //return segments;
    }

    function electSegs(segments, y) {
      return segments.filter(function(s) {
        //console.log('y', y, 'y0', s.y0, 'y1', s.y1, '?', (y >= s.y0 && y < s.y1));
        return (y >= s.y0 && y < s.y1);
      });
    }

    function segIntersection(s, y) { // s -> x0,x1, y0,y1, dx
      let xi, yi;
      if (xi in s) {
        yi = s.yi;
        xi = s.xi;
      }
      else {
        yi = s.y1;
        xi = s.x1;
      }

      while (y !== yi) {
        --yi;
        xi -= s.dx;
      }

      s.xi = xi;
      s.yi = yi;

      return xi;

      //return Math.floor(xi);
    }


    function fillPoly(poly, c) { // scanlinePolygonFill
      poly.forEach(function(p, i) { p.push(String.fromCharCode(65+i)) });

      // 1
      const n = poly.length;

      // 2
      //const xx = poly.map(p => p[0]);
      const yy = poly.map(p => p[1]);

      // 3
      const ym = Math.min.apply(null, yy);
      const yM = Math.max.apply(null, yy);

      //4
      const segments = [];
      for (let i = 0; i < n; ++i) {
        const a = poly[i === 0 ? n-1 : i-1];
        const b = poly[i];
        let y0, y1, x0, x1, lbl;
        if (a[1] < b[1]) {
          y0 = a[1]; y1 = b[1];
          x0 = a[0]; x1 = b[0];
        }
        else {
          y0 = b[1]; y1 = a[1];
          x0 = b[0]; x1 = a[0];
        }
        const m = (y0 - y1) / (x0 - x1);
        segments.push({
          y0: y0,
          y1: y1,
          x0: x0,
          x1: x1,
          dx: 1 / m
        });
      }

      // 5
      /*segments = */sortSegs(segments);

      let y;
      for (y = yM; y >= ym; --y) { // 6
        let ael = electSegs(segments, y); // 7

        let inter = ael.map(function(s) { return segIntersection(s, y); });
        inter = inter.sort( function(a, b) { return sign(a - b); });

        const n = inter.length;
        for (let i = 0; i < n/2; ++i) {
          const x0 = Math.floor( inter[i*2]   );
          const x1 = Math.ceil(  inter[i*2+1] );
          for (let x = x0; x <= x1; ++x) {
            setPixel(x, y, c);
          }
        }
      }
    }

    API.fillPoly = fillPoly;


    function measureText(x, y, txt) {
      let len = 0;
      txt.split('').forEach(function(k) {
        len += alphabetLen[k] + 1;
      });
      return len - 1;
    }
    API.measureText = measureText;


    function drawText(x, y, txt, c) {
      let xx = x;
      txt.split('').forEach(function(k) {
        const v = alphabet[k];
        v.forEach(function(l, dy) {
          l.split('').forEach(function(chr, dx) {
            if (chr === '0') {
              setPixel(xx+dx, y+dy, c);
            }
          });
        });
        xx += alphabetLen[k] + 1;
      });
    }
    API.drawText = drawText;


    return API;

  };

})();
