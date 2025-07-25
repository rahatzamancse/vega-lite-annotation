## Overview
VL-Annotations is a tool for adding annotations to Vega-Lite visualizations. This tool allows you to:
- Create annotations using a simple JSON format
- Convert Vega-Lite annotations to Vega specifications
- Visualize your annotations in real-time
- Export to Vega Editor for further customization

## Getting Started

### Basic Usage
1. Select an example from the dropdown menu
2. Modify the annotation specification in the Vega-Lite Annotation Editor
3. Click "Run" to see the changes
4. Use the arrow button (→) to convert to Vega specification

### Annotation Format
The annotation format follows the Vega-Lite specification with additional annotation properties. See the examples for understanding the annotation format better.

```json
{
  "mark": "text",
  "encoding": {
    "text": {"value": "Your annotation text"},
    "x": {"value": 100},
    "y": {"value": 100}
  }
}
```

For more information on how to use Vega-Lite, visit the [Vega-Lite Documentation](https://vega.github.io/vega-lite/docs/).