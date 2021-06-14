
import { vectorData, secondVectorData, secondExtent, extent } from './data';
import WindTile from './renderer';
import * as dat from 'dat.gui';
import olTile from 'ol/layer/Tile';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import MVT from 'ol/format/MVT'
import {get} from 'ol/proj';
import VectorTileSource from 'ol/source/VectorTile';
import VectorTileLayer from 'ol/layer/VectorTile';
import olMap from 'ol/Map';
import olView from 'ol/View';
import './App.css';

// const extentFull = [extent[0],extent[1],secondExtent[2],extent[3]]
const data = secondVectorData.concat(vectorData);
// const secondOptions = {
//     offset: [512,0],
//     uMin: -162,
//     uMax: 100,
//     vMin: -112,
//     vMax: 294
// };
// const secondWindTile = new WindTile(secondVectorData, secondExtent, secondOptions);
// const windTiles = [windTile, secondWindTile];
// const gui = new dat.GUI();


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
    // const wind = windTile.wind;
    // gui.add(wind, 'numParticles', 144, 248832);
    // gui.add(wind, 'fadeOpacity', 0.96, 0.999).step(0.001).updateDisplay();
    // gui.add(wind, 'speedFactor', 0.05, 1.0);
    // gui.add(wind, 'dropRate', 0, 0.1);
    // gui.add(wind, 'dropRateBump', 0, 0.2);
    // gui.add(wind.windData, 'uMin', -360, 0)
    // gui.add(wind.windData, 'uMax', 0, 360)
    // gui.add(wind.windData, 'vMin', -360, 0)
    // gui.add(wind.windData, 'vMax', 0, 360)
// })

// 
const tileGridSizes = [
    {
      "matrixWidth": 2,
      "matrixHeight": 1
    },
    {
      "matrixWidth": 3,
      "matrixHeight": 2
    },
    {
      "matrixWidth": 5,
      "matrixHeight": 3
    },
    {
      "matrixWidth": 10,
      "matrixHeight": 5
    },
    {
      "matrixWidth": 20,
      "matrixHeight": 10
    },
    {
      "matrixWidth": 40,
      "matrixHeight": 20
    }
  ]
  
  var base = new olTile({
    extent: [-180, -90, 180, 90],
    crossOrigin: 'anonymous',
    source: new WMTS({
      url: '//gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?TIME=2020-04-27',
      layer: 'BlueMarble_NextGeneration',
      format: 'image/jpeg',
      matrixSet: '500m',
      tileGrid: new WMTSTileGrid({
        origin: [-180, 90],
        resolutions: [0.140625, 0.0703125, 0.03515625, 0.017578125, 0.0087890625, 0.00439453125, 0.002197265625],
        matrixIds: [2, 3, 4, 5, 6, 7, 8],
        tileSize: 512,
      }),
    }),
  });
  const source = new VectorTileSource({
      visible: true,
      projection: get('EPSG:4326'),
      url: 'https://uat.gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?TIME=2020-01-01&layer=OSCAR_Sea_Surface_Currents&tilematrixset=2km&Service=WMTS&Request=GetTile&Version=1.0.0&FORMAT=application%2Fvnd.mapbox-vector-tile&TileMatrix={z}&TileCol={x}&TileRow={y}',      format: new MVT(),
      tileGrid: new WMTSTileGrid({
        extent: [-180, -90, 180, 90],
        resolutions: [0.5625, 0.28125, 0.140625, 0.0703125, 0.03515625, 0.017578125],
        tileSize: [512, 512],
        sizes: tileGridSizes,
      }),
    });
  const vectorLayer = new VectorTileLayer({
    source: source,
    style: []
  });
  var map = new olMap({
    layers: [base, vectorLayer],
    target: "map",
    view: new olView({
      center: [0, 0],
      maxZoom: 12,
      zoom: 1,
      extent: [-180, -90, 180, 90],
      projection: get('EPSG:4326'),
    })
  });
  
let i = 0;
source.on('tileloadstart', function(e) {  
    i++
});
let windRender;
source.on('tileloadend', function(e) {  
    if(!windRender){
        const mapSize = map.getSize();
        const options = {
            uMin: -162,
            uMax: 100,
            vMin: -112,
            vMax: 294,
            width: mapSize[0],
            height:mapSize[1]
        }
        windRender = new WindTile(options);  
    }
    i--
    if(i===1 && !windRender.stopped) {
        windRender.stop() 
    }
    if(i=== 0 && !moving){
        updateRenderer();
    }
    
});
let moving = false;
map.getView().on('change:center', () =>{
    windRender.stop()
    moving = true;
});
map.getView().on('propertychange', (e) => {
    if (e.key ==='resolution') {
        windRender.stop()
        moving = true
    }
});
map.on('moveend', (e) => {
    moving = false;
    if(i === 0 ) updateRenderer();
});
const updateRenderer = () => {

    const mapSize = map.getSize();
    const options = {
        uMin: -162,
        uMax: 100,
        vMin: -112,
        vMax: 294,
        width: mapSize[0],
        height:mapSize[1]
    }
    setTimeout(function(){
        const extent = map.getView().calculateExtent(map.getSize());
        const currentFeatures = vectorLayer.getSource().getFeaturesInExtent(extent);
        windRender.updateData(currentFeatures, extent, options);
    }, 1000);
    
}