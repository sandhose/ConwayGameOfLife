// requestAnimationFrame shim
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function( callback ){
                window.setTimeout(callback, 1000 / 60);
            };
})();

var Conway = function() {
    if(!(this instanceof Conway)) {
        return new Conway();
    }
    else {
        this.init();
    }
};

Conway.prototype = {
    init: function() {
        this.canvas = document.getElementById("conway");
        this.ctx = this.canvas.getContext("2d");

        this.blocks = [];
        this.zoom = 1;

        this.speed = 50;

        this.initInterface();

        this.updateCanvas();

        this.randomBlocks();

        window.addEventListener("resize", this.updateCanvas.bind(this), false);
        window.addEventListener("mousemove", this.mouseMove.bind(this), false)
        window.addEventListener("mouseup", this.mouseUp.bind(this), false)
        this.canvas.addEventListener("mousedown", this.mouseDown.bind(this), false);
        this.canvas.addEventListener("mouveout", this.mouseOut.bind(this), false);
        this.canvas.addEventListener("mousewheel", this.mouseWheel.bind(this), false);

        document.querySelector("#options .collapse").addEventListener("click", function(event) {
            event.target.parentNode.classList.toggle("collapsed");
        }, false)

        this.mouse = {
            x: -1,
            y: -1
        };

        this.zoomOffset = {
            x: 0,
            y: 0
        };

        this.mouseDragging = false;

        this.schemes = {
            light: {
                background: "255,255,255",
                blocks: "80,80,80",
                grid: "220,220,220",
                grid_hover: "120,120,120"
            },
            dark: {
                background: "10,20,30",
                blocks: "68,85,102",
                grid: "20,30,40",
                grid_hover: "80,130,150"
            }
        }

        requestAnimFrame(this.draw.bind(this));
        this.liveTimeout = setTimeout(this.live.bind(this), 1000/this.speed);
    },
    initInterface: function() {
        this.controls = {
            scheme: document.getElementById("color_scheme"),
            padding: document.getElementById("block_padding"),
            size: document.getElementById("block_size"),
            show_grid: document.getElementById("show_grid"),
            grid_hover: document.getElementById("show_hover_grid"),
            motion_blur: document.getElementById("motion_blur")
        };

        this.options = {};

        for(var i in this.controls) {
            this.controls[i].addEventListener("change", this.optionsChange.bind(this, i));
            var val = this.controls[i].type == "checkbox" ? this.controls[i].checked : this.controls[i].value;
            this.optionsChange(i, val);
        }
    },
    optionsChange: function(option, arg) {
        var val = typeof arg == "object" ? (arg.target.type == "checkbox" ? arg.target.checked : arg.target.value) : arg;
        val = (isNaN(val) || typeof val == "boolean") ? val : parseInt(val);
        if(option == "scheme") {
            document.body.classList.remove(val == "light" ? "scheme-dark" : "scheme-light");
            document.body.classList.add(val == "light" ? "scheme-light" : "scheme-dark");
        }
        else {

        }

        this.options[option] = val;
        this.updateBlockCount();
    },
    draw: function() {
        var off = this.zoomOffset;
        this.ctx.fillStyle = "rgba("+ this.schemes[this.options.scheme].background + "," + ((-this.options.motion_blur + 10)/10) + ")";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
        for(var i = 0; i < this.blockCount.w; i++) {
            for(var j = 0; j < this.blockCount.h; j++) {
                if(this.blocks[i][j]) {
                    this.ctx.rect(
                        (this.options.size + this.options.padding) * i * this.zoom - off.x,
                        (this.options.size + this.options.padding) * j * this.zoom - off.y,
                        this.options.size * this.zoom,
                        this.options.size * this.zoom
                    )
                }
            }
        }

        this.ctx.closePath();

        this.ctx.fillStyle = "rgb(" + this.schemes[this.options.scheme].blocks + ")";
        this.ctx.fill();

        if((this.options.show_grid || this.options.grid_hover) && this.options.padding != 0) {
            this.ctx.beginPath();
            for(var i = 0; i < this.blockCount.w; i++) {
                this.ctx.moveTo((i * (this.options.size + this.options.padding) - this.options.padding/2) * this.zoom - off.x, 0);
                this.ctx.lineTo((i * (this.options.size + this.options.padding) - this.options.padding/2) * this.zoom - off.x,this.canvas.width);
            }

            for(var i = 0; i < this.blockCount.h; i++) {
                this.ctx.moveTo(0, (i * (this.options.size + this.options.padding) - this.options.padding/2) * this.zoom - off.y);
                this.ctx.lineTo(this.canvas.width, (i * (this.options.size + this.options.padding) - this.options.padding/2) * this.zoom - off.y);
            }
            this.ctx.closePath();
            this.ctx.strokeStyle = "rgb(" + this.schemes[this.options.scheme].grid + ")";
            this.ctx.lineWidth = this.options.padding * this.zoom;
            if(this.options.show_grid) this.ctx.stroke();

            if(this.options.grid_hover) {
                var gradient = this.ctx.createRadialGradient(this.mouse.x, this.mouse.y, 0, this.mouse.x, this.mouse.y, 200 * this.zoom);
                gradient.addColorStop(0, 'rgba(' + this.schemes[this.options.scheme].grid_hover + ', 0.3)');
                gradient.addColorStop(1, 'rgba(' + this.schemes[this.options.scheme].grid_hover + ', 0)');

                this.ctx.strokeStyle = gradient;
                this.ctx.stroke();
            }
        }

        requestAnimFrame(this.draw.bind(this));
    },
    shouldBlockLive: function(x, y) {
        var c = 0;
        for(var i = -1; i <= 1; i++) {
            for(var j = -1; j <= 1; j++) {
                if(this.blocks[(x+i+this.blockCount.w)%this.blockCount.w][(y+j+this.blockCount.h)%this.blockCount.h] && !(i==0 && j==0)) c++;
            }
        }
        if(c == 3 || (c == 2 && this.blocks[x][y])) return true;
        else return false;
    },
    randomBlocks: function() {
        for(var i = 0; i < this.blockCount.w; i++) {
            this.blocks[i] = [];
            for(var j = 0; j < this.blockCount.h; j++) {
                this.blocks[i][j] = (Math.random() < 0.1);
            }
        }
    },
    updateCanvas: function() {
        console.log("update");
        this.canvas.height = window.innerHeight;
        this.canvas.width = window.innerWidth;
        this.updateBlockCount();
    },
    updateBlockCount: function() {
        this.blockCount = {
            h: Math.ceil(this.canvas.height / (this.options.size + this.options.padding)),
            w: Math.ceil(this.canvas.width / (this.options.size + this.options.padding))
        };

        for(var i = 0; i < this.blockCount.w; i++) {
            if(!this.blocks[i]) this.blocks[i] = [];
        }
    },
    live: function() {
        clearTimeout(this.liveTimeout);
        this.liveTimeout = setTimeout(this.live.bind(this), 1000/this.speed);
        var newMap = [];
        for(var i = 0; i < this.blockCount.w; i++) {
            newMap[i] = [];
            for(var j = 0; j < this.blockCount.h; j++) {
                newMap[i][j] = this.shouldBlockLive(i, j);
            }
        }
        this.blocks = newMap;
    },
    mouseMove: function(event) {
        var mv_x = this.mouse.x - event.clientX,
            mv_y = this.mouse.y - event.clientY;
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;

        if(this.mouseDragging) {
            this.zoomOffset.x += mv_x;
            this.zoomOffset.y += mv_y;
            this.constrainZoom();
        }
    },
    mouseOut: function() {
        this.mouse = {
            x: -1,
            y: -1
        };
        this.mouseDragging = false;
    },
    mouseDown: function(event) {
        this.mouseMove(event);
        this.mouseDragging = true;
    },
    mouseUp: function(event) {
        this.mouseMove(event);
        this.mouseDragging = false;
    },
    mouseWheel: function(event) {
        var d = event.wheelDelta;
        this.oldZoom = this.zoom;
        this.zoom += d / 400;
        if(this.zoom < 1) this.zoom = 1;
        else if(this.zoom > 4) this.zoom = 4;

        this.updateZoom();
    },
    updateZoom: function() {
        this.zoomOffset = {
            x: (event.clientX + this.zoomOffset.x) / this.oldZoom * this.zoom - event.clientX,
            y: (event.clientY + this.zoomOffset.y) / this.oldZoom * this.zoom - event.clientY
        };

        this.constrainZoom();

        this.oldZoom = this.zoom;
    },
    constrainZoom: function() {
        if(this.zoomOffset.x < 0) this.zoomOffset.x = 0;
        else if(this.zoomOffset.x > this.canvas.width * this.zoom - this.canvas.width) this.zoomOffset.x = this.canvas.width * this.zoom - this.canvas.width;

        if(this.zoomOffset.y < 0) this.zoomOffset.y = 0;
        else if(this.zoomOffset.y > this.canvas.height * this.zoom - this.canvas.height) this.zoomOffset.y = this.canvas.height * this.zoom - this.canvas.height;
    }
};

var conway = new Conway();