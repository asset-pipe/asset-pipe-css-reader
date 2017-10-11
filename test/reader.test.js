const Reader = require('../');
const SinkFs = require('asset-pipe-sink-fs');
const path = require('path');
const { sort, dedupe, compareByOrder } = require('../lib/util');
const { Readable, PassThrough } = require('stream');

function createSlowStream(sink, filePath, timeout = 1000) {
    const myStream = new PassThrough();

    process.nextTick(() => myStream.emit('file found', filePath));

    setTimeout(() => {
        sink.reader(filePath).pipe(myStream);
    }, timeout);

    return myStream;
}

test('new Reader(stream) single feedStream', done => {
    expect.assertions(1);
    const sink = new SinkFs({
        path: path.join(__dirname, './test-assets')
    });
    const feedStream = sink.reader('a.json');

    const reader = new Reader(feedStream);

    reader.on('pipeline ready', () => {
        let bundle = '';
        reader.on('data', data => (bundle += data));
        reader.on('end', () => {
            expect(bundle).toContain('my-module-1/main.css');
            done();
        });
    });
});

test('new Reader([stream1, stream2]) mulitple feedStreams merged', done => {
    expect.assertions(4);
    const sink = new SinkFs({
        path: path.join(__dirname, './test-assets')
    });
    const feedStream1 = sink.reader('a.json');
    const feedStream2 = sink.reader('b.json');

    const reader = new Reader([feedStream1, feedStream2]);

    reader.on('pipeline ready', () => {
        let bundle = '';
        reader.on('data', data => (bundle += data));
        reader.on('end', () => {
            expect(bundle).toContain('my-module-1/main.css');
            expect(bundle).toContain('my-module-3/main.css');
            expect(bundle).toContain('my-module-3/dep.css');
            expect(bundle).toContain('dep/main.css');
            done();
        });
    });
});

test('Dedupe of identical hashes occurs', done => {
    expect.assertions(1);
    const sink = new SinkFs({
        path: path.join(__dirname, './test-assets')
    });
    const feedStream1 = sink.reader('a.json');
    const feedStream2 = sink.reader('d.json');

    const reader = new Reader([feedStream1, feedStream2]);

    reader.on('pipeline ready', () => {
        let bundle = [];
        reader.on('data', data => bundle.push(data.toString()));
        reader.on('end', () => {
            expect(bundle.length).toBe(1);
            done();
        });
    });
});

test('Event: file found', done => {
    expect.assertions(1);
    const sink = new SinkFs({
        path: path.join(__dirname, './test-assets')
    });
    const feedStream = sink.reader('a.json');
    const reader = new Reader(feedStream);

    reader.on('file found', file => {
        expect(file).toBe('a.json');
    });

    reader.on('end', done);
    reader.resume();
});

test('Event: file not found single stream', done => {
    expect.assertions(1);
    const sink = new SinkFs({
        path: path.join(__dirname, './test-assets')
    });
    const feedStream = sink.reader('does-not-exist.json');
    const reader = new Reader(feedStream);

    reader.on('file not found', file => {
        expect(file).toBe('does-not-exist.json');
        done();
    });

    reader.on('end', () => {});
    reader.resume();
});

test('Event: file not found multiple streams', done => {
    expect.assertions(2);
    const sink = new SinkFs({
        path: path.join(__dirname, './test-assets')
    });
    const feedStream1 = sink.reader('a.json');
    const feedStream2 = sink.reader('does-not-exist.json');
    const reader = new Reader([feedStream1, feedStream2]);

    reader.on('file not found', file => {
        expect(file).toBe('does-not-exist.json');
    });

    reader.on('file found', file => {
        expect(file).toBe('a.json');
    });

    reader.on('end', done);
    reader.resume();
});

test('Event: parse error', done => {
    expect.assertions(1);
    const sink = new SinkFs({
        path: path.join(__dirname, './test-assets')
    });
    const feedStream = sink.reader('invalid-json.json');
    const reader = new Reader(feedStream);

    reader.on('error', err => {
        expect(err).toBeInstanceOf(Error);
        done();
    });
    reader.on('data', data => {
        console.log(data);
    });
    reader.on('end', () => {});

    reader.resume();
});

