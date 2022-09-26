class Point {
    x;
    y;

    constructor(x=0, y=0) {
        this.x = x;
        this.y = y;
    }

    plus(other) {
        return new Point(this.x + other.x, this.y + other.y);
    }

    minus(other) {
        return this.plus(other.negate());
    }

    scale(scale) {
        return new Point(this.x * scale, this.y * scale);
    }

    negate() {
        return this.scale(-1);
    }

    rotate90({around=ORIGIN, times=1}) {
        times %= 4;
        if (times == 0) {
            return this;
        }
        let translated = around != ORIGIN ? this.minus(around) : this;
        let x = translated.x;
        let y = translated.y;
        while (times--) {
            [x, y] = [y, -x];
        }
        return new Point(x, y);
    }

    distance(other) {
        return Math.sqrt(this.sqdistance(other));
    }

    sqdistance(other) {
        return (other.x - this.x) ** 2 + (other.y - this.y) ** 2;
    }
}

const ORIGIN = new Point(0, 0);
window.ORIGIN = ORIGIN;

class Transform {
    transform;
    parent;
    position;

    constructor({parent, position, localPosition}) {
        this.transform = this;
        this.parent = (parent || window.TRANSFORM_ORIGIN)?.transform;
        this.position = position != null ? position
                        : localPosition != null ? this.parent.position.plus(localPosition)
                        : new Point();
    }

    set parent(v) {
        this.parent = v || TRANSFORM_ORIGIN;
    }

    get localPosition() {
        return this.position.minus(this.parent.position);
    }

    set localPosition(v) {
        this.position = this.parent.position.plus(v);
    }
}

const TRANSFORM_ORIGIN = new Transform({"position": ORIGIN});
window.TRANSFORM_ORIGIN = TRANSFORM_ORIGIN;

function mixin(_class, ...mixins) {
    return mixins.reduce((c, m) => Object.assign(c, m), _class);
}
