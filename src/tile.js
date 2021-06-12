import kriging from "@sakitam-gis/kriging";
import WindGL from './wind/index';
import Image from './wind/img.png';


export default class WindTile {
    constructor(data, extent, options) {
        this.extent = extent;
        this.data = data;
        this.options = options;
        this.visibleExtent = [-180, -90, 180, 90];
        this.width = options.width || 512;
        this.height = options.height || 512;
        this.glCanvas = options.canvas ||  document.createElement('canvas');
        this.gl = options.gl || this.glCanvas.getContext('webgl', {antialiasing: false});
        this.offset = options.offset || [0,0];
        this.pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2);
        this.deltaLong = Math.abs(extent[2] - extent[0]);
        this.deltaLat = Math.abs(extent[3] - extent[1]);
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
        
        const wind = this.wind = window.wind = new WindGL(this.gl);
        this.wind.numParticles = 11024;
        this.frame();
        if (this.pxRatio !== 1) {
            this.meta['retina resolution'] = true;
        }
        const windData = this.windData= this.organizeData();
        windData.image.onload = ()  =>{
            wind.setWind(windData);
        }
        
        
        
        
    }
    organizeData() {
        const vectorData = this.data;
        const longMin = -180;
        const latMin = -90;
        const deltaLong = 360;
        const deltaLat = 180;
        const width = 360 ;
        const height = 180;
        const options = this.options;
        
        const NUM_POINTS = this.data.length;
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        this.parent.appendChild(canvas);

        var ctx = canvas.getContext('2d');
        const { uMin, vMin, uMax, vMax } = this.options;
        ctx.fillStyle = 'rgba(' +Math.floor(255 * Math.abs(0 - uMin) / (uMax - uMin))+','+ Math.floor(255 * Math.abs(0 - vMin) / (vMax - vMin)) +',0,250';

        ctx.fillRect(0, 0, width, height);
        const u = new Float32Array(NUM_POINTS),
            x = new Float32Array(NUM_POINTS),
            y = new Float32Array(NUM_POINTS),
            v = new Float32Array(NUM_POINTS);
        for (var i = 0; i < NUM_POINTS; i++) {
            const flatCoordinates = vectorData[i].flatCoordinates_;
            const magnitude = vectorData[i].properties_.Magnitude;
            const direction = vectorData[i].properties_.Direction;
            x[i] = Math.floor((Math.abs(flatCoordinates[0] - longMin) / deltaLong ) * width);
            y[i] = Math.floor(height - ((Math.abs(flatCoordinates[1] - latMin) / deltaLat ) * height));
            u[i] =(Math.sin(direction) / magnitude);
            v[i] = (Math.cos(direction) / magnitude);
            const r = Math.floor(255 * (u[i] - uMin) / (uMax - uMin));
            const g = Math.floor(255 * (v[i] - vMin) / (vMax - vMin));
            ctx.putImageData(new ImageData(new Uint8ClampedArray([r, g, 0, 255]), 1 ,1), x[i] , y[i]);
            for (var j = 0; j < 10; j++) {
                ctx.putImageData(new ImageData(new Uint8ClampedArray([r, g, 0, 255]), 1 ,1), x[i]-j , y[i]-j);
                ctx.putImageData(new ImageData(new Uint8ClampedArray([r, g, 0, 255]), 1 ,1), x[i]+j , y[i]+j);
                ctx.putImageData(new ImageData(new Uint8ClampedArray([r, g, 0, 255]), 1 ,1), x[i]-j , y[i]+j);
                ctx.putImageData(new ImageData(new Uint8ClampedArray([r, g, 0, 255]), 1 ,1), x[i]+j , y[i]-j);
                ctx.putImageData(new ImageData(new Uint8ClampedArray([r, g, 0, 255]), 1 ,1), x[i]+j , y[i]);
                ctx.putImageData(new ImageData(new Uint8ClampedArray([r, g, 0, 255]), 1 ,1), x[i] , y[i]-j);
                ctx.putImageData(new ImageData(new Uint8ClampedArray([r, g, 0, 255]), 1 ,1), x[i] , y[i]+j);
                ctx.putImageData(new ImageData(new Uint8ClampedArray([r, g, 0, 255]), 1 ,1), x[i]-j , y[i]);
                ctx.putImageData(new ImageData(new Uint8ClampedArray([r, g, 0, 255]), 1 ,1), x[i]+j , y[i]);
            }

            if(i<21) {
                console.log(flatCoordinates)
                console.log(x[i],y[i])
                console.log(u[i],v[i])
            }
        };

        // const vxMax = options.vxMax || Math.max(...vx);
        // const vyMax = options.vyMax || Math.max(...vy);
        // const vxMin = options.vxMin || Math.min(...vx);
        // const vyMin = options.vyMin || Math.min(...vy);
        const variogram_u = kriging.train(u, x, y, "linear", 0, 100);
        const variogram_v = kriging.train(v, x, y, "linear", 0, 100);

        // var data = new Uint8Array(180*360*4);
        // const img = document.createElement('img');
        // for (let y = 0; y < 180; y++) {
        //     for (let x = 0; x < 360; x++) {
        //         var uu = kriging.predict(x, y, variogram_u);
        //         var vv = kriging.predict(x, y, variogram_v);
        //         const r = Math.floor(255 * (uu - uMin) / (uMax - uMin));
        //         const g = Math.floor(255 * (vv - vMin) / (vMax - vMin));
        //         ctx.putImageData(new ImageData(new Uint8ClampedArray([r, g, 0, 255]), 1 ,1), x , y);

        //         data[i + 0] = r;
        //         data[i + 1] = g;
        //         data[i + 2] = 0;
        //         data[i + 3] = 255;
        //     }
        // }
        var _img = document.createElement('img');
        // this.parent.appendChild(_img)
        const imgData =canvas.toDataURL("image/png");
        _img.src = imgData;
    
        
        // img.src = imgData;
        this.parent.appendChild(_img);


        const windData = {
            image: _img,
            uMin,
            vMin,
            uMax,
            vMax,
            width: deltaLong,
            height: deltaLat
            // "uMin": vxMin,
            // "uMax": vxMax,
            // "vMin": vyMin,
            // "vMax": vyMax,
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