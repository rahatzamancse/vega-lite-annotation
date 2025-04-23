import * as vega from 'vega';

/**
 * Creates a width x height occupancy matrix for a Vega visualization
 * 
 * @param vega_spec The Vega specification to analyze
 * @param width The width of the matrix
 * @param height The height of the matrix
 * @returns A width x height boolean matrix where true indicates space is occupied by a visual element
 */
export async function createOccupancyMatrix(vega_spec: vega.Spec, width: number = 100, height: number = 100): Promise<boolean[][]> {
    // Initialize a width x height matrix with all false values
    const matrix: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));

    // Create a Vega view to render the visualization
    const view = new vega.View(vega.parse(vega_spec))
        .renderer('none') // Use 'none' renderer for performance as we don't need visual output
        .initialize();

    // Wait for the view to finish rendering
    await view.runAsync();

    // Get all rendered items from the scenegraph
    const scene = view.scenegraph();
    const sceneItems = (scene as any).root?.items || [];
    const allItems = sceneItems.length > 0 ? sceneItems[0].items || [] : [];

    // Calculate scaling factors to map visualization coordinates to our width x height matrix
    const scaleX = width / 100;
    const scaleY = height / 100;

    // Process all items in the scenegraph
    processScenegraphItems(allItems, matrix, scaleX, scaleY);

    return matrix;
}

/**
 * Recursively processes scenegraph items and marks occupied spaces in the matrix
 */
function processScenegraphItems(items: any[], matrix: boolean[][], scaleX: number, scaleY: number): void {
    for (const item of items) {
        // Process this item if it has bounds
        if (item.bounds && !item.bounds.empty()) {
            markOccupiedSpace(item, matrix, scaleX, scaleY);
        }

        // Recursively process child items
        if (item.items && item.items.length > 0) {
            processScenegraphItems(item.items, matrix, scaleX, scaleY);
        }
    }
}

/**
 * Marks the space occupied by a scenegraph item in the matrix
 */
function markOccupiedSpace(item: any, matrix: boolean[][], scaleX: number, scaleY: number): void {
    // Get item bounds
    const x1 = Math.floor(item.bounds.x1 * scaleX);
    const y1 = Math.floor(item.bounds.y1 * scaleY);
    const x2 = Math.ceil(item.bounds.x2 * scaleX);
    const y2 = Math.ceil(item.bounds.y2 * scaleY);

    // Ensure coordinates are within matrix bounds
    const startX = Math.max(0, x1);
    const startY = Math.max(0, y1);
    const endX = Math.min(99, x2);
    const endY = Math.min(99, y2);

    // Mark all cells in the item's bounding box as occupied
    for (let y = startY; y <= endY; y++) {
        const row = matrix[y];
        if (row) {
            for (let x = startX; x <= endX; x++) {
                row[x] = true;
            }
        }
    }
}
