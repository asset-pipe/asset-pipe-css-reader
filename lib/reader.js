const { Readable, PassThrough, Transform } = require('stream');
const { stringify, parse } = require('JSONStream');
const mergeStream = require('merge-stream');
const { dedupe, sort, setOrder } = require('./util');
const assert = require('assert');

module.exports = class Reader extends Readable {
    constructor(streams) {
        super();

        assert(
            streams,
            `Expected first argument to new Reader() to be a stream or array of streams. 
            Instead got ${typeof stream}`
        );

        if (!Array.isArray(streams)) {
            streams = [streams];
        }

        assert(
            streams.length,
            `Expected at least one stream to be provided to new Reader(). Got none.`
        );

        const merged = mergeStream();

        let count = 0;
        streams.forEach((readStream, index) => {
            const tmpStream = new PassThrough({ objectMode: true });
            merged.add(tmpStream);

            readStream.on('file found', file => {
                this.emit('file found', file);
                readStream
                    .pipe(parse('*'))
                    .on('error', err => {
                        this.emit('error', err);
                    })
                    .pipe(setOrder(index))
                    .pipe(tmpStream);

                count++;
                if (count === streams.length) {
                    this.emit('pipeline ready');
                }
            });

            readStream.on('file not found', file => {
                this.emit('file not found', file);
                tmpStream.end();

                count++;
                if (count === streams.length) {
                    this.emit('pipeline ready');
                }
            });
        });

        this.data = merged.pipe(sort()).pipe(dedupe());
        this.data.pause();

        this.data.on('data', chunk => {
            this.push(chunk.content);
        });

        this.data.on('end', () => {
            this.push(null);
        });
    }

    _read(size) {
        return this.data.resume();
    }
};
