(function() {
  'use strict';

  const π = Math.PI;
  const π2 = 2 * Math.PI;

  const RAD2DEG = 180 / π;
  const DEG2RAD = π / 180;

  const RK = 6373; // mean radius of the earth (km) at 39 degrees from the equator

  const tileDim = 256;



  function seq(n) {
    const arr = new Array(n);
    for (let i = 0; i < n; ++i) {
      arr[i] = i;
    }
    return arr;
  }



  // input:
  // lat [-85.05112877980659, 85.0511287798066]
  // lon [-180, 180]
  // output:
  // x: [-π, π]
  // y: [-π ,π]
  function project1(loc) {
    const λ = π * loc.lon / 180,
          φ = π * loc.lat / 180;
    return {
      x : λ,
      y : Math.log( Math.tan( π/4 + φ/2 ) )
    };
  }



  // zoom 0 -> 2^0 = 1 by 1 tiles of 256x256
  // zoom 17 -> 2^17 = Math.pow(2, 17) = 131072 by 131072
  const powersOf2 = seq(20).map((i) => {
    return Math.pow(2, i);
  });



  // input:
  // x: [-π, π]
  // y: [-π, π]
  // output:
  // x: [0, 1]
  // y: [0, 1]
  function project2(pos) {
    return {
      x: (pos.x+π) / π2,
      y: (pos.y+π) / π2
    };
  }



  // input [0, 1] [0, 1]
  // pixels!
  function project3(pos, zoom) {
    var tilesPerDim = powersOf2[zoom];
    return {
      x: pos.x * tilesPerDim * tileDim,
      y: pos.y * tilesPerDim * tileDim
    };
  };



  // {lat, lon}, zoom -> {x, y}
  function project(loc, zoom) {
    return project3( project2( project1(loc) ), zoom);
  }



  // used by google maps and microsoft earth
  function tileIndicesGoogle(loc, zoom) {
    const pos = project2( project1(loc) );
    const t = powersOf2[zoom];
    return {
      x:     Math.round(pos.x * t),
      y: t - Math.round(pos.y * t) - 1
    };
  }



  // used by openstreetmaps
  function tileIndicesTMS(loc, zoom) {
    const pos = project2( project1(loc) );
    const t = powersOf2[zoom];
    return {
      x: Math.round(pos.x * t),
      y: Math.round(pos.y * t)
    };
  }



  // loc with x and y
  function fromTileIndicesGoogle(loc, zoom) {
    const t = powersOf2[zoom];
    return {
      lon: loc.x / t * 360 - 180,
      lat: Math.atan( Math.sinh(π * (1 - 2 * loc.y / t) ) ) * RAD2DEG
    };
  }



  function tileBoundsGoogle(loc, zoom) {
    const a = fromTileIndicesGoogle(loc, zoom);
    const b = fromTileIndicesGoogle({x:loc.x+1, y:loc.y+1}, zoom);
    return {
      min: a,
      max: b
    };
  }



  function tmsToGoogleToggleY(y, zoom) {
    const t = powersOf2[zoom];
    return t - y - 1;
  }



  function distance(a, b) {
    // convert coordinates to radians
    const lat1 = DEG2RAD * a.lat;
    const lon1 = DEG2RAD * a.lon;
    const lat2 = DEG2RAD * b.lat;
    const lon2 = DEG2RAD * b.lon;

    // find the differences between the coordinates
    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;

    // here's the heavy lifting
    const aa = Math.pow(
            Math.sin(dlat/2),
            2
        ) +
        Math.pow(
            Math.sin(dlon/2) *
            Math.cos(lat1) *
            Math.cos(lat2),
            2
        );

    const c = 2 * Math.atan2(
        Math.sqrt(aa),
        Math.sqrt(1-aa)
    ); // great circle distance in radians

    const dk = c * RK; // great circle distance in km

    // round the results down to the nearest 1/1000
    const km = Math.round( dk * 1000) / 1000;

    return km;
  }



  window.geo = {
    project               : project,
    tileIndicesGoogle     : tileIndicesGoogle,
    tileIndicesTMS        : tileIndicesTMS,
    fromTileIndicesGoogle : fromTileIndicesGoogle,
    tileBoundsGoogle      : tileBoundsGoogle,
    tmsToGoogleToggleY    : tmsToGoogleToggleY,
    distance              : distance
  };

})();
