import kriging from "@sakitam-gis/kriging";
import WindGL from './wind/index';



export default class WindTile {
    constructor(data, extent, options) {
        this.extent = extent;
        this.data = data;
        this.options = options;
        this.width = options.width || 512;
        this.height = options.height || 512;
        this.glCanvas = options.canvas ||  document.createElement('canvas');
        this.gl = options.gl || this.glCanvas.getContext('webgl', {antialiasing: false});
        this.offset = options.offset || [0,0];
        this.pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2);
        this.deltaLong = extent[2] - extent[0];
        this.deltaLat = extent[3] - extent[1];
        this.longMin = extent[0]
        this.latMin = extent[1];
        this.meta = options.meta || {};
        this.parent = options.parent || document.getElementById('root');
        this.init();
        this.callback = options.callback;
        console.log(this.deltaLong, this.deltaLat)
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
        this.windData = this.organizeData();
        this.wind.setWind(this.windData);
        
        
        
    }
    organizeData() {
        const vectorData = this.data;
        const longMin = this.longMin;
        const latMin = this.latMin;
        const deltaLong = this.deltaLong;
        const deltaLat = this.deltaLat;
        const width = this.width;
        const height = this.height;
        const options = this.options;
        
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
            if(i<21) {console.log(flatCoordinates[0], longMin, deltaLong, width)
                console.log(x[i])}
        };
        const vxMax = options.vxMax || Math.max(...vx);
        const vyMax = options.vyMax || Math.max(...vy);
        const vxMin = options.vxMin || Math.min(...vx);
        const vyMin = options.vyMin || Math.min(...vy);
        const variogram_x = kriging.train(vx, x, y, "exponential", 0, 100);
        const variogram_y = kriging.train(vy, x, y, "exponential", 0, 100);
        
        var data = new Uint8Array(width*height*4);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                var vxpredicted = kriging.predict(x, y, variogram_x);
                var vypredicted = kriging.predict(x, y, variogram_y);
                data[i + 0] = Math.floor(255 * (vxpredicted - vxMin) / (vxMax - vxMin));
                data[i + 1] = Math.floor(255 * (vypredicted - vyMin) / (vyMax - vyMin));
                data[i + 2] = 0;
                data[i + 3] = 255;
            }
        }
        console.log(data);
        const img = new Image();
        
        img.src = URL.createObjectURL(
            new Blob([data], { type: 'image/png' } /* (1) */)
          );
          this.parent.appendChild(img)
        const windData = {
            image: data,
            "uMin": vxMin,
            "uMax": vxMax,
            "vMin": vyMin,
            "vMax": vyMax,
            width: deltaLong,
            height: deltaLat
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