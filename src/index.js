import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { vectorData, extent } from './data';
import kriging from "@sakitam-gis/kriging";
import { convert, encode } from './util';
import WindGL from './wind/index';
const width = 512;
const height = 512;
var canvas = document.createElement('canvas');
var glCanvas = document.createElement('canvas'); // eslint-disable-line
const meta = {};
const pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2);
glCanvas.width = width;
glCanvas.height = height;
const gl = glCanvas.getContext('webgl', {antialiasing: false});
const root = document.getElementById('root');

root.appendChild(glCanvas);

gl.width =width;
gl.height = height;

const wind = window.wind = new WindGL(gl);
wind.numParticles = 62144;
function frame() {
  if (wind.windData) {
      wind.draw();
  }
  requestAnimationFrame(frame);
}
frame();
if (pxRatio !== 1) {
  meta['retina resolution'] = true;
}
// function updateRetina() {
//   const ratio = wind.meta['retina resolution'] ? pxRatio : 1;
//   canvas.width = glCanvas.clientWidth * ratio;
//   canvas.height = glCanvas.clientHeight * ratio;
//   wind.resize();
// }

// updateRetina();


var ctx = canvas.getContext('2d');

canvas.width  = width;
canvas.height = height;
const deltaLong = extent[2] -extent[0];
const deltaLat = extent[3] -extent[1];
const longMin = extent[0]
const latMin = extent[1];
const NUM_POINTS = vectorData.length;

const vy = new Float32Array(NUM_POINTS),
    x = new Float32Array(NUM_POINTS),
    y = new Float32Array(NUM_POINTS),
    vx = new Float32Array(NUM_POINTS);
for (var i = 0; i < NUM_POINTS; i++) {
    const flatCoordinates = vectorData[i].flatCoordinates_;
    const magnitude = vectorData[i].properties_.Magnitude;
    const direction = vectorData[i].properties_.Direction;
    //const coords = convert(flatCoordinates[0],flatCoordinates[1], extent)
    x[i] = ((flatCoordinates[0] - longMin) / deltaLong ) * width;
    y[i] = ((flatCoordinates[1] - latMin) / deltaLat ) * height;
    
    vx[i] = (Math.sin(direction) / magnitude);
    vy[i] = (Math.cos(direction) / magnitude);
};
// const vxScale = vxMax - vxMin;
// const vyScale = vyMax - vyMin;
const vxMax = Math.max(...vx);
const vyMax = Math.max(...vy);
const vxMin = Math.min(...vx);
const vyMin = Math.min(...vy);
const variogram_x = kriging.train(vx, x, y, "exponential", 0, 100);
const variogram_y = kriging.train(vy, x, y, "exponential", 0, 100);


// for (let y = 0; y < height; y++) {
//   for (let x = 0; x < width; x++) {
//       var vxpredicted = kriging.predict(x, y, variogram_x);
//       var vypredicted = kriging.predict(x, y, variogram_y);

//       const r = Math.floor(255 * (x - 0) / (512));
//       const g = Math.floor(255 * (vxpredicted - vxMin) / (vxMax - vxMin));
//       const b = Math.floor(255 * (y - 0) / (512));
//       const a = Math.floor(255 * (vypredicted - vyMin) / (vyMax - vyMin));
//       // console.log(vxpredicted, vypredicted)
//       ctx.putImageData(new ImageData(new Uint8ClampedArray([r, g, b, a]), 1 ,1), x, y);
//       // new Uint8Array()
//   }
// }

// var imageData = ctx.getImageData(0, 0, width, height);
// var buffer = imageData.data.buffer; 

const data = new Uint8Array(width*height*4);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      var vxpredicted = kriging.predict(x, y, variogram_x);
      var vypredicted = kriging.predict(x, y, variogram_y);
      data[i + 0] = Math.floor(255 * (vxpredicted - vxMin) / (vxMax - vxMin));;
      data[i + 1] = Math.floor(255 * (vypredicted - vyMin) / (vyMax - vyMin));
      data[i + 2] = 0;
      data[i + 3] = 255;
  }
}
// console.log(data);
const windData = {
  // image: new Uint8Array(buffer),
  image: data,
  "uMin": -21.32,
  "uMax": 26.8,
  "vMin": -21.57,
  "vMax": 21.42,
  width: 288,
  height: 288
}
wind.setWind(windData);






// const img= document.createElement('img');
// img.width = width;
// img.height = height;
// img.src = URL.createObjectURL(
//   new Blob([new Uint8Array(buffer)], { type: 'image/png' } /* (1) */)
// );
// root.appendChild(img)


// ReactDOM.render(
//   <React.StrictMode>
//     <App dataURL={canvas.toDataURL()} />
//   </React.StrictMode>,
//   document.getElementById('root')
// );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
