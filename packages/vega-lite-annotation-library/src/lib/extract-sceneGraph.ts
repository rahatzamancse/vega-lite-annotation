import { DataPointMarker } from "./spec";
import { vlaToV } from "./vlAnnotation";
import { VLANonNormalizedSpec, VLATopLevelSpec } from "./vlAnnotationTypes";
import * as vega from 'vega';


export async function vegaSpecToSceneGraph(spec: vega.Spec): Promise<vega.Scene> {
    // Convert Vega spec to SceneGraph
    const runtime = vega.parse(spec)
    const view = new vega.View(runtime).initialize().run();
    
    const sceneGraph = view.scenegraph();
    
    return sceneGraph
}

export function getMarkBoundingBoxFromVegaSpec(spec: vega.Spec, target: DataPointMarker) {
    // Convert Vega spec to SceneGraph
    const runtime = vega.parse(spec);
    const view = new vega.View(runtime).initialize().run();
    
    const sceneGraph = view.scenegraph();
    
    // Get the marker bounding box from the scene graph
    let boundingBox;
    
    if (target.type === 'data-expr') {
        // Handle data expression target
        const items = view.data(target.expr);
        if (items && items.length > 0) {
            // Find the corresponding mark items in the scene graph
            if ('root' in sceneGraph) {
                const markItems = (sceneGraph.root as vega.Scene).items[0]?.items.find(item => 
                    item.marktype && item.items.some(i => 
                        items.some(dataItem => i.datum === dataItem)
                    )
                );
                
                if (markItems) {
                    // Calculate bounding box from matching items
                    boundingBox = markItems.bounds;
                }
            }
        }
    } else if (target.type === 'data-index') {
        // Handle data index target
        const indices = 'indices' in target ? target.indices : [target.index];
        
        // Find the mark items at the specified indices
        if ('root' in sceneGraph) {
            const markGroup = (sceneGraph.root as vega.Scene).items[0]?.items.find(item => item.marktype);
            
        if (markGroup) {
            const targetItems = indices.map(idx => markGroup.items[idx]).filter(Boolean);
            
            if (targetItems.length > 0) {
                    // Calculate bounding box from the target items
                    boundingBox = targetItems[0]?.bounds.clone();
                    for (let i = 1; i < targetItems.length; i++) {
                        if (targetItems[i]?.bounds) {
                            boundingBox?.union(targetItems[i]?.bounds!);
                        }
                    }
                }
            }
        }
    }
    
    return boundingBox;
}

export type MarkData = {
    datum?: any,
    exit?: boolean,
    mark: any,
    bounds: any,
    fill?: string,
    ariaRoleDescription?: string,
    description?: string,
    x: number,
    y: number,
    dirty: number,
    tooltip?: any,
    stroke?: string,
    strokeWidth?: number,
    _svg?: any,
    opacity?: number,
}

export type AreaMarkData = MarkData & {
    orient: string, 
    defined: boolean,
    height: number,
    y2?: number,
    items?: any[],
    context?: any,
}

export type PointMarkData = MarkData & {
    size: number,
    strokeWidth: number,
    shape: string,
}

export type LineMarkData = MarkData & {
    defined: boolean,
}

export type RectMarkData = MarkData & {
    width: number,
    height: number,
    x2?: number,
    y2?: number,
    cornerRadius?: number,
    cornerRadiusTopRight?: number,
    cornerRadiusBottomRight?: number,
    cornerRadiusBottomLeft?: number,
    cornerRadiusTopLeft?: number,
}

export type TextMarkData = MarkData & {
    context?: any,
    items?: any[],
}

export async function getMarkBoundingBoxFromInternalData(spec: vega.Spec, target: DataPointMarker): Promise<(MarkData | PointMarkData | LineMarkData | RectMarkData | TextMarkData | AreaMarkData)[]> {
    // Get the internal data
    const view = new vega.View(vega.parse(spec)).initialize();
    await view.runAsync()
    
    // Find the first dataset that contains the visualization data
    let dataset;
    let marksData;
    
    // Get all dataset names
    // @ts-ignore - accessing internal Vega View property
    const datasetNames = view._runtime.data ? Object.keys(view._runtime.data) : [];
    
    if (datasetNames.includes("marks")) {
        // @ts-ignore - accessing internal Vega View property
        marksData = view.data("marks");
    }
    else {
        // Loop through all datasets to find one with the right structure
        let maxRows = 0;
        for (const name of datasetNames) {
            const data = view.data(name);
            if (data && data.length > 0 && 
                data[0] && 
                (data[0].datum !== undefined || 
                    data[0].mark !== undefined || 
                    data[0].bounds !== undefined)) {
                    if (data.length > maxRows) {
                        maxRows = data.length;
                        marksData = data;
                    }
            }
        }
    }
    
    
    if (!marksData) {
        throw new Error("No marks data found");
    }
    
    if (!dataset) {
        dataset = view.data(spec.data?.[0]?.name || "source");
    }
    
    let datum;
    // Handle different types of data point markers
    if (target.type === 'data-expr') {
        // Create a function to evaluate the expression
        const expr = target.expr;
        const fn = Function('dataset', `
            const result = [];
            for (const datum of dataset) {
                if (${expr}) {
                    result.push(datum);
                }
            }
            return result;
        `);
        
        // Filter the data based on the expression
        try {
            datum = fn(dataset)
        }
        catch (e) {
            console.error('Error evaluating expression:', e);
            return [];
        }
    } else if (target.type === 'data-index') {
        // Handle single index or multiple indices
        if ('index' in target) {
            // Return the datum at the specified index if it exists
            if (target.index >= 0 && target.index < dataset.length) {
                datum = [dataset[target.index]];
            }
        } else if ('indices' in target && Array.isArray(target.indices)) {
            // Return data for multiple indices
            datum = target.indices
                .filter(index => index >= 0 && index < dataset.length)
                .map(index => dataset[index]);
        }
    }
    
    // If we have found the datum from the dataset, find the corresponding mark data
    if (datum && datum.length > 0) {
        // Create a function to match marks with the found data
        const matchingMarks = [];
        
        for (const d of datum) {
            // Find marks that correspond to this datum
            // We need to match based on data values since the internal representation
            // might not have direct references
            const matchedMarks = marksData.filter(mark => {
                // Compare key properties to determine if this mark represents our datum
                // This is a simplified approach - in a real implementation, you might need
                // more sophisticated matching based on your data structure
                
                // Check if all keys in d match with mark.datum
                for (const key in d) {
                    if (mark.datum[key] === undefined || mark.datum[key] !== d[key]) {
                        return false;
                    }
                }
                return true;
            });
            
            matchingMarks.push(...matchedMarks);
        }
        
        return matchingMarks;
    }
    else {
        return [];
    }
}
