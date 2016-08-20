(function() {
  'use strict';

  const server = 'http://overpass-api.de/api/interpreter?data=';
  const format = '[out:json][timeout:25];'; //
  const roadsQuery = 'way["highway"~"."]({{BOUNDS}});out geom;';
  const buildingsQuery = 'way["building"]({{BOUNDS}});out geom;';


  function ajax(url, cb) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    const cbInner = function() {
      if (xhr.readyState === 4 && xhr.status > 199 && xhr.status < 300) {
        return cb(null, JSON.parse(xhr.response));
      }
      cb('error requesting ' + url);
    };
    xhr.onload  = cbInner;
    xhr.onerror = cbInner;
    xhr.send(null);
  };


  function fetchOSM(query, bounds, cb) {
    const url = ( (query.indexOf('building') !== -1) ? '2' : '1' ) + '.osm.json';
    //const url = [server, encodeURIComponent(format + query.replace('{{BOUNDS}}', bounds.join(',')))].join('');

    ajax(url, function(err, o) {
      if (err) { return cb(err); }
      cb(null, o);
    })
  }


  function drawRoads(o, c, pr) {
    o.elements.forEach(function(el) {
      if (el.type !== 'way') { return; }
      //console.log(el.tags);

      let wi, clr;
      const hw = el.tags.highway;

      console.log(hw);

      if (hw === 'primary') {
        wi = 10; clr = 0x444444FF;
      }
      else if (hw === 'secondary' || hw === 'primary_link') {
        wi = 8; clr = 0x444444FF;
      }
      else if (hw === 'tertiary') {
        wi = 8; clr = 0x444444FF;
      }
      else if (hw === 'residential') {
        wi = 6; clr = 0x444444FF;
      }
      else if (hw === 'service') {
        wi = 4; clr = 0x444444FF;
      }
      else if (hw === 'cycleway') {
        wi = 2; clr = 0x662222FF;
      }
      /*else if (hw === 'footway' || hw === 'steps' || hw === 'pedestrian') {
        wi = 1; clr = 0x444444FF;
      }*/
      else {
        return;// console.warn(hw);
      }

      //c.setLineDash(dashed ? [5, 5] : [0, 0] );
      //c.lineWidth = wi/2;
      //c.strokeStyle = clr;

      const poly = el.geometry.map(pr);

      c.setStroke(wi);
      c.drawLines(poly, clr);
    });
  }


  function drawBuildings(o, c, pr) {
    o.elements.forEach(function(el) {
      if (el.type !== 'way') { return; }

      const poly = el.geometry.map(pr);

      c.fillPoly(poly, 0x888888FF);
      c.setStroke(1);
      c.drawLines(poly, 0x444444FF, true);
    });
  }


  function fetchOSMRoads(   bounds, cb) { fetchOSM(roadsQuery,     bounds, cb); }
  function fetchOSBuildings(bounds, cb) { fetchOSM(buildingsQuery, bounds, cb); }


  window.osm = {
    fetch          : fetchOSM,
    fetchRoads     : fetchOSMRoads,
    fetchBuildings : fetchOSBuildings,
    drawRoads      : drawRoads,
    drawBuildings  : drawBuildings
  };
})();
