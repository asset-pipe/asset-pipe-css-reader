<!-- TITLE/ -->

<h1>asset-pipe-css-reader</h1>

<!-- /TITLE -->


<!-- BADGES/ -->

<span class="badge-travisci"><a href="http://travis-ci.org/asset-pipe/asset-pipe-css-reader" title="Check this project's build status on TravisCI"><img src="https://img.shields.io/travis/asset-pipe/asset-pipe-css-reader/master.svg" alt="Travis CI Build Status" /></a></span>
<span class="badge-npmversion"><a href="https://npmjs.org/package/asset-pipe-css-reader" title="View this project on NPM"><img src="https://img.shields.io/npm/v/asset-pipe-css-reader.svg" alt="NPM version" /></a></span>
<span class="badge-daviddm"><a href="https://david-dm.org/asset-pipe/asset-pipe-css-reader" title="View the status of this project's dependencies on DavidDM"><img src="https://img.shields.io/david/asset-pipe/asset-pipe-css-reader.svg" alt="Dependency Status" /></a></span>
<span class="badge-daviddmdev"><a href="https://david-dm.org/asset-pipe/asset-pipe-css-reader#info=devDependencies" title="View the status of this project's development dependencies on DavidDM"><img src="https://img.shields.io/david/dev/asset-pipe/asset-pipe-css-reader.svg" alt="Dev Dependency Status" /></a></span>

<!-- /BADGES -->


A module that takes any number of css feed streams (provided by asset-pipe sinks) and bundles them into a readable stream of css content.

This is an internal module intended for use by other modules in the [asset-pipe project](https://github.com/asset-pipe).

## Overview

Given any number of css feed streams, the reader will:
1. Merge streams into a single stream
2. Dedupe any items with identical id hashes keeping the last occurrence
3. Ensure order of streams given is preserved for the final output CSS

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
        content: '/* ... */'
    }
]
```

## Installation

```bash
npm install asset-pipe-css-reader
```

## Usage

### Require the reader
```js
const CssReader = require('asset-pipe-css-reader')
```

### Instantiating the reader

Either pass a single stream created by an asset-pipe sink:
```js
const sink = new SinkFs({
    path: '/path/to/css/feeds'
});
const feedStream = sink.reader('feed-a.json');
const reader = new CssReader(feedStream)
```

Or pass an array of streams:
```js
const sink = new SinkFs({
    path: '/path/to/css/feeds'
});
const feedStream1 = sink.reader('feed-a.json');
const feedStream2 = sink.reader('feed-b.json');
const reader = new CssReader([feedStream1, feedStream2])
```

### Consuming content from the reader

You should wait for the reader to become ready by listening for the `pipeline ready` event.

The reader is a readable stream so in order to access the data you may register a data handler
and listen for chunks to be passed to the handler:
```js
reader.on('pipeline ready', () => {
    reader.on('data', data => {
        // ..
    })
})
```

You might also pipe the reader into a writeable or transform stream:
```js
const { writeFile } = require('fs')
const consumer = writeFile('/path/to/save/file')

reader.on('pipeline ready', () => {
    reader.pipe(consumer)
})
```

## API

### Methods

#### constructor

Constructor takes a single stream or array of streams. Streams should be produced with an asset-pipe sink such as: 
- [asset-pipe-sink-s3](https://github.com/asset-pipe/asset-pipe-sink-s3`)
- [asset-pipe-sink-fs](https://github.com/asset-pipe/asset-pipe-sink-fs`)
- [asset-pipe-sink-gcs](https://github.com/asset-pipe/asset-pipe-sink-gcs`)
- [asset-pipe-sink-mem](https://github.com/asset-pipe/asset-pipe-sink-mem`)

Examples
```js
new CssReader(stream)
```
```js
new CssReader([stream, ...stream])
```

Returns: `Readable Stream`

### Events

#### file found

Event produced whenever an underlying feed stream successfully reads its feed
file from disk

```js
cssReader.on('file found', file => {})
```

Param: `file`, name of the file given to the feed stream to read from

#### file not found

Event produced whenever an underlying feed stream is unable to read its feed
file from disk

```js
cssReader.on('file not found', file => {})
```

Param: `file`, name of the file given to the feed stream to read from

#### pipeline ready

Event produced once all feed file streams have been successfully merged into
a pipeline

```js
cssReader.on('pipeline ready', () => {})
```

#### data

Event that emits chunks of CSS content to a consumer

```js
cssReader.on('data', chunk => {})
```

Param: `chunk`, a piece of CSS text

#### error

Event produced whenever any of the various stages of the pipeline emit errors

```js
cssReader.on('error', err => {})
```

Param: `err`, Error forwarded from merged streams or otherwise emitted from the pipeline

## Contributing

The contribution process is as follows:

- Fork this repository.
- Make your changes as desired.
- Run the tests using `npm test`. This will also check to ensure that 100% code coverage is maintained. If not you may need to add additional tests.
- Stage your changes.
- Run `git commit` or, if you are not familiar with [sematic commit messages](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit), please run `npm run cm` and follow the prompts instead which will help you write a correct semantic commit message.
- Push your changes and submit a PR.
