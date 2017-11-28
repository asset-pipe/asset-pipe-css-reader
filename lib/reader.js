'use strict';

const assert = require('assert');

module.exports = async function reader(feeds = []) {
    assert(
        feeds.length,
        `Expected at least 1 feed to be given. Instead got "${feeds.length}"`
    );
    assert(
        feeds.every(Array.isArray),
        `Expected every feed to be an array. Instead got "${feeds.join(', ')}"`
    );

    feeds = feeds.reduce((prev, current) => prev.concat(current), []);

    const map = new Map();
    feeds.forEach(feed => {
        // because map preserves order, when we get a duplicate we actually
        // need to append to the end of the map. We do that by deleting
        // first and then adding to the map
        map.delete(feed.id);
        map.set(feed.id, feed);
    });
    return Array.from(map.values())
        .map(feed => feed.content.trim())
        .join('\n\n');
};
