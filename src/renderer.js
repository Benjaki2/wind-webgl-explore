import WindGL from './wind/index';


export default class WindTile {
    constructor(options) {
        this.options = options;
        this.visibleExtent = [-180, -90, 180, 90];
        this.width = options.width || 512;
        this.height = options.height || 512;
        this.dataGridWidth = 360;
        this.glCanvas = options.canvas ||  document.createElement('canvas');
        this.gl = options.gl || this.glCanvas.getContext('webgl', {antialiasing: false});
        this.offset = options.offset || [0,0];
        this.pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2);
        this.meta = options.meta || {};
        this.parent = options.parent || document.getElementById('root');
        this.glCanvas.id = 'gl-canvas';
        this.stopped = false;
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
    }
    updateData(data, extent, zoom, options) {
        const windData = this.windData= this.organizeData(data, extent,zoom, options);
        this.wind.setWind(windData);
        this.stopped = false;
        this.glCanvas.style = 'display:block';
        windData.image = null;
    }
    stop() {
        delete this.wind.windData;
        this.stopped = true;
        this.glCanvas.style = 'display:none';
 
    }
    organizeData(data, extent, zoom, options) {
        const vectorData = data;
        const longMin = extent[0];
        const latMin = extent[1];
        const deltaLong = extent[2]-extent[0];
        const deltaLat = extent[3]-extent[1];
        // const isZoomedIn = zoom > 6;
        // const isLowZoom = zoom < 3;
        // const width = isLowZoom ? 360 : isZoomedIn ? 90 : 180 ;
        // const height = isLowZoom ? 180 :isZoomedIn ? 45 : 90;
        const width = this.dataGridWidth;
        const height = this.dataGridWidth /2;
        const NUM_POINTS = data.length;

        const { uMin, vMin, uMax, vMax } = options;
        const uZero = Math.floor(255 * Math.abs(0 - uMin) / (uMax - uMin));
        const vZero =  Math.floor(255 * Math.abs(0 - vMin) / (vMax - vMin));
        const imageArray = new Uint8Array(width * height * 4);
        const j = new Uint8Array(width * height * 4);

        for (var i = 0; i < NUM_POINTS; i++) {
            const flatCoordinates = vectorData[i].flatCoordinates_;
            const x = Math.floor((Math.abs(flatCoordinates[0] - longMin) / deltaLong ) * width);
            const y = Math.floor(height - ((Math.abs(flatCoordinates[1] - latMin) / deltaLat ) * height));
            const u = vectorData[i].properties_.U;
            const v = vectorData[i].properties_.V;
            const ii = (y * width + x) * 4;
            j[ii] = i;
            const r = Math.floor(255 * (u - uMin) / (uMax - uMin));
            const g = Math.floor(255 * (v - vMin) / (vMax - vMin));
            imageArray[ii + 0] = r;
            imageArray[ii + 1] = g;
            imageArray[ii + 2] = 0;
            imageArray[ii + 3] = 255;

        };

        // Fill in empty pixels with zero wind color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const index = j[i];
                if(!index) {
                    imageArray[i + 0] = uZero
                    imageArray[i + 1] = vZero
                    imageArray[i + 2] = 0;
                    imageArray[i + 3] = 255;
                }
            }
        }
        const windData = {
            image: imageArray,
            uMin,
            vMin,
            uMax,
            vMax,
            width: deltaLong,
            height: deltaLat,
            textureHeight: height,
            textureWidth: width
          }
        return windData;
    }
    frame() {
        if (this.wind.windData) {
            this.wind.draw();
        }
        requestAnimationFrame(this.frame.bind(this));
      }
}
