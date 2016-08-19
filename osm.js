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

      if (hw === 'primary') {
        wi = 8;
        clr = '#DD0';
      }
      else if (hw === 'secondary' || hw === 'primary_link') {
        wi = 7;
        clr = '#EE0';
      }
      else if (hw === 'tertiary') {
        wi = 7;
        clr = '#F00';
      }
      else if (hw === 'residential') {
        wi = 5;
        clr = '#700';
      }
      else if (hw === 'service') {
        wi = 3;
        clr = 'orange';
      }
      else if (hw === 'cycleway') {
        wi = 3;
        clr = 'orange';
      }
      else if (hw === 'footway' || hw === 'steps' || hw === 'pedestrian') {
        clr = 'gray';
      }
      else {
        console.log(hw);
      }

      //c.setLineDash(dashed ? [5, 5] : [0, 0] );
      //c.lineWidth = wi/2;
      //c.strokeStyle = clr;

      const poly = el.geometry.map(pr);

      c.drawLines(poly, 0x000000FF);
    });
  }


  function drawBuildings(o, c, pr) {
    o.elements.forEach(function(el) {
      if (el.type !== 'way') { return; }

      const poly = el.geometry.map(pr);

      c.fillPoly(poly, 0x888888FF);
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
