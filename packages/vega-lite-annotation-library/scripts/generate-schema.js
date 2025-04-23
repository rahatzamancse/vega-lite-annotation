#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the dist directory exists
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

try {
  console.log('Generating schema...');
  
  // Run typescript-json-schema with all our options
  execSync(
    'npx typescript-json-schema ' +
    '--required ' +         // Make properties required unless marked optional
    '--noExtraProps ' +     // Disallow additional properties not defined in the type
    '--propOrder ' +        // Sort properties
    '--strictNullChecks ' + // Honor strictNullChecks from the tsconfig
    '--defaultProps ' +     // Include default values for properties
    '--id "https://vega.github.io/schema/vega-lite-annotation/v1.json" ' + // Schema ID
    '--out dist/vega-lite-annotation-schema.json ' +  // Output file
    '--tsconfig "tsconfig.schema.json" ' +  // Custom TS config
    '"src/lib/vlAnnotationTypes.ts" "VLATopLevelSpec"',  // Use our simplified type file
    { stdio: 'inherit' }
  );
  
  console.log('Schema generated successfully: dist/vega-lite-annotation-schema.json');
} catch (error) {
  console.error('Error generating schema:', error.message);
  process.exit(1);
} 