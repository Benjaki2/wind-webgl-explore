
import { vectorData, secondVectorData, secondExtent, extent } from './data';
import WindTile from './tile';
import * as dat from 'dat.gui';
let i = 0;
const callback = () => {
    i++;
    updateTiles();
}
const options = {
    callback
}
const windTile = new WindTile(vectorData, extent, options);
const secondOptions = {
    offset: [512,0],
    callback
};
const secondWindTile = new WindTile(secondVectorData, secondExtent, secondOptions);
const windTiles = [windTile, secondWindTile];
const gui = new dat.GUI();


function getMin(data,key) {
    return data.reduce((min, p) => p.windData[key] < min ? p.windData[key] : min, data[0].windData[key]);
}
function getMax(data,key) {
    return data.reduce((max, p) => p.windData[key] > max ? p.windData[key] : max, data[0].windData[key]);
}

const uMin = getMin(windTiles,'uMin');
const uMax = getMax(windTiles,'uMax');
const vMin = getMin(windTiles,'vMin');
const vMax = getMax(windTiles,'vMax');
const updateTiles = () => {
    if(i === windTiles.length) {
        windTiles.forEach(tile => {
            const wind = tile.wind;
            console.log(wind);
            console.log(wind.windData)
            gui.add(wind, 'numParticles', 144, 248832);
            gui.add(wind, 'fadeOpacity', 0.96, 0.999).step(0.001).updateDisplay();
            gui.add(wind, 'speedFactor', 0.05, 1.0);
            gui.add(wind, 'dropRate', 0, 0.1);
            gui.add(wind, 'dropRateBump', 0, 0.2);
            gui.add(wind.windData, 'uMin', -360, 0).setValue(uMin);
            gui.add(wind.windData, 'uMax', 0, 360).setValue(uMax);
            gui.add(wind.windData, 'vMin', -360, 0).setValue(vMin);
            gui.add(wind.windData, 'vMax', 0, 360).setValue(vMax);
        })
    }
}
