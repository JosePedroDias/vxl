'use strict';


function assert(a) {
  if (!a) {
    throw 'assertion error!';
  }
}


function plotLine(x0, y0, x1, y1, c) {
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


function plotCircle(xm, ym, r, c) {
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


function plotQuadBezierSeg(x0, y0, x1, y1, x2, y2, c) {                                  /* plot a limited quadratic Bezier segment */
  let sx = x2-x1, sy = y2-y1;
  let xx = x0-x1, yy = y0-y1, xy;               /* relative values for checks */
  let dx, dy, err, cur = xx*sy-yy*sx;                            /* curvature */

  assert(xx*sx <= 0 && yy*sy <= 0);       /* sign of gradient must not change */

  if (sx*sx+sy*sy > xx*xx+yy*yy) {                 /* begin with shorter part */
    x2 = x0; x0 = sx+x1; y2 = y0; y0 = sy+y1; cur = -cur;       /* swap P0 P2 */
  }
  if (cur != 0) {                                         /* no straight line */
    xx += sx; xx *= sx = x0 < x2 ? 1 : -1;                /* x step direction */
    yy += sy; yy *= sy = y0 < y2 ? 1 : -1;                /* y step direction */
    xy = 2*xx*yy; xx *= xx; yy *= yy;               /* differences 2nd degree */
    if (cur*sx*sy < 0) {                                /* negated curvature? */
      xx = -xx; yy = -yy; xy = -xy; cur = -cur;
    }
    dx = 4.0*sy*cur*(x1-x0)+xx-xy;                  /* differences 1st degree */
    dy = 4.0*sx*cur*(y0-y1)+yy-xy;
    xx += xx; yy += yy; err = dx+dy+xy;                     /* error 1st step */
    do {
      setPixel(x0, y0, c);                                          /* plot curve */
      if (x0 == x2 && y0 == y2) return;       /* last pixel -> curve finished */
      y1 = 2*err < dx;                       /* save value for test of y step */
      if (2*err > dy) { x0 += sx; dx -= xy; err += dy += yy; }      /* x step */
      if (    y1    ) { y0 += sy; dy -= xy; err += dx += xx; }      /* y step */
    } while (dy < 0 && dx > 0);        /* gradient negates -> algorithm fails */
  }
  plotLine(x0,y0, x2,y2, c);                       /* plot remaining part to end */
}


function plotQuadBezier(x0, y0, x1, y1, x2, y2, c) {                                          /* plot any quadratic Bezier curve */
   let x = x0-x1, y = y0-y1, t = x0-2*x1+x2, r;

   if (x*(x2-x1) > 0) {                              /* horizontal cut at P4? */
      if (y*(y2-y1) > 0)                           /* vertical cut at P6 too? */
         if (Math.abs((y0-2*y1+y2)/t*x) > Math.abs(y)) {      /* which first? */
            x0 = x2; x2 = x+x1; y0 = y2; y2 = y+y1;            /* swap points */
         }                            /* now horizontal cut at P4 comes first */
      t = (x0-x1)/t;
      r = (1-t)*((1-t)*y0+2.0*t*y1)+t*t*y2;                       /* By(t=P4) */
      t = (x0*x2-x1*x1)*t/(x0-x1);                       /* gradient dP4/dx=0 */
      x = Math.floor(t+0.5); y = Math.floor(r+0.5);
      r = (y1-y0)*(t-x0)/(x1-x0)+y0;                  /* intersect P3 | P0 P1 */
      plotQuadBezierSeg(x0,y0, x,Math.floor(r+0.5), x,y, c);
      r = (y1-y2)*(t-x2)/(x1-x2)+y2;                  /* intersect P4 | P1 P2 */
      x0 = x1 = x; y0 = y; y1 = Math.floor(r+0.5);        /* P0 = P4, P1 = P8 */
   }
   if ((y0-y1)*(y2-y1) > 0) {                          /* vertical cut at P6? */
      t = y0-2*y1+y2; t = (y0-y1)/t;
      r = (1-t)*((1-t)*x0+2.0*t*x1)+t*t*x2;                       /* Bx(t=P6) */
      t = (y0*y2-y1*y1)*t/(y0-y1);                       /* gradient dP6/dy=0 */
      x = Math.floor(r+0.5); y = Math.floor(t+0.5);
      r = (x1-x0)*(t-y0)/(y1-y0)+x0;                  /* intersect P6 | P0 P1 */
      plotQuadBezierSeg(x0,y0, Math.floor(r+0.5),y, x,y, c);
      r = (x1-x2)*(t-y2)/(y1-y2)+x2;                  /* intersect P7 | P1 P2 */
      x0 = x; x1 = Math.floor(r+0.5); y0 = y1 = y;        /* P0 = P6, P1 = P7 */
   }
   plotQuadBezierSeg(x0,y0, x1,y1, x2,y2, c);                  /* remaining part */
}


function plotQuadBezierCurve(curve, c_) {
  const l = curve.length;
  for (let i = 0; i < l - 3; ++i) { // 0 2 1, 1 3 2
    const a = curve[i];
    const b = curve[i+1];
    const c = curve[i+2];
    const d = curve[i+3];
    plotQuadBezier(a[0], a[1], c[0], c[1], b[0], b[1], c_);
    plotQuadBezier(b[0], b[1], d[0], d[1], c[0], c[1], c_);
  }
}


function floodFillScanline(x, y, width, height, test, paint) {
    // xMin, xMax, y, down[true] / up[false], extendLeft, extendRight
    var ranges = [[x, x, y, null, true, true]];
    paint(x, y);

    while(ranges.length) {
        var r = ranges.pop();
        var down = r[3] === true;
        var up =   r[3] === false;

        // extendLeft
        var minX = r[0];
        var y = r[2];
        if(r[4]) {
            while(minX>0 && test(minX-1, y)) {
                minX--;
                paint(minX, y);
            }
        }
        var maxX = r[1];
        // extendRight
        if(r[5]) {
            while(maxX<width-1 && test(maxX+1, y)) {
                maxX++;
                paint(maxX, y);
            }
        }

        r[0]--;
        r[1]++;

        function addNextLine(newY, isNext, downwards) {
            var rMinX = minX;
            var inRange = false;
            for(var x=minX; x<=maxX; x++) {
                // skip testing, if testing previous line within previous range
                var empty = (isNext || (x<r[0] || x>r[1])) && test(x, newY);
                if(!inRange && empty) {
                    rMinX = x;
                    inRange = true;
                }
                else if(inRange && !empty) {
                    ranges.push([rMinX, x-1, newY, downwards, rMinX==minX, false]);
                    inRange = false;
                }
                if(inRange) {
                    paint(x, newY);
                }
                // skip
                if(!isNext && x==r[0]) {
                    x = r[1];
                }
            }
            if(inRange) {
                ranges.push([rMinX, x-1, newY, downwards, rMinX==minX, true]);
            }
        }

        if(y<height)
            addNextLine(y+1, !up, true);
        if(y>0)
            addNextLine(y-1, !down, false);
    }
}


function plotLines(lines, c, isClosed) {
  const n = lines.length;
  for (let i = 0; i < n-1; ++i) {
    const a = lines[i];
    const b = lines[i+1];
    plotLine(a[0], a[1], b[0], b[1], c);
  }
  if (isClosed) {
    const a = lines[n-1];
    const b = lines[0];
    plotLine(a[0], a[1], b[0], b[1], c);
  }
}


function scanlinePolygonFill(poly, c) {
  poly.forEach(function(p, i) { p.push(String.fromCharCode(65+i)) });

  // 1
  const n = poly.length;

  // 2
  const x = poly.map(p => p[0]);
  const y = poly.map(p => p[1]);

  // 3
  const ym = Math.min.apply(null, y);
  const yM = Math.max.apply(null, y);

  //4
  const segments = [];
  for (let i = 0; i < n; ++i) {
    const a = poly[i === 0 ? n-1 : i-1];
    const b = poly[i];
    //console.log('%s %s', i === 0 ? n-1 : i-1, i);
    let y0, y1, x0, x1, lbl;
    if (a[1] < b[1]) {
      lbl = [ a[2] , b[2] ].join(' -> ');
      y0 = a[1]; y1 = b[1];
      x0 = a[0]; x1 = b[0];
    }
    else {
      lbl = [ b[2] , a[2] ].join(' -> ');
      y0 = b[1]; y1 = a[1];
      x0 = b[0]; x1 = a[0];
    }
    const m = (y0 - y1) / (x0 - x1);
    segments.push({
      lbl: lbl,
      y0: y0,
      y1: y1,
      x0: x0,
      x1: x1,
      dx: 1 / m
    });
  }

  function sign(n) { return ((n < 0) ? -1 : ((n > 0) ? 1 : 0)); }

  // 5
  function sortSegs() {
    segments.sort(function(a, b) { return sign(a.x1-b.x1); }); // 3rd criteria, asc x1
    //segments.sort(function(a, b) { return sign(b.y1-a.y1); }); // 2nd criteria, desc y1
    //segments.sort(function(a, b) { return sign(b.y0-a.y0); }); // 1st criteria, desc y0
  }
  sortSegs();

  console.log('poly:');
  poly.forEach(function(p) {
    console.log('  %s: %s, %s', p[2], p[0], p[1]);
  });

  //console.log('x', x);
  //console.log('y', y);
  console.log('ym:%s yM:%s', ym, yM);
  console.log('segments\n' + JSON.stringify(segments, null, '  '));

  let xPrev = -1;

  // 6
  return;
  for (let y = yM; y >= ym; --y) {
    segments.forEach(function(seg) {
      //if (seg.y0 < y || seg.y1 > y) { return; } // TODO

      if (xPrev === -1) {
        xPrev = seg.x0;
      }
      else {
        for (let x = xPrev; x <= seg.x0; ++x) {
          //console.log('[%s,%s]', xPrev, x);
          setPixel(x, y, c);
        }
        xPrev = -1;
      }

      setPixel(seg.x0, y, c);
    });
  }
}


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


function measureText(x, y, txt) {
  let len = 0;
  txt.split('').forEach(function(k) {
    len += alphabetLen[k] + 1;
  });
  return len - 1;
}


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
