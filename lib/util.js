'use strict';

const { Transform } = require('readable-stream');

function compareByOrder(a, b) {
    if (a.order === b.order) {
        return 0;
    }
    return a.order > b.order ? 1 : -1;
}

class Dedupe extends Transform {
    constructor() {
        super({
            objectMode: true,
        });

        this.rows = new Map();
    }

    _transform(chunk, enc, callback) {
        if (chunk && chunk.id) {
            this.rows.set(chunk.id, chunk);
        }

        callback();
    }

    _flush(callback) {
        Array.from(this.rows.values())
            .sort(compareByOrder)
            .forEach(row => this.push(row));
        callback();
    }
}

class SetOrder extends Transform {
    constructor(index) {
        super({
            objectMode: true,
        });

        this.index = index;
    }

    _transform(chunk, enc, callback) {
        chunk.order = this.index;
        callback(null, chunk);
    }
}

class Sort extends Transform {
    constructor() {
        super({
            objectMode: true,
        });

        this.rows = new Map();
    }

    _transform(chunk, enc, callback) {
        if (chunk && chunk.order != null) {
            this.rows.set(chunk.order, chunk);
        }
        callback();
    }

    _flush(callback) {
        Array.from(this.rows.values())
            .sort(compareByOrder)
            .forEach(row => this.push(row));
        callback();
    }
}

module.exports = {
    dedupe() {
        return new Dedupe();
    },
    setOrder(index) {
        return new SetOrder(index);
    },
    sort() {
        return new Sort();
    },
    compareByOrder,
};
