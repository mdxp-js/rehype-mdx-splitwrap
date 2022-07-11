<div align="center">

<img alt="Logo" src="https://raw.githubusercontent.com/mdxp-js/.github/main/images/logo.svg?sanitize=true" width="100%"/>

_Web Slides Made Easy_

# REHYPE MDX - Split Wrap
[![main](https://github.com/mdxp-js/rehype-mdx-splitwrap/actions/workflows/main.yml/badge.svg)](https://github.com/mdxp-js/rehype-mdx-splitwrap/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/mdxp-js/rehype-mdx-splitwrap/branch/main/graph/badge.svg?token=Y7P3PF5SKQ)](https://codecov.io/gh/mdxp-js/rehype-mdx-splitwrap)

</div>

[Rehype](https://github.com/rehypejs/rehype) plugin to split MDX content on a specific component and wrap the resulting splits in another component.  
Its main use is to enable automatic slide creation for [MDXP](https://github.com/mdxp-js/mdxp).

Most users should not bother with this low level plugin and instead use one of the MDXP starter templates.  
However, if you want to create your own MDXP pipeline, this plugin is the core of MDXP and transforms your MDX content, by it splitting on `<hr/>` tags and wrapping the resulting splits in `<Slide/>` tags.

## Installation
This package is ESM only: Node 12+ is needed to use it and it must be imported instead of required.

### NPM
```bash
npm install @mdxp/rehype-mdx-splitwrap
```

### YARN
```bash
yarn add @mdxp/rehype-mdx-splitwrap
```

### PNPM
```bash
pnpm add @mdxp/rehype-mdx-splitwrap
```

## Usage
In order to use this plugin, you should specify it in the list of `rehypePlugins` of your mdx compilation pipeline.

Let's say we have the following `example.mdx` file:
```md
# Split 1
content

---

# Split 2
- a
- b
- c
```

The following build pipeline in `example.js` will then compile the mdx file.
```js
import {readFileSync} from 'fs'
import {compileSync} from '@mdx-js/mdx'
import rehypeSplitWrap from '@mdxp/rehype-mdx-splitwrap'

const result = compileSync(
  readFileSync('.sandbox/demo.mdx'),
  {
    jsx: true,
    rehypePlugins: [[rehypeSplitWrap, {splitComponent: 'hr', wrapComponent: 'Slide'}]],
  },
);

console.log(String(result));
```

The result of this compilation will then yield (simplified):
```jsx
/*@jsxRuntime automatic @jsxImportSource react*/
function _createMdxContent(props) {
  const _components = Object.assign({
    h1: "h1",
    p: "p",
    hr: "hr",
    ul: "ul",
    li: "li"
  }, props.components);
  return (
    <>
      <Slide>
        <_components.h1>{"Split 1"}</_components.h1>
        <_components.p>{"content"}</_components.p>
      </Slide>
      <Slide>
        <_components.h1>{"Split 2"}</_components.h1>
        <_components.ul>
          <_components.li>{"a"}</_components.li>
          <_components.li>{"b"}</_components.li>
          <_components.li>{"c"}</_components.li>
        </_components.ul>
      </Slide>
    </>
  );
}

function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
}

export default MDXContent;
```

## API
This package has a single default export which is the rehype plugin.  
The plugin takes the following options:

<details>
  <summary><code>splitComponent: string</code></summary>
  Name of the component to split the document.
</details>

<details>
  <summary><code>wrapComponent: string</code></summary>
  Name of the component to wrap the splits.
</details>

<details>
  <summary><code>importPath?: string = undefined</code></summary>
  Path to import the wrapComponent from. If not specified, we assume it is not neccesary to import (eg. HTML Tag or Provider Component).
</details>

<details>
  <summary><code>importName?: string = wrapComponent</code></summary>
  Import name of the wrapComponent, if not a default import.
</details>

<details>
  <summary><code>defaultImport?: boolean = false</code></summary>
  Whether the wrapComponent is a default import.
</details>
