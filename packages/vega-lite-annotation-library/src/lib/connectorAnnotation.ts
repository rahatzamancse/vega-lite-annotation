import { ConnectorData, EnclosureData, TextData, VLANormalizedSpec } from "./vlAnnotationTypes";

import { ConnectorAnnotation, FixedPosition, RootAnnotation } from "./spec";
import { VLATopLevel } from "./vlAnnotationTypes";
import * as vega from 'vega';
import { getMarkBoundingBoxFromInternalData } from "./extract-sceneGraph";
import { getScaleNames } from "./utils";
import { 
    line, 
    curveBasis, 
    curveCardinal, 
    curveCatmullRom, 
    curveLinear, 
    curveMonotoneX, 
    curveNatural, 
    curveStep,
    curveStepAfter,
    curveStepBefore
} from "d3-shape";

// Map of curve types to d3 curve functions
const curveTypes = {
    'linear': curveLinear,
    'basis': curveBasis,
    'cardinal': curveCardinal,
    'catmull-rom': curveCatmullRom,
    'monotone': curveMonotoneX,
    'natural': curveNatural,
    'step': curveStep,
    'step-after': curveStepAfter,
    'step-before': curveStepBefore
};

function applyConnectorStyleProperties(connectorMark: vega.PathMark, connector: ConnectorAnnotation) {
    if (!connectorMark.encode) connectorMark.encode = { update: {} };
    if (!connectorMark.encode.update) connectorMark.encode.update = {};

    connectorMark.encode.update.opacity = { value: connector.style?.opacity || 1 };
    connectorMark.encode.update.stroke = { value: connector.style?.stroke || 'black' };
    connectorMark.encode.update.strokeWidth = { value: connector.style?.strokeWidth || 1 };
    connectorMark.encode.update.strokeDash = { value: connector.style?.strokeDash || [10, 5] };
    connectorMark.encode.update.strokeDashOffset = { value: connector.style?.strokeDashOffset || 0 };
    connectorMark.encode.update.strokeJoin = { value: connector.style?.strokeJoin || 'round' };
    connectorMark.encode.update.strokeMiterLimit = { value: connector.style?.strokeMiterLimit || 10 };
    connectorMark.encode.update.fill = { value: null }; // Ensure path has no fill
    // connectorMark.encode.update.blend = { value: connector.style?.blend || 'normal' };
    connectorMark.encode.update.cursor = { value: connector.style?.cursor || 'default' };
    connectorMark.encode.update.tooltip = { value: connector.style?.tooltip || null };
    connectorMark.encode.update.zIndex = { value: connector.style?.zIndex || 0 };
    connectorMark.encode.update.strokeCap = { value: connector.style?.strokeCap || 'round' };
}

function applyConnectorOffset(fromX: number, fromY: number, toX: number, toY: number, dx?: number, dy?: number, dx2?: number, dy2?: number) {
    return {
        x: fromX + (dx || 0),
        y: fromY + (dy || 0),
        x2: toX + (dx2 || 0),
        y2: toY + (dy2 || 0)
    }
}

function createConnectorData(connectorMark: vega.PathMark | vega.PathMark[]): ConnectorData | ConnectorData[] {
    if (Array.isArray(connectorMark)) {
        return connectorMark.map(t => (createConnectorData(t) as ConnectorData));
    }
    const update = connectorMark.encode?.update;
    if (!update) throw new Error("Connector mark encode update is undefined");
    if (!update.path) throw new Error("Connector mark path is undefined");

    if (!('value' in update.path)) throw new Error("Connector mark path value is undefined");

    try {
        // Extract x, y, x2, y2 from the path data using d3-path conventions
        // For a basic line path created with d3-path, we can parse it to extract coordinates
        const pathString = update.path.value as string;
        const moveToMatch = pathString.match(/M\s*([\d.]+)\s*,?\s*([\d.]+)/);
        const lineToMatch = pathString.match(/L\s*([\d.]+)\s*,?\s*([\d.]+)/);
        
        if (!moveToMatch || !lineToMatch) throw new Error("Invalid path data format");
        
        return {
            id: connectorMark.name!,
            x: parseFloat(moveToMatch[1] || '0') || 0,
            y: parseFloat(moveToMatch[2] || '0') || 0,
            x2: parseFloat(lineToMatch[1] || '0') || 0,
            y2: parseFloat(lineToMatch[2] || '0') || 0,
        };
    } catch (error) {
        console.error("Error parsing path data:", error);
        return {
            id: connectorMark.name!,
            x: 0,
            y: 0,
            x2: 0,
            y2: 0,
        };
    }
}

