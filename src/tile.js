import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';
import kriging from "@sakitam-gis/kriging";
import proj4 from 'proj4';
import { convert, encode } from './util';
import WindGL from './wind/index';


import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import ImageLayer from 'ol/layer/Image';
import ImageSource from './ImageCanvas.js';
import Projection from 'ol/proj/Projection';
import {getCenter} from 'ol/extent';


// longMin, latMin, longMax, latMax
// [-180, -198, 396, 90];

export default class WindTile {
    constructor(data, extent, options) {
        this.extent = extent;
        this.data = data;
        this.width = options.width || 1024;
        this.height = options.height || 512;

        this.glCanvas = options.canvas ||  document.createElement('canvas');
        this.gl = options.gl || this.glCanvas.getContext('webgl', {antialiasing: false});
        this.offset = options.offset || [0,0];
        this.pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2);
        this.deltaLong = extent[2] - extent[0];
        this.deltaLat = extent[3] - extent[1];
        this.longMin = extent[0]
        this.latMin = extent[1];
        this.meta = options.meta || {};
        this.parent = options.parent || document.getElementById('root');
        this.init();
        this.callback = options.callback;
    }
    init() {
        this.glCanvas.width = this.width;
        this.glCanvas.height = this.height;
        this.gl.width = this.width;
        this.gl.height = this.height;
        
        this.wind = window.wind = new WindGL(this.gl);
        this.wind.numParticles = 11024;
        this.frame();
        if (this.pxRatio !== 1) {
            this.meta['retina resolution'] = true;
        }
        const img = document.createElement('img');
        this.windData = this.organizeData(img);
       
         this.wind.setWind(this.windData);
         let projection = new Projection({
            code: 'pixel-projection',
            units: 'pixels',
            extent: this.extent,
         });

         this.source = new ImageSource({
            canvas: this.glCanvas,
            projection: projection,
            imageExtent: this.extent,
          });
          console.log(this.extent)
         this.map = new Map({
            target: 'map',
            layers: [
              new ImageLayer({
                source: this.source,
              }),
            ],
            view: new View(
                {
              projection: projection,
              center: getCenter(this.extent),
              zoom: 4,
              zoomFactor: 4,
            }
            ),
          });

        window.map = this.map;
    }
    organizeData(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const vectorData = this.data;
        const longMin = this.longMin;
        const latMin = this.latMin;
        const deltaLong = this.deltaLong;
        const deltaLat = this.deltaLat;
        const width = this.width;
        const height = this.height;
        
        canvas.width  = this.width;
        canvas.height = this.height;

        // var source = new proj4.Proj('EPSG:4326');    //source coordinates will be in Longitude/Latitude, WGS84
        // var dest = new proj4.Proj('EPSG:3785');

        // export const extent = [-180, -85.06, 180, 85.06];
        // -20026376.39 -20048966.10 20026376.39 20048966.10

        // 40097932.2 height
        // 40052752.78 width

        // -4007501.6685578483, 11804035.356568545, -7827.1516964020475, 11804035.356568545
        // longMin, latMin, longMax, latMax
        // const extentMin = this.extent.slice(0, 2);
        // const extentMax = this.extent.slice(2, 4);
        // const metricExtentMin = proj4(source, dest, extentMin)
        // const metricExtentMax = proj4(source, dest, extentMax)
        // console.log([...metricExtentMin, ...metricExtentMax])

        // const metricLongDelta = Math.max(metricExtentMax[0] - metricExtentMin[0], 10000);
        // const metricLatDelta = Math.max(metricExtentMax[1] - metricExtentMin[1], 10000);
        // console.log(metricLongDelta, metricLatDelta)
        
        const NUM_POINTS = this.data.length;
        
        const vy = new Float32Array(NUM_POINTS),
            x = new Float32Array(NUM_POINTS),
            y = new Float32Array(NUM_POINTS),
            vx = new Float32Array(NUM_POINTS);
        for (var i = 0; i < NUM_POINTS; i++) {
            const flatCoordinates = vectorData[i].flatCoordinates_;
            const magnitude = vectorData[i].properties_.Magnitude;
            const direction = vectorData[i].properties_.Direction;
            // const xT = proj4(source, dest, flatCoordinates)
            // x[i] = ((metricLongDelta / 2 + xT[0]) / metricLongDelta) * width;
            // y[i] = ((metricLatDelta / 2 + xT[1]) / metricLatDelta) * height;
            x[i] = Math.floor(((flatCoordinates[0] - longMin) / deltaLong ) * width);
            y[i] = Math.floor(((flatCoordinates[1] - latMin) / deltaLat ) * height);

            vx[i] = (Math.sin(direction) / magnitude);
            vy[i] = (Math.cos(direction) / magnitude);
        };
        const vxMax = Math.max(...vx);
        const vyMax = Math.max(...vy);
        const vxMin = Math.min(...vx);
        const vyMin = Math.min(...vy);
        const variogram_x = kriging.train(vx, x, y, "exponential", 0, 100);
        const variogram_y = kriging.train(vy, x, y, "exponential", 0, 100);

        // longMin, latMin, longMax, latMax
        // [-180, -198, 396, 90];

        var data = new Uint8Array(width*height*4);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                var vxpredicted = kriging.predict(x, y, variogram_x);
                var vypredicted = kriging.predict(x, y, variogram_y);
                data[i + 0] = Math.floor(255 * (vxpredicted - vxMin) / (vxMax - vxMin));
                data[i + 1] = Math.floor(255 * (vypredicted - vyMin) / (vyMax - vyMin));
                data[i + 2] = 0;
                data[i + 3] = 255;
            }
        }
        const windData = {
            image: data,
            "uMin": vxMin,
            "uMax": vxMax,
            "vMin": vyMin,
            "vMax": vyMax,
            width: deltaLong,
            height: deltaLat,
          }
        return windData;
    }
    frame() {
        if (this.wind.windData) {
            this.wind.draw();
            this.source.changed();
            this.map.updateSize(this.extent);
        }
        requestAnimationFrame(this.frame.bind(this));
      }
}