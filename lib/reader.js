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

    feeds = [].concat(...feeds);

    const feedMap = new Map();
    feeds.forEach(feed => {
        // because feedMap preserves order, when we get a duplicate we actually
        // need to append to the end of the feedMap. We do that by deleting
        // first and then adding to the feedMap
        feedMap.delete(feed.id);
        feedMap.set(feed.id, feed);
    });
    const dedupedFeeds = Array.from(feedMap.values());
    return dedupedFeeds.map(feed => feed.content.trim()).join('\n\n');
};