function createCurvedPath(fromX: number, fromY: number, toX: number, toY: number, curveType?: string): string {
    // Default to linear if no curve type is specified
    const curveFunction = curveType && curveType in curveTypes 
        ? curveTypes[curveType as keyof typeof curveTypes]
        : curveLinear;
    
    // For most curve types, we need at least 3 points to see the effect
    // Create a control point between the start and end points
    let points: [number, number][] = [];
    
    // Straight path for linear
    if (curveType === 'linear') {
        points = [[fromX, fromY], [toX, toY]];
    }
    // For step curves, two points are sufficient
    else if (curveType?.startsWith('step')) {
        points = [[fromX, fromY], [toX, toY]];
    } 
    // For other curves, add a control point for better curve visualization
    else {
        // Calculate a midpoint with some offset to create a nice curve
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        
        // Add some variation to the midpoint based on the distance
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        // Create a perpendicular offset for the control point
        const perpX = -dy / distance * distance * 0.2;
        const perpY = dx / distance * distance * 0.2;
        
        points = [
            [fromX, fromY],
            [midX + perpX, midY + perpY], // Control point offset from straight line
            [toX, toY]
        ];
    }
    
    // Create a d3 line generator with the specified curve
    const lineGenerator = line().curve(curveFunction);
    
    // Generate the path
    return lineGenerator(points) || '';
}

function createConnectorMarkFromSpace(connectorAnnotation: ConnectorAnnotation, vega_spec: vega.Spec, start: FixedPosition, end: FixedPosition, rootAnnotation: RootAnnotation, id?: string): vega.PathMark {
    // usually:
        // start: connect_to
        // end: target
    if (!start) {
        if (connectorAnnotation.connect_to?.target?.type === 'pixel-space' || connectorAnnotation.connect_to?.target?.type === 'data-space') {
            start = connectorAnnotation.connect_to.target;
        }
    }
    if (!end) {
        if (rootAnnotation.target?.type === 'pixel-space' || rootAnnotation.target?.type === 'data-space') {
            end = rootAnnotation.target;
        }
    }
    
    if (!start || !end) throw new Error("Start and end positions are required");
    
    let x: number = 0;
    let y: number = 0;
    let x2: number = 0;
    let y2: number = 0;

    if (start.type === 'pixel-space') {
        x = start.x;
        y = start.y;
    }
    else if (start.type === 'data-space') {
        const view = new vega.View(vega.parse(vega_spec)).initialize().run();
        const { xScaleName, yScaleName } = getScaleNames(vega_spec);
        x = view.scale(xScaleName)(start.x);
        y = view.scale(yScaleName)(start.y);
    }
    
    if (end.type === 'pixel-space') {
        x2 = end.x;
        y2 = end.y;
    }
    else if (end.type === 'data-space') {
        const view = new vega.View(vega.parse(vega_spec)).initialize().run();
        const { xScaleName, yScaleName } = getScaleNames(vega_spec);
        x2 = view.scale(xScaleName)(end.x);
        y2 = view.scale(yScaleName)(end.y);
    }

    // Create path data for a line from (x,y) to (x2,y2) using d3-shape's curve functions
    const { x: offsetX, y: offsetY, x2: offsetX2, y2: offsetY2 } = applyConnectorOffset(x, y, x2, y2, connectorAnnotation.dx, connectorAnnotation.dy, connectorAnnotation.dx2, connectorAnnotation.dy2);
    const pathData = createCurvedPath(offsetX, offsetY, offsetX2, offsetY2, connectorAnnotation.curve);
    
    const connectorMark: vega.PathMark = {
        name: id || connectorAnnotation.id,
        type: 'path',
        encode: {
            update: {
                path: { value: pathData }
            }
        }
    };
    
    return connectorMark;
}


