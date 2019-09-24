<!-- TITLE/ -->

<h1>@asset-pipe/css-reader</h1>

<!-- /TITLE -->


<!-- BADGES/ -->

<span class="badge-travisci"><a href="http://travis-ci.org/asset-pipe/asset-pipe-css-reader" title="Check this project's build status on TravisCI"><img src="https://img.shields.io/travis/asset-pipe/asset-pipe-css-reader/master.svg" alt="Travis CI Build Status" /></a></span>
<span class="badge-npmversion"><a href="https://npmjs.org/package/@asset-pipe/css-reader" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@asset-pipe/css-reader.svg" alt="NPM version" /></a></span>
<span class="badge-daviddm"><a href="https://david-dm.org/asset-pipe/asset-pipe-css-reader" title="View the status of this project's dependencies on DavidDM"><img src="https://img.shields.io/david/asset-pipe/asset-pipe-css-reader.svg" alt="Dependency Status" /></a></span>
<span class="badge-daviddmdev"><a href="https://david-dm.org/asset-pipe/asset-pipe-css-reader#info=devDependencies" title="View the status of this project's development dependencies on DavidDM"><img src="https://img.shields.io/david/dev/asset-pipe/asset-pipe-css-reader.svg" alt="Dev Dependency Status" /></a></span>

<!-- /BADGES -->


[![Greenkeeper badge](https://badges.greenkeeper.io/asset-pipe/asset-pipe-css-reader.svg)](https://greenkeeper.io/)

A module that takes any number of css feeds and bundles them into a css bundle.

This is an internal module intended for use by other modules in the [asset-pipe project](https://github.com/asset-pipe).

## Overview

Given any number of css feeds, the reader will:
1. Merge feeds into a single feed
2. Dedupe any items with identical id hashes keeping the last occurrence
3. Ensure order of feeds given is preserved for the final output CSS

### Input data format

The following is an example of a feed file:
(Something like /path/to/feeds/feed-a.json)

```js
[
    {
        // Unique id for entry. Created by hashing together name, version and file
        id: '4f32a8e1c6cf6e5885241f3ea5fee583560b2dfde38b21ec3f9781c91d58f42e',
        name: 'my-module-1',
        version: '1.0.1',
        file: 'my-module-1/main.css',
        // bundled css content with any @import statements inlined
        source: '/* ... */'
    }
]
```

## Installation

```bash
npm install @asset-pipe/css-reader
```

## Usage

### Require the reader
```js
const cssReader = require('@asset-pipe/css-reader')
```

### Instantiating the reader

Pass feeds created by an asset-pipe sink:
```js
const sink = new SinkFs({
    path: '/path/to/css/feeds'
});
const feed1 = JSON.parse(await sink.get('feed-a.json'));
const feed2 = JSON.parse(await sink.get('feed-b.json'));
const bundle = await cssReader([feed1, feed2])
```

## API

Reader takes an array of feeds. Feeds should be produced with an asset-pipe sink such as: 
- [asset-pipe-sink-s3](https://github.com/asset-pipe/asset-pipe-sink-s3`)
- [asset-pipe-sink-fs](https://github.com/asset-pipe/asset-pipe-sink-fs`)
- [asset-pipe-sink-gcs](https://github.com/asset-pipe/asset-pipe-sink-gcs`)
- [asset-pipe-sink-mem](https://github.com/asset-pipe/asset-pipe-sink-mem`)

Example
```js
const bundle = await cssReader([feed, ...feeds])
```

This module has the following API:

### function(feeds, [options])

Supported arguments are:

* `feeds` - Array - An Array of feeds.
* `options` - Object - configuration.
    * `options.minify` (default: false) Specify whether to minify code using [cssnano](https://cssnano.co/).

Returns: `Promise<string>` - A promise that resolves to a bundle string that is processed by [autoprefixer](https://github.com/postcss/autoprefixer).

Remember to specify a [browserslist](https://github.com/browserslist/browserslist) in your project to ensure cssnano and autoprefixer support the browsers your users use.

## Contributing

The contribution process is as follows:

- Fork this repository.
- Make your changes as desired.
- Run the tests using `npm test`. This will also check to ensure that 100% code coverage is maintained. If not you may need to add additional tests.
- Stage your changes.
- Run `git commit` or, if you are not familiar with [sematic commit messages](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit), please run `npm run cm` and follow the prompts instead which will help you write a correct semantic commit message.
- Push your changes and submit a PR.
