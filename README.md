# Vega-Lite Annotation

[![Netlify Status](https://api.netlify.com/api/v1/badges/8053c01e-963f-46e1-9063-9bc336c62a84/deploy-status)](https://app.netlify.com/sites/vl-annotation/deploys)

## Overview

Vega-Lite Annotation is a library and playground for adding custom annotations to Vega-Lite visualizations. This project extends the capabilities of Vega-Lite by providing a simple, declarative way to add various types of annotations to your charts.

## Features

- Extend Vega-Lite specifications with custom annotations
- Convert annotated Vega-Lite specs to standard Vega specifications
- Interactive playground for testing and experimenting with annotations
- Support for various annotation types and positioning strategies

## Project Structure

This is a monorepo containing:

- **vega-lite-annotation-library**: The core library that provides the annotation functionality
- **vega-lite-annotation-playground**: An interactive web application for experimenting with annotations

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/rahatzamancse/vega-lite-annotation.git
cd vega-lite-annotation

# Install dependencies
pnpm install
```

### Development

```bash
# Start the playground development server
pnpm --filter vega-lite-annotation-playground dev

# Build the library
pnpm --filter vega-lite-annotation-library build
```

### Usage

> **Note:** This project will soon be submitted to npm. Once published, you'll be able to install it directly from the npm registry.

To use the library in your own project:

```bash
npm install vega-lite-annotation-library
```

```javascript
import { vlaToV } from 'vega-lite-annotation-library';

// Your Vega-Lite spec with annotations
const annotatedSpec = {
  // ...your Vega-Lite spec
  annotations: [
    // Your annotations
  ]
};

// Convert to standard Vega spec
const vegaSpec = vlaToV(annotatedSpec);
```

## Playground

The playground provides an interactive environment to experiment with Vega-Lite annotations. You can:

- Create and edit Vega-Lite specifications with annotations
- See the resulting visualization in real-time
- Export your work for use in other applications

Visit the [playground](https://vl-annotation.netlify.app) to try it out.

## Documentation

> **Note:** Documentation is not yet available. When documentation is available, it will be linked here.

~~For detailed documentation on the annotation types and options, refer to the [documentation](https://vl-annotation.netlify.app/docs).~~

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- [Vega](https://vega.github.io/vega/)
- [Vega-Lite](https://vega.github.io/vega-lite/)