export async function addConnectorAnnotation_unit(annotation: RootAnnotation, vega_spec: vega.Spec, vlna_spec: VLATopLevel<VLANormalizedSpec>, enclosureData: EnclosureData | null, textData: TextData | TextData[] | null): Promise<ConnectorData | ConnectorData[] | null> {
    // Connectors are mostly used for ensemble, then it will connect in precedence of
    // "enclosure-connect_to" > "text-connect_to" > "target-connect_to" > "enclosure-text" > "target-text" > "target-enclosure" > error.
    console.log("Adding connector annotation");
    if (!vega_spec.marks) vega_spec.marks = [];

    if (!annotation.connector) throw new Error("Connector annotation is required");
    annotation.connector.id = annotation.connector.id || ("AnnotationConnector" + Math.random().toString(36).substring(2, 15));

    const connectorAnnotation = annotation.connector;
    let x: number[] = [];
    let y: number[] = [];
    let x2: number[] = [];
    let y2: number[] = [];
    
    // populate x2/y2
    if (connectorAnnotation.connect_to) {
        console.log("DEBUG: Populating x2/y2 using connectorAnnotation.connect_to");
        if (connectorAnnotation.connect_to.target.type === 'pixel-space') {
            console.log("DEBUG: connect_to is pixel-space");
            x2 = [connectorAnnotation.connect_to.target.x];
            y2 = [connectorAnnotation.connect_to.target.y];
        }
        else if (connectorAnnotation.connect_to.target.type === 'data-space') {
            console.log("DEBUG: connect_to is data-space");
            const view = new vega.View(vega.parse(vega_spec)).initialize().run();
            const { xScaleName, yScaleName } = getScaleNames(vega_spec);
            x2 = [view.scale(xScaleName)(connectorAnnotation.connect_to.target.x)];
            y2 = [view.scale(yScaleName)(connectorAnnotation.connect_to.target.y)];
        }
        else if (connectorAnnotation.connect_to.target.type === 'data-index' || connectorAnnotation.connect_to.target.type === 'data-expr') {
            console.log("DEBUG: connect_to is data-index or data-expr");
            const markData = await getMarkBoundingBoxFromInternalData(vega_spec, connectorAnnotation.connect_to.target);
            x2 = [];
            y2 = [];
            
            // Extract positions from mark data
            markData.forEach(d => {
                x2.push('width' in d ? d.x + d.width/2 : ('x2' in d ? d.x2 as number : d.x))
                y2.push('height' in d ? d.y + d.height/2 : ('y2' in d ? d.y2 as number : d.y))
            });
        }
    }
    else {
        console.log("DEBUG: No connect_to, fallback for x2/y2");
        if (textData) {
            console.log("DEBUG: Using textData for x2/y2");
            // x2 and y2 be the textData positions
            if (Array.isArray(textData)) {
                console.log("DEBUG: textData is array");
                x2 = textData.map(t => t.x);
                y2 = textData.map(t => t.y);
            }
            else {
                console.log("DEBUG: textData is single object");
                x2 = [textData.x];
                y2 = [textData.y];
            }
        }
    }
    
    // populate x and y
    if (connectorAnnotation.connect_to) {
        console.log("DEBUG: Populating x/y with connect_to present");
        if (textData) {
            console.log("DEBUG: Using textData for x/y");
            if (Array.isArray(textData)) {
                console.log("DEBUG: textData is array");
                x = textData.map(t => t.x);
                y = textData.map(t => t.y);
            }
            else {
                console.log("DEBUG: textData is single object");
                x = [textData.x];
                y = [textData.y];
            }
        }
        else if (enclosureData) {
            console.log("DEBUG: Using enclosureData for x/y");
            x = [(enclosureData.x + enclosureData.x2) / 2];
            y = [(enclosureData.y + enclosureData.y2) / 2];
        }
        else {
            console.log("DEBUG: Using target directly for x/y");
            // use target directly
            if (annotation.target?.type === 'pixel-space') {
                console.log("DEBUG: target is pixel-space");
                x = [annotation.target.x];
                y = [annotation.target.y];
            }
            else if (annotation.target?.type === 'data-space') {
                console.log("DEBUG: target is data-space");
                const view = new vega.View(vega.parse(vega_spec)).initialize().run();
                const { xScaleName, yScaleName } = getScaleNames(vega_spec);
                x = [view.scale(xScaleName)(annotation.target.x)];
                y = [view.scale(yScaleName)(annotation.target.y)];
            }
            else if (annotation.target?.type === 'data-index' || annotation.target?.type === 'data-expr') {
                console.log("DEBUG: target is data-index or data-expr");
                const markData = await getMarkBoundingBoxFromInternalData(vega_spec, annotation.target);
                x = [];
                y = [];
                markData.forEach(d => {
                    x.push('width' in d ? d.x + d.width/2 : ('x2' in d ? d.x2 as number : d.x))
                    y.push('height' in d ? d.y + d.height/2 : ('y2' in d ? d.y2 as number : d.y))
                });
            }
        }
    }
    else {
        console.log("DEBUG: No connect_to, fallback for x/y");
        if (textData && enclosureData) {
            console.log("DEBUG: Using both textData and enclosureData for x/y");
            x = [(enclosureData.x + enclosureData.x2) / 2];
            y = [(enclosureData.y + enclosureData.y2) / 2];
        }
        else if (textData) {
            console.log("DEBUG: Using target for x/y");
            if (annotation.target?.type === 'pixel-space') {
                console.log("DEBUG: target is pixel-space");
                x = [annotation.target.x];
                y = [annotation.target.y];
            }
            else if (annotation.target?.type === 'data-space') {
                console.log("DEBUG: target is data-space");
                const view = new vega.View(vega.parse(vega_spec)).initialize().run();
                const { xScaleName, yScaleName } = getScaleNames(vega_spec);
                x = [view.scale(xScaleName)(annotation.target.x)];
                y = [view.scale(yScaleName)(annotation.target.y)];
            }
            else if (annotation.target?.type === 'data-index' || annotation.target?.type === 'data-expr') {
                console.log("DEBUG: target is data-index or data-expr");
                const markData = await getMarkBoundingBoxFromInternalData(vega_spec, annotation.target);
                console.log("markData", markData);
                if (markData.length === 0) throw new Error("Mark data is empty");
                x = [];
                y = [];
                markData.forEach(d => {
                    x.push('width' in d ? d.x + d.width/2 : ('x2' in d ? d.x2 as number : d.x))
                    y.push('height' in d ? d.y + d.height/2 : ('y2' in d ? d.y2 as number : d.y))
                });
            }
        }
    }

    // At this point, x, y, x2, y2 should be defined
    console.log("DEBUG: Final coordinates:", { x, y, x2, y2 });
    if (x.length === 0 || y.length === 0 || x2.length === 0 || y2.length === 0) {
        console.log("DEBUG: Returning null, coordinates arrays are empty");
        return null;
    }

    // create connector marks
    console.log("DEBUG: Creating connector marks");
    const connectorMarks: vega.PathMark[] = [];
    for (let i = 0; i < x.length; i++) {
        for (let j = 0; j < x2.length; j++) {
            try {
                const connectorMark = createConnectorMarkFromSpace(
                    connectorAnnotation,
                    vega_spec,
                    {
                        type: 'pixel-space',
                        x: x[i] || 0,
                        y: y[i] || 0
                    },
                    {
                        type: 'pixel-space',
                        x: x2[j] || 0,
                        y: y2[j] || 0
                    },
                    annotation,
                    connectorAnnotation.id + "_" + i + "_" + j
                );
                applyConnectorStyleProperties(connectorMark, connectorAnnotation);
                connectorMarks.push(connectorMark);
            } catch (error) {
                console.error("Error creating connector mark:", error);
            }
        }
    }
    vega_spec.marks?.push(...connectorMarks);
    console.log("DEBUG: Returning connector data");
    return createConnectorData(connectorMarks);
}