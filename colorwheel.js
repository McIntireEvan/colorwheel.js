"use strict";

class ColorWheel {
    /**
     * Constructs the HSV colorwheel
     * @param {string} id - The id that will be given to the div holding all the elements
     * @param {Number} size - The diameter of the colorwheel
     */
    constructor(id, size, onColorChange) {
        this.radius = size / 2;
        this.ringsize = size / 10;
        this.onColorChange = onColorChange;
        this.color = 0;

        this.length = Math.sqrt(2 * Math.pow(this.radius - this.ringsize, 2)); //Size of the inner square
        this.half = this.length / 2;

        this.can = $('<canvas>').attr({
            width: size,
            height: size
        });
        this.ctx = this.can.get(0).getContext('2d');

        this.outer = $('<div/>').addClass('colorwheel-outer').css({
            width: this.ringsize,
            height: this.ringsize
        });
        this.inner = $('<div/>').addClass('colorwheel-inner');

        this.holder = $('<div/>').attr('id', id).append(this.outer).append(this.inner).append(this.can);
        this.x = this.y = this.radius;

        this.setHue(this.color * (Math.PI / 180));
        this.inner.css({
            left: this.can.position().left + this.x - 2.5,
            top: this.can.position().top + this.y - 2.5
        });

        this.focusOut = false, this.focusIn = false;

        this.renderOuter();
        this.renderInner();

        var _this = this;
        $(this.holder).on('mousedown', function (evt) {
            evt.preventDefault();
            var offset = _this.getRelativePos(_this.can, evt);
            var dist = Math.sqrt(Math.pow(_this.x - offset.x, 2) + Math.pow(_this.y - offset.y, 2));
            if (dist < _this.radius && dist > _this.radius - _this.ringsize) {
                _this.focusOut = true;
                _this.updateOuter(evt);
                onColorChange();
            } else if (dist < _this.radius - _this.ringsize) {
                _this.focusIn = true;
                _this.updateInner(evt);
                onColorChange();
            }
        });
        $(document).on('mouseup', function (evt) {
            _this.focusOut = _this.focusIn = false;
        }).on('mousemove', function (evt) {
            if (_this.focusOut) {
                _this.updateOuter(evt);
                onColorChange();
            } else if (_this.focusIn) {
                _this.updateInner(evt);
                onColorChange();
            }
        });
        $('body').append(this.holder);
    }

    getRGB() {
        var x = this.inner.offset().left - this.can.offset().left + 3;
        var y = this.inner.offset().top - this.can.offset().top + 3;

        var c = this.ctx.getImageData(x, y, 1, 1).data;
        return { 'r': c[0], 'g': c[1], 'b': c[2] };
    }

    getHex() {
        var rgb = this.getRGB();
        return this.toHex(rgb.r) + this.toHex(rgb.g) + this.toHex(rgb.b);
    }

    getHSL() {
        var rgb = this.getRGB();
        return ColorConvert.RGBToHSL(rgb.r, rgb.g, rgb.b);
    }

    toHex(value) {
        var hex = value.toString(16);
        return hex.length == 1 ? '0' + hex : hex;
    }

    setHue(angle) {
        this.color = angle * 60;
        var middle = this.radius - ((this.ringsize) / 2);
        this.outer.css({
            left: Math.cos(angle) * middle + this.can.position().left + this.x - (this.ringsize / 2) - 2,
            top: Math.sin(angle) * middle + this.can.position().top + this.y - (this.ringsize / 2) - 2
        });
    }

    setColor(r, g, b) {
        var hsl = ColorConvert.RGBtoHSL(r, g, b);
        var hsv = ColorConvert.HSLToHSB(hsl.h / 60, hsl.s / 100, hsl.l / 100);
        this.setHue(hsv.h / 60);
        this.renderInner();

        this.inner.css({
            left: this.x - this.half + ((this.length) * (hsv.s / 100)) - 3,
            top: this.y + this.half - ((this.length) * (hsv.b / 100)) - (hsv.b == 0 ? 2 : 0)
        });
    }
    
    setColorHex(hex) {
        var rgb = ColorConvert.HexToRGB(hex);
        this.setColor(rgb.r, rgb.g, rgb.b);
    }

    renderOuter() {
        for (var i = 0; i < 360; i++) {
            this.ctx.beginPath();
            this.ctx.fillStyle = 'hsl(' + i + ', 100%, 50%)';
            this.ctx.moveTo(this.x, this.y);
            this.ctx.arc(this.x, this.y, this.radius, (i - 2) * (Math.PI / 180), (i * (Math.PI / 180)), false);
            this.ctx.lineTo(this.x, this.y);
            this.ctx.fill();
        }
        //Draw white to hide the center area
        this.ctx.beginPath();
        this.ctx.fillStyle = 'white';
        this.ctx.moveTo(this.x, this.y);
        this.ctx.arc(this.x, this.y, this.radius - this.ringsize, 0, 2 * Math.PI, false);
        this.ctx.fill();
    }

