import { vectorData, secondVectorData } from './data';
import WindTile from './tile';
import * as dat from 'dat.gui';

const options = {}
const uids = {};
const data = vectorData.concat(secondVectorData).reduce((acc, p) => {
    const uid = p.properties_.UID;
    if (uids[uid] === undefined) {
        uids[uid] = true;
        acc.push(p);
    }
    return acc;
}, []);
const ex = data.reduce((acc, x) => {
    const [a, b, c, d] = x.extent_;
    if (a < acc.a) {
        acc.a = a;
    }
    if (b < acc.b) {
        acc.b = b;
    }
    if (c > acc.c) {
        acc.c = c;
    }
    if (d > acc.d) {
        acc.d = d;
    }
    return acc;
}, {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
})

const windTile = new WindTile(data, Object.values(ex), options);
const windTiles = [windTile];
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

windTiles.forEach(tile => {
    const wind = tile.wind;
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

