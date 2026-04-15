# sanity-plugin-workflows

## Installation

```sh
npm install sanity-plugin-workflows
```

## Usage

Add it as a plugin in `sanity.config.ts` (or .js):

```ts
import {defineConfig} from 'sanity'
import {workflowsPlugin} from 'sanity-plugin-workflows'

export default defineConfig({
  //...
  plugins: [workflowsPlugin({})],
})
```

## License

[MIT](LICENSE) © Sam Hemingway

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.
