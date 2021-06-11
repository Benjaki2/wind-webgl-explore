
import { vectorData, secondVectorData, secondExtent, extent } from './data';
import WindTile from './tile';
import * as dat from 'dat.gui';
import './App.css';
const options = {
    width: 512 * 2,
    height: 512
}
const extentFull = [extent[0],extent[1],secondExtent[2],extent[3]]
const data = secondVectorData.concat(vectorData);
const windTile = new WindTile(data, extentFull, options);
// const secondOptions = {
//     offset: [512,0],
//     uMin: -162,
//     uMax: 100,
//     vMin: -112,
//     vMax: 294
// };
// const secondWindTile = new WindTile(secondVectorData, secondExtent, secondOptions);
// const windTiles = [windTile, secondWindTile];
const gui = new dat.GUI();


// function getMin(data,key) {
//     return data.reduce((min, p) => p.windData[key] < min ? p.windData[key] : min, data[0].windData[key]);
// }
// function getMax(data,key) {
//     return data.reduce((max, p) => p.windData[key] > max ? p.windData[key] : max, data[0].windData[key]);
// }

// const uMin = getMin(windTiles,'uMin');
// const uMax = getMax(windTiles,'uMax');
// const vMin = getMin(windTiles,'vMin');
// const vMax = getMax(windTiles,'vMax');

// windTiles.forEach(tile => {
    const wind = windTile.wind;
    gui.add(wind, 'numParticles', 144, 248832);
    gui.add(wind, 'fadeOpacity', 0.96, 0.999).step(0.001).updateDisplay();
    gui.add(wind, 'speedFactor', 0.05, 1.0);
    gui.add(wind, 'dropRate', 0, 0.1);
    gui.add(wind, 'dropRateBump', 0, 0.2);
    gui.add(wind.windData, 'uMin', -360, 0)
    gui.add(wind.windData, 'uMax', 0, 360)
    gui.add(wind.windData, 'vMin', -360, 0)
    gui.add(wind.windData, 'vMax', 0, 360)
// })

