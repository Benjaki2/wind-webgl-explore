import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { vectorData, extent } from './data';
import kriging from "@sakitam-gis/kriging";
import { convert, encode } from './util';
import WindGL from './wind/index';



export default class WindTile {
    constructor(data, extent, options) {
        this.extent = extent;
        this.data = data;
        this.width = options.width || 512;
        this.height = options.height || 512;
        this.glCanvas = options.canvas ||  document.createElement('canvas');
        this.gl = options.gl || this.glCanvas.getContext('webgl', {antialiasing: false});
        this.offset = options.offset || [0,0];
        this.pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2);
        this.deltaLong = extent[2] -extent[0];
        this.deltaLat = extent[3] -extent[1];
        this.longMin = extent[0]
        this.latMin = extent[1];
        this.meta = options.meta || {};
        this.parent = options.parent || document.getElementById('root');
        this.init();
        this.callback = options.callback;
    }
    init() {
        this.parent.appendChild(this.glCanvas);
        
        
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
       
        img.onload = () => {
         this.wind.setWind(this.windData);
         this.callback();
        };
        
        
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
        
        const NUM_POINTS = this.data.length;
        
        const vy = new Float32Array(NUM_POINTS),
            x = new Float32Array(NUM_POINTS),
            y = new Float32Array(NUM_POINTS),
            vx = new Float32Array(NUM_POINTS);
        for (var i = 0; i < NUM_POINTS; i++) {
            const flatCoordinates = vectorData[i].flatCoordinates_;
            const magnitude = vectorData[i].properties_.Magnitude;
            const direction = vectorData[i].properties_.Direction;
            x[i] = ((flatCoordinates[0] - longMin) / deltaLong ) * width;
            y[i] = ((flatCoordinates[1] - latMin) / deltaLat ) * height;
            
            vx[i] = (Math.sin(direction) / magnitude);
            vy[i] = (Math.cos(direction) / magnitude);
        };
        const vxMax = Math.max(...vx);
        const vyMax = Math.max(...vy);
        const vxMin = Math.min(...vx);
        const vyMin = Math.min(...vy);
        const variogram_x = kriging.train(vx, x, y, "exponential", 0, 100);
        const variogram_y = kriging.train(vy, x, y, "exponential", 0, 100);
        
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
              var vxpredicted = kriging.predict(x, y, variogram_x);
              var vypredicted = kriging.predict(x, y, variogram_y);
              const r = Math.floor(255 * (vxpredicted - vxMin) / (vxMax - vxMin));
              const g = Math.floor(255 * (vypredicted - vyMin) / (vyMax - vyMin));
              ctx.putImageData(new ImageData(new Uint8ClampedArray([r, g, 0, 255]), 1 ,1), x, y);
          }
        }
        const imgData = canvas.toDataURL("image/png");
        img.src = imgData;
        const windData = {
            image: img,
            "uMin": vxMin,
            "uMax": vxMax,
            "vMin": vyMin,
            "vMax": vyMax,
            width: deltaLong,
            height: deltaLat
          }
            console.log(deltaLong,deltaLat)
        return windData;
    }
    frame() {
        if (this.wind.windData) {
            this.wind.draw();
        }
        requestAnimationFrame(this.frame.bind(this));
      }
}