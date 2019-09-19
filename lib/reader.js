'use strict';

const assert = require('assert');
const { EOL } = require('os');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

module.exports = async function reader(feeds = [], options = {}) {
    assert(
        feeds.length,
        `Expected at least 1 feed to be given. Instead got "${feeds.length}"`
    );
    assert(
        feeds.every(Array.isArray),
        `Expected every feed to be an array. Instead got "${feeds.join(', ')}"`
    );

    feeds = [].concat(...feeds);

    const opts = {
        minify: false,
        ...options,
    };

    const feedMap = new Map();
    feeds.forEach(feed => {
        // because feedMap preserves order, when we get a duplicate we actually
        // need to append to the end of the feedMap. We do that by deleting
        // first and then adding to the feedMap
        feedMap.delete(feed.id);
        feedMap.set(feed.id, feed);
    });

    // backwards compatible refactor to `.source` from `.content`
    const precss = Array.from(feedMap.values())
        .map(feed => (feed.source || feed.content).trim())
        .join(EOL + EOL);

    const processor = postcss(autoprefixer());

    if (opts.minify) {
        processor.use(cssnano());
    }

    const { css } = await processor.process(precss, { map: false });

    return css;
};
