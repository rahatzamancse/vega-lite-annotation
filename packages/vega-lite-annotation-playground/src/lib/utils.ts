import type { VLATopLevelSpec } from 'vega-lite-annotation-library';

// Function to load a specific JSON file
export async function loadJsonFile(filename: string): Promise<{ path: string, json: VLATopLevelSpec, name: string, image: string, filename: string }> {
    // Remove .json extension if present
    const filenameWithoutExt = filename.replace(/\.json$/, '');
    
    // Split the path into directory and filename
    const parts = filenameWithoutExt.split('/');
    const dir = parts.slice(0, -1).join('/');
    const baseName = parts[parts.length - 1];
    
    try {
        const jsonPath = dir 
            ? `/sample_inputs/${dir}/${baseName}.json`
            : `/sample_inputs/${baseName}.json`;
        
        console.log('Loading JSON file:', jsonPath);
        
        const response = await fetch(jsonPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        
        return {
            path: jsonPath,
            json,
            name: json.name || baseName,
            image: baseName + '.png',
            filename: baseName
        };
    } catch (e) {
        throw new Error(`Failed to load JSON file: ${filename}`);
    }
}
