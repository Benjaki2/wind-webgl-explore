import './index.css';
import reportWebVitals from './reportWebVitals';
import { vectorData, extent } from './data';
import kriging from "@sakitam-gis/kriging";
import WindGL from './wind/index';
const width = 512;
const height = 512;
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
wind.numParticles = 15000;
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
const deltaLong = extent[2] -extent[0];
const deltaLat = extent[3] -extent[1];
const longMin = extent[0]
const latMin = extent[1];
const NUM_POINTS = vectorData.length;

function toRadians (angle) {
  return angle * (Math.PI / 180);
}
const vy = new Float32Array(NUM_POINTS),
    x = new Float32Array(NUM_POINTS),
    y = new Float32Array(NUM_POINTS),
    vx = new Float32Array(NUM_POINTS);
for (var i = 0; i < NUM_POINTS; i++) {
    const flatCoordinates = vectorData[i].flatCoordinates_;
    const magnitude = vectorData[i].properties_.Magnitude;
    const direction = vectorData[i].properties_.Direction;
    x[i] = Math.floor(((flatCoordinates[0] - longMin) / deltaLong ) * width);
    y[i] = Math.floor(((flatCoordinates[1] - latMin) / deltaLat ) * height);
    vx[i] = Math.cos(toRadians(direction)) * magnitude *100;
    vy[i] = Math.sin(toRadians(direction)) * magnitude * 100;
};
console.log(vx)
console.log(vy)
// const vxScale = vxMax - vxMin;
// const vyScale = vyMax - vyMin;
const vxMax = Math.max(...vx);
const vyMax = Math.max(...vy);
const vxMin = Math.min(...vx);
const vyMin = Math.min(...vy);
const variogram_x = kriging.train(vx, x, y, "linear", 0, 10);
const variogram_y = kriging.train(vy, x, y, "linear", 0, 10);

const data = new Uint8Array(width*height*4);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      var vxpredicted = kriging.predict(x, y, variogram_x);
      var vypredicted = kriging.predict(x, y, variogram_y);
      data[i + 0] = 0
      data[i + 1] = 0
      data[i + 2] = Math.floor(255 * (vxpredicted - vxMin) / (vyMax - vyMin));
      data[i + 3] = Math.floor(255 * (vypredicted - vxMin) / (vyMax - vyMin));
  }
}


const windData = {
  // image: new Uint8Array(buffer),
  image: data,
  "uMin": vxMin,
  "uMax": vxMax,
  "vMin": vyMin,
  "vMax": vyMax,
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
