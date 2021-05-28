import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { vectorData, extent } from './data';
import kriging from "@sakitam-gis/kriging";
import { convert, encode } from './util';

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
canvas.width  = 512;
canvas.height = 512;
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
for (let xx = 0; xx <= 512; ++xx) {
  for (let yy = 0; yy <= 512; ++yy) {
    var vxpredicted = kriging.predict(xx, yy, variogram_x);
    var vypredicted = kriging.predict(xx, yy, variogram_y);
    ctx.putImageData(new ImageData(new Uint8ClampedArray([encode(xx, 512), encode(yy, 512), encode(vxpredicted, vxScale), encode(vypredicted, vyScale)]),1 ,1), xx, yy);
  }
}
const root = document.getElementById('root');
var dataURL = canvas.toDataURL();

// root.appendChild(canvas);





ReactDOM.render(
  <React.StrictMode>
    <App dataURL={dataURL} />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
