# vite-transform-globby-import ⚡

[![npm][npm-img]][npm-url]
[![node][node-img]][node-url]

This transform is an simple resolution for enchancement of 'import statement'. It just replace the globby 'import statement' with multiple import lines before the default transforms.


## Status

In rc.1 and will likely release 1.0 soon.

## Getting Started

### Install (yarn or npm)

`yarn add vite-transform-globby-import` or `npm i vite-transform-globby-import`

### Usage

```javascript
// vite.config.js
const sharedConfig = {
  alias: {
    '/@/': path.resolve(__dirname, 'src'),
  },
}
module.exports = {
  ...sharedConfig,
  transforms: [require('vite-transform-globby-import')(sharedConfig)],
}
```

Example:
```ts
import routes from '../pages/**/route.ts'
import imgs from '/@/assets/image/**/*.@(jpg|png)'
// These will be replaced to:
/* 
 * import * as routes0 from '/@/pages/route.ts'
 * import * as routes1 from '/@/pages/demo/route.ts'
 * ...
 * const routes = { routes0, routes1, ... }
 * import * as imgs0 from '/@/assets/image/demo.jpg'
 * import * as imgs1 from '/@/assets/image/demo/demo.png'
 * ...
 * const imgs = { imgs0, imgs1, ... }
 */
```

**Note:** Only work in files includes `.vue,.js,.jsx,.ts,.tsx`. 


## License

MIT

[npm-img]: https://img.shields.io/badge/npm-v1.0.0--rc.1-green.svg
[npm-url]: https://npmjs.com/package/vite-transform-globby-import
[node-img]: https://img.shields.io/node/v/vite.svg
[node-url]: https://nodejs.org/en/about/releases/
<!-- [unix-ci-img]: https://circleci.com/gh/vitejs/vite.svg?style=shield
[unix-ci-url]: https://app.circleci.com/pipelines/github/vitejs/vite
[windows-ci-img]: https://ci.appveyor.com/api/projects/status/0q4j8062olbcs71l/branch/master?svg=true
[windows-ci-url]: https://ci.appveyor.com/project/yyx990803/vite/branch/master -->
