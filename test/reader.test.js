'use strict';

const reader = require('../');
const SinkFs = require('@asset-pipe/sink-fs');
const path = require('path');

test('reader(feeds) single feed', async () => {
    expect.assertions(1);
    const sink = new SinkFs({
        path: path.join(__dirname, './test-assets'),
    });
    const feed = JSON.parse(await sink.get('a.json'));

    const result = await reader([feed]);

    expect(result).toContain('my-module-1/main.css');
});

test('reader([stream1, stream2]) mulitple feedStreams merged', async () => {
    expect.assertions(4);
    const sink = new SinkFs({
        path: path.join(__dirname, './test-assets'),
    });
    const feed1 = JSON.parse(await sink.get('a.json'));
    const feed2 = JSON.parse(await sink.get('b.json'));

    const result = await reader([feed1, feed2]);

    expect(result).toContain('my-module-1/main.css');
    expect(result).toContain('my-module-3/main.css');
    expect(result).toContain('my-module-3/dep.css');
    expect(result).toContain('dep/main.css');
});

test('Dedupe of identical hashes occurs', async () => {
    expect.assertions(1);
    const sink = new SinkFs({
        path: path.join(__dirname, './test-assets'),
    });
    const feed1 = JSON.parse(await sink.get('a.json'));
    const feed2 = JSON.parse(await sink.get('d.json'));

    const result = await reader([feed1, feed2]);

    expect(result).toMatchSnapshot();
});

test('reader(): throws on no input', async () => {
    expect.assertions(1);
    try {
        await reader();
    } catch (err) {
        expect(err.message).toMatchSnapshot();
    }
});

test('reader(123): throws on non stream or array input', async () => {
    expect.assertions(1);
    try {
        await reader(123);
    } catch (err) {
        expect(err.message).toMatchSnapshot();
    }
});

test('reader([]): throws on empty array', async () => {
    expect.assertions(1);
    try {
        await reader([]);
    } catch (err) {
        expect(err.message).toMatchSnapshot();
    }
});

test('reader([1,2,3]): throws on array containing non feed items', async () => {
    expect.assertions(1);
    try {
        await reader([1, 2, 3]);
    } catch (err) {
        expect(err.message).toMatchSnapshot();
    }
});

test('reader([s1,s2,s3,s4]) ensure dedupe and correct css concat order', async () => {
    expect.assertions(1);
    const sink = new SinkFs({
        path: path.join(__dirname, './test-assets'),
    });
    const feed1 = JSON.parse(await sink.get('a.json'));
    const feed2 = JSON.parse(await sink.get('b.json'));
    const feed3 = JSON.parse(await sink.get('c.json'));
    const feed4 = JSON.parse(await sink.get('d.json'));

    const bundle = await reader([feed1, feed2, feed3, feed4]);

    expect(bundle.split('\n\n')).toEqual([
        '/* my-module-3/main.css */',
        '/* my-module-3/dep.css */',
        '/* dep/main.css */',
        '/* my-module-2/main.css */',
        '/* my-module-1/main.css */',
    ]);
});
