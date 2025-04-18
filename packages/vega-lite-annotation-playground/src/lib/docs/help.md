# VL-Annotations Help

## Overview
VL-Annotations is a tool for creating and managing annotations in Vega-Lite visualizations. This tool allows you to:
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
The annotation format follows the Vega-Lite specification with additional annotation properties:

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

## Features

### Real-time Preview
- Changes in the annotation editor are immediately reflected in the visualization
- Use the "Visualize" button to update the preview

### Export Options
- Click "Go to Vega-Lite Editor" to open in the official Vega-Lite editor
- Click "Go to Vega Editor" to open in the Vega editor

### Examples
The tool includes several example annotations to help you get started:
- Basic text annotations
- Multiple annotations
- Custom styling

## Tips
- Use the Examples button to load different annotation templates
- Check the error container for validation messages
- Use the Vega Editor for advanced customization

## Need More Help?
For more information, visit:
- [Vega-Lite Documentation](https://vega.github.io/vega-lite/docs/)
- [Vega Documentation](https://vega.github.io/vega/docs/) 