test('new Reader(): throws on no input', () => {
    expect.assertions(1);
    const result = () => new Reader();
    expect(result).toThrow();
});

test('new Reader(123): throws on non stream or array input', () => {
    expect.assertions(1);
    const result = () => new Reader(123);
    expect(result).toThrow();
});

test('new Reader([]): throws on empty array', () => {
    expect.assertions(1);
    const result = () => new Reader([]);
    expect(result).toThrow();
});

test('new Reader([1,2,3]): throws on array containing non stream items', () => {
    expect.assertions(1);
    const result = () => new Reader([1, 2, 3]);
    expect(result).toThrow();
});

test('SortAndDedupe() rows without id value dropped', done => {
    const values = [{ id: 'asd' }, { x: '' }, { id: 'sdf' }];
    const stream = new Readable({
        objectMode: true,
        read() {
            if (values.length === 0) {
                this.push(null);
                return;
            }
            const value = values.shift();
            this.push(value);
        }
    });
    const buffer = [];
    stream
        .pipe(dedupe())
        .on('data', data => buffer.push(data))
        .on('end', () => {
            expect(buffer.length).toBe(2);
            done();
        });
});

test('new Reader([s1,s2,s3,s4]) ensure dedupe and correct css concat order', done => {
    expect.assertions(3);
    const sink = new SinkFs({
        path: path.join(__dirname, './test-assets')
    });
    const feedStream1 = sink.reader('a.json');
    const feedStream2 = sink.reader('b.json');
    const feedStream3 = sink.reader('c.json');
    const feedStream4 = sink.reader('d.json');

    const reader = new Reader([
        feedStream1,
        feedStream2,
        feedStream3,
        feedStream4
    ]);

    reader.on('pipeline ready', () => {
        let bundle = [];
        reader.on('data', data => bundle.push(data.toString()));
        reader.on('end', () => {
            expect(bundle[0]).toBe(
                '/* my-module-3/main.css */\n\n/* my-module-3/dep.css */\n\n/* dep/main.css */\n'
            );
            expect(bundle[1]).toBe('/* my-module-2/main.css */\n');
            expect(bundle[2]).toBe('/* my-module-1/main.css */\n');
            done();
        });
    });
});

test('new Reader([s1,s2,s3,s4]) operates correctly under slow speed conditions', done => {
    expect.assertions(3);
    const sink = new SinkFs({
        path: path.join(__dirname, './test-assets')
    });

    const feedStream1 = createSlowStream(sink, 'a.json', 800);
    const feedStream2 = sink.reader('b.json');
    const feedStream3 = createSlowStream(sink, 'c.json', 500);
    const feedStream4 = createSlowStream(sink, 'd.json', 100);

    const reader = new Reader([
        feedStream1,
        feedStream2,
        feedStream3,
        feedStream4
    ]);

    reader.on('pipeline ready', () => {
        let bundle = [];
        reader.on('data', data => bundle.push(data.toString()));
        reader.on('end', () => {
            expect(bundle[0]).toBe(
                '/* my-module-3/main.css */\n\n/* my-module-3/dep.css */\n\n/* dep/main.css */\n'
            );
            expect(bundle[1]).toBe('/* my-module-2/main.css */\n');
            expect(bundle[2]).toBe('/* my-module-1/main.css */\n');
            done();
        });
    });
});

test('compareByOrder(a, b) a and b are the same', () => {
    expect.assertions(1);
    expect(compareByOrder(1, 1)).toBe(0);
});

test('sort() transform operating on stream items without order property', done => {
    expect.assertions(1);
    const items = [
        { order: 1 },
        { order: null },
        { order: undefined },
        { noOrder: 'hi' }
    ];
    const stream = new Readable({
        objectMode: true,
        read() {
            if (!items.length) {
                this.push(null);
                return;
            }
            this.push(items.shift());
        }
    });

    const buffer = [];
    stream
        .pipe(sort())
        .on('data', data => buffer.push(data))
        .on('end', () => {
            expect(buffer.length).toBe(1);
            done();
        });
});