    _clean(val) {
        val = Math.round(val);
        if(val % 2 != 0) {
            val -= 1;
        }
        return val;
    }

    renderInner() {
        var startX = this.x - this.half - 1;
        startX = this._clean(startX);
        for(var i = 0; i < 100; i++) {
            var line = this.ctx.createLinearGradient(
                startX,
                this._clean(this.y - this.half + (i * (this.length / 100)) ),
                this._clean(this.x + this.half + 2),
                this._clean(this.y - this.half + (i * (this.length / 100))) + 2
            );

            var stops = 15;

            for(var j = 0; j < stops; j++) {
                var s = (j == stops - 1 ? 1 : 0) + j;
                var l = 100 - i - (i == 99 ? 1 : 0) ;
                var hsl = ColorConvert.HSBToHSL(this.color / 60, s / stops, l / 100);
                line.addColorStop(j / stops, 'hsl(' + hsl.h + ',' + hsl.s + '%,' + hsl.l + '%)');
            }

                this.ctx.fillStyle = line;
                    this.ctx.fillRect(
                        startX,
                        this._clean((this.y - this.half) + 2 + ((i * (this.length)) / 100)),
                        this._clean(this.length + 2),
                        this._clean((this.length / 100) ) + 2
                    );
        }
    }

    updateInner(evt) {
        var offset = this.getRelativePos(this.can, evt);
        var xDiff = Math.abs(this.x - offset.x);
        var yDiff = Math.abs(this.y - offset.y);
        var dist = Math.sqrt(Math.pow(this.x - offset.x, 2) + Math.pow(this.y - offset.y, 2));
        if (dist < this.radius - this.ringsize && xDiff < this.half + 1 && yDiff < this.half - .5) {
            this.inner.css({
                left: this.can.position().left + offset.x - 3,
                top: this.can.position().top + offset.y - 3
            });
        }
    }

    updateOuter(evt) {
        var offset = this.getRelativePos(this.can, evt);
        var rawAngle = Math.atan2(offset.y - this.y, offset.x - this.x), angle = rawAngle * 180 / Math.PI;
        if (rawAngle < 0) {
            angle = 360 - (angle * -1);
        }
        this.setHue(rawAngle);
        this.color = Math.round(angle);
        this.renderInner();
    }

    getRelativePos(element, evt) {
        var parentOffset = $(element).offset();
        var eX = evt.pageX - parentOffset.left;
        var eY = evt.pageY - parentOffset.top;
        return { x: eX, y: eY };
    }
}

class ColorConvert {
    static RGBtoHSL(R, G, B) {
        var H,S,L;

        var r = R / 255;
        var g = G / 255;
        var b = B / 255;

        var cMax = Math.max(r, g, b);
        var cMin = Math.min(r, g, b);

        var dC = cMax - cMin;

        L = (cMax + cMin) / 2;

        if(cMax == cMin) {
            S = 0;
            H = 0;
        } else {
            S = L < .5 ? (cMax - cMin)/(cMax + cMin) : (cMax - cMin)/(2 - cMax - cMin);
            switch(cMax){
                case r: H = (g-b) / dC; break;
                case g: H = 2 + (b-r)/ dC; break;
                case b: H = 4 + (r - g) / dC; break;
            }
        }

        return {
            'h': Math.round(H * 60),
            's': Math.round(S * 100),
            'l': Math.round(L * 100)
        };
    }

    static HSLToHSB (H,S,L) {
        var h, s, b;
        h = H;
        b = (2 * L + S*(1 - Math.abs(2*L - 1))) / 2;

        if(b == 0) {
            return {
                'h': 0,
                's': 0,
                'b': 0
            };
        }

        s = (2 * (b - L))/b;

        return {
            'h': Math.round(h * 60),
            's': Math.round(s * 100),
            'b': Math.round(b * 100)
        };
    }

    static HSBToHSL(H,S,B) {
        var h, s, l;
        h = H;

        l = .5 * B * (2 - S);

        s = (B * S) / (1 - Math.abs(2 * l - 1));
        if((S == 0 || isNaN(s)) && B == 1) {
            return {
                'h': H * 60,
                's': 0,
                'l': 100
            };
        } else if((S == 0 || isNaN(s)) && B == 0) {
            return {
                'h': H * 60,
                's': 0,
                'l': 0
            };
        }

        return {
            'h': Math.round(h * 60),
            's': Math.round(s * 100),
            'l': Math.round(l * 100)
        };
    }
    
    static HexToRGB(hex) {
        hex = hex.replace('#','');
        var R = parseInt(hex.substring(0,2), 16);
        var G = parseInt(hex.substring(2,4), 16);
        var B = parseInt(hex.substring(4,6), 16);
        
        return { 'r': R, 'g': G, 'b': B };
    }

    //TODO: Finish
    static HSBToRGB(H,S,B) {
        var c = S * B;
        var x = c * (1 - Math.abs( H / 60) % 2 - 1)
        var m = B - c;

        var R,G,B;


    }
}