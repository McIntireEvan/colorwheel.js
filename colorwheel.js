"use strict";

class ColorWheel {
    constructor(id, size) {
        this.radius = size / 2;
        this.ringsize = size / 10;
        this.color = 0;

        this.length = Math.sqrt(2 * Math.pow(this.radius - this.ringsize, 2));
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
            left: this.can.position().left + this.x - 5,
            top: this.can.position().top + this.y - 5
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
            } else if (dist < _this.radius - _this.ringsize) {
                _this.focusIn = true;
                _this.updateInner(evt);
            }
        });
        $(document).on('mouseup', function (evt) {
            _this.focusOut = _this.focusIn = false;
        }).on('mousemove', function (evt) {
            if (_this.focusOut) {
                _this.updateOuter(evt);
            } else if (_this.focusIn) {
                _this.updateInner(evt);
            }
        });
        $('body').append(this.holder);
    }

    getRGB() {
        var x = this.inner.offset().left - this.can.offset().left + 5;
        var y = this.inner.offset().top - this.can.offset().top + 5;

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
        var middle = this.radius - ((this.ringsize) / 2);
        this.outer.css({
            left: Math.cos(angle) * middle + this.can.position().left + this.x - (this.ringsize / 2) - 2,
            top: Math.sin(angle) * middle + this.can.position().top + this.y - (this.ringsize / 2) - 2
        });
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

    renderInner() {
        for(var i = 0; i < 100; i++) {
            var line = this.ctx.createLinearGradient(
                this.x - this.half,
                this.y - this.half + (i * (this.length / 100)),
                this.x + this.half,
                this.y - this.half + (i * (this.length / 100))
            );

            var stops = 15;

            for(var j = 0; j < stops; j++) {
                var hsl = ColorConvert.HSBToHSL(this.color / 60, j / stops, (100 - i) / 100);
                line.addColorStop(j / stops, 'hsl(' + hsl.h + ',' + hsl.s + '%,' + hsl.l + '%)');
            }

                this.ctx.fillStyle = line;
                if(i < 99) {
                    this.ctx.fillRect(
                        this.x - this.half + 2,
                        (this.y - this.half) + 2 + ((i * (this.length)) / 100),
                        this.length - 2,
                        (this.length / 100) + 2
                    );
                } else {
                    this.ctx.fillRect(
                        this.x - this.half + 2,
                        (this.y - this.half) + 2 + ((i * (this.length)) / 100),
                        this.length - 2,
                        (this.length / 100))
                }
        }
    }

    updateInner(evt) {
        var offset = this.getRelativePos(this.can, evt);
        var xDiff = Math.abs(this.x - offset.x);
        var yDiff = Math.abs(this.y - offset.y);
        var dist = Math.sqrt(Math.pow(this.x - offset.x, 2) + Math.pow(this.y - offset.y, 2));
        if (dist < this.radius - this.ringsize && xDiff < this.half && yDiff < this.half) {
            this.inner.css({
                left: this.can.position().left + offset.x - 5,
                top: this.can.position().top + offset.y - 5
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

        if(dC == 0) {
            return {
                'h': 0, 's': 0, 'l': 0
            };
        }

        L = (cMax + cMin) / 2;

        if(cMax == cMin) {
            S = 0;
        } else {
            S = L < .5 ? (cMax - cMin)/(cMax + cMin) : (cMax - cMin)/(2 - cMax - cMin);
        }

        switch(cMax){
            case r: H = (g-b) / dC; break;
            case g: H = 2 + (b-r)/ dC; break;
            case b: H = 4 + (r - g) / dC; break;
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

        if(S == 0 && B == 1) {
            return {
                'h': H * 60,
                's': S * 100,
                'l': B * 100
            };
        }

        return {
            'h': Math.round(h * 60),
            's': Math.round(s * 100),
            'l': Math.round(l * 100)
        };
    }

    static RGBToHSL(R, G, B) {
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
        } else {
            S = L < .5 ? (cMax - cMin)/(cMax + cMin) : (cMax - cMin)/(2 - cMax - cMin);
        }

        switch(cMax){
            case r: H = (g-b) / dC; break;
            case g: H = 2 + (b-r)/ dC; break;
            case b: H = 4 + (r - g) / dC; break;
        }

        return {
            'h': Math.round(H * 60),
            's': Math.round(S * 100),
            'l': Math.round(L * 100)
        };
    }

    //TODO: Finish
    static HSBToRGB(H,S,B) {
        var c = S * B;
        var x = c * (1 - Math.abs( H / 60) % 2 - 1)
        var m = B - c;

        var R,G,B;


    }
}