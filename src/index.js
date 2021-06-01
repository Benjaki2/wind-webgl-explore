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

const pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2);
glCanvas.width = width;
glCanvas.height = height;
const gl = glCanvas.getContext('webgl', {antialiasing: false});

gl.width =width;
gl.height = height;

const wind = window.wind = new WindGL(gl);
wind.numParticles = 262144;
function frame() {
  if (wind.windData) {
      wind.draw();
  }
  requestAnimationFrame(frame);
}
frame();
updateRetina();

function updateRetina() {
    const ratio = wind.meta['retina resolution'] ? pxRatio : 1;
    canvas.width = glCanvas.clientWidth * ratio;
    canvas.height = glCanvas.clientHeight * ratio;
    wind.resize();
}
var ctx = canvas.getContext('2d');

canvas.width  = width;
canvas.height = height;
const NUM_POINTS = vectorData.length;
const vy = new Float32Array(NUM_POINTS),
    x = new Float32Array(NUM_POINTS),
    y = new Float32Array(NUM_POINTS),
    vx = new Float32Array(NUM_POINTS);
for (var i = 0; i < NUM_POINTS; i++) {
    const flatCoordinates = vectorData[i].flatCoordinates_;
    const magnitude = vectorData[i].properties_.Magnitude;
    const direction = vectorData[i].properties_.Direction;
    const coords = convert(flatCoordinates[0],flatCoordinates[1], extent)
    x[i] = coords.x;
    y[i] = coords.y;
    vx[i] = (Math.sin(direction) / magnitude);
    vy[i] = (Math.cos(direction) / magnitude);
};
const vxMax = Math.max(...vx);
const vyMax = Math.max(...vy);
const vxMin = Math.min(...vx);
const vyMin = Math.min(...vy);
const vxScale = vxMax - vxMin;
const vyScale = vyMax - vyMin;
const variogram_x = kriging.train(vx, x, y, "exponential", 0, 10);
const variogram_y = kriging.train(vy, x, y, "exponential", 0, 10);



// const png = new PNG({
//   colorType: 2,
//   filterType: 4,
//   width: width,
//   height: height
// });

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
      var vxpredicted = kriging.predict(x, y, variogram_x);
      var vypredicted = kriging.predict(x, y, variogram_y);
      const r = Math.floor(255 * (x - 0) / (512));
      const g = Math.floor(255 * (vxpredicted - vxMin) / (vxMax - vxMin));
      const b = Math.floor(255 * (y - 0) / (512));
      const a = Math.floor(255 * (vypredicted - vyMin) / (vyMax - vyMin));
      ctx.putImageData(new ImageData(new Uint8ClampedArray([r, g, b, a]), 1 ,1), x, y);
  }
}
const root = document.getElementById('root');
var dataURL = canvas.toDataURL();
wind.setWind(canvas.toDataURL());





root.appendChild(glCanvas);





// ReactDOM.render(
//   <React.StrictMode>
//     <App dataURL={dataURL} />
//   </React.StrictMode>,
//   document.getElementById('root')
// );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
