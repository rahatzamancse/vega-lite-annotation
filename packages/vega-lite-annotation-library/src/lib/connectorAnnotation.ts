import { ConnectorData, EnclosureData, TextData, VLANormalizedSpec } from "./vlAnnotationTypes";
import { ConnectorAnnotation, FixedPosition, RootAnnotation, Anchor2D, CurveObject, ArrowStyle } from "./spec";
import { VLATopLevel } from "./vlAnnotationTypes";
import * as vega from 'vega';
import { getMarkBoundingBoxFromInternalData } from "./extract-sceneGraph";
import { getScaleNames, calculateAnchorPosition } from "./utils";
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

function createCurvedPath(
    fromX: number, 
    fromY: number, 
    toX: number, 
    toY: number, 
    curve?: string | CurveObject, 
    curveDirection: 'clockwise' | 'counterclockwise' | 'auto' = 'auto', 
    curveTension: number = 0.5
): string {
    // Extract curve type and specific parameters
    let curveType: string | undefined;
    let curveParams: Record<string, any> = {};
    
    if (typeof curve === 'string') {
        curveType = curve;
    } else if (curve && typeof curve === 'object') {
        curveType = curve.type;
        
        // Check for common properties
        if ('direction' in curve) {
            curveDirection = curve.direction || 'auto';
        }
        
        if ('tension' in curve) {
            curveTension = curve.tension !== undefined ? curve.tension : 0.5;
        }
        
        // Store specific curve parameters based on the curve type
        if (curveType === 'cardinal' && 'tension' in curve) {
            curveParams.tension = curve.tension;
        } else if (curveType === 'catmull-rom' && 'alpha' in curve) {
            curveParams.alpha = curve.alpha;
        } else if (curveType === 'step' && 'align' in curve) {
            curveParams.align = curve.align;
        }
    }
    
    // Get the appropriate curve function
    let curveFunction;
    if (curveType && curveType in curveTypes) {
        curveFunction = curveTypes[curveType as keyof typeof curveTypes];
        
        // Apply specific parameters to curve functions that support them
        if (curveType === 'cardinal' && 'tension' in curveParams) {
            curveFunction = curveCardinal.tension(curveParams.tension);
        } else if (curveType === 'catmull-rom' && 'alpha' in curveParams) {
            curveFunction = curveCatmullRom.alpha(curveParams.alpha);
        }
    } else {
        curveFunction = curveLinear; // Default
    }
    
    // For most curve types, we need at least 3 points to see the effect
    // Create a control point between the start and end points
    let points: [number, number][] = [];
    
    // Straight path for linear
    if (curveType === 'linear') {
        points = [[fromX, fromY], [toX, toY]];
    }
    // For step curves, two points are sufficient
    else if (curveType?.startsWith('step')) {
        // Handle different step alignments
        if (curveType === 'step' && 'align' in curveParams) {
            if (curveParams.align === 'before') {
                curveFunction = curveStepBefore;
            } else if (curveParams.align === 'after') {
                curveFunction = curveStepAfter;
            }
            // 'center' is the default for curveStep
        }
        points = [[fromX, fromY], [toX, toY]];
    } 
    // For other curves, add a control point for better curve visualization
    else {
        // Calculate a midpoint with some offset to create a nice curve
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        
        // Extract distance and direction
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        // Scale the offset based on curveTension
        const offsetScale = distance * 0.2 * curveTension;
        
        // Calculate perpendicular offsets
        let perpX = -dy / distance * offsetScale;
        let perpY = dx / distance * offsetScale;
        
        // Apply curve direction
        if (curveDirection === 'clockwise' || 
           (curveDirection === 'auto' && (dx * dy > 0))) {
            perpX = -perpX;
            perpY = -perpY;
        }
        
        points = [
            [fromX, fromY],
            [midX + perpX, midY + perpY], // Control point with direction and tension control
            [toX, toY]
        ];
    }
    
    // Create a d3 line generator with the specified curve
    const lineGenerator = line().curve(curveFunction);
    
    // Generate the path
    return lineGenerator(points) || '';
}

function createConnectorMarkFromSpace(connectorAnnotation: ConnectorAnnotation, vega_spec: vega.Spec, start: FixedPosition, end: FixedPosition, rootAnnotation: RootAnnotation, id?: string): { connectorMark: vega.PathMark, arrowMarks: vega.SymbolMark[] } {
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
    
    // Extract curve direction and tension from global settings (will be overridden by curve object if present)
    let curveDirection = connectorAnnotation.curveDirection || 'auto';
    let curveTension = connectorAnnotation.curveTension !== undefined ? connectorAnnotation.curveTension : 0.5;
    
    const pathData = createCurvedPath(
        offsetX, 
        offsetY, 
        offsetX2, 
        offsetY2, 
        connectorAnnotation.curve,
        curveDirection,
        curveTension
    );
    
    const connectorMark: vega.PathMark = {
        name: id || connectorAnnotation.id,
        type: 'path',
        encode: {
            update: {
                path: { value: pathData }
            }
        }
    };
    
    // Create arrow marks if requested
    const arrowMarks: vega.SymbolMark[] = [];
    
    // Calculate the angle for arrows based on the start and end points
    const startAngle = calculateAngle(offsetX, offsetY, offsetX2, offsetY2);
    const endAngle = calculateAngle(offsetX2, offsetY2, offsetX, offsetY) + 180; // Add 180 degrees to reverse direction
    
    // Add start arrow if requested
    if (connectorAnnotation.startArrow) {
        const startArrowMark = createArrowMark(
            offsetX, 
            offsetY, 
            startAngle, 
            `${id || connectorAnnotation.id}_startArrow`,
            connectorAnnotation.startArrowStyle
        );
        arrowMarks.push(startArrowMark);
    }
    
    // Add end arrow if requested
    if (connectorAnnotation.endArrow) {
        const endArrowMark = createArrowMark(
            offsetX2, 
            offsetY2, 
            endAngle, 
            `${id || connectorAnnotation.id}_endArrow`,
            connectorAnnotation.endArrowStyle
        );
        arrowMarks.push(endArrowMark);
    }
    
    return { connectorMark, arrowMarks };
}

// Calculate angle between two points in degrees
function calculateAngle(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
}

// Create arrow symbol mark
function createArrowMark(x: number, y: number, angle: number, id: string, style?: ArrowStyle): vega.SymbolMark {
    const defaultStyle: ArrowStyle = {
        fill: "black",
        size: 150,
        shape: "triangle-right",
        rotationAdjust: 0,
        opacity: 1,
        stroke: undefined,
        strokeWidth: 1
    };
    
    // Merge default with provided style
    const arrowStyle = { ...defaultStyle, ...style };
    
    // Apply rotation adjustment
    const finalAngle = angle + (arrowStyle.rotationAdjust || 0);
    
    return {
        type: "symbol",
        name: id,
        encode: {
            enter: {
                x: { value: x },
                y: { value: y },
                shape: { value: arrowStyle.shape || "triangle-right" },
                size: { value: arrowStyle.size || 150 },
                fill: { value: arrowStyle.fill || "black" },
                angle: { value: finalAngle },
                opacity: { value: arrowStyle.opacity || 1 },
                stroke: arrowStyle.stroke ? { value: arrowStyle.stroke } : undefined,
                strokeWidth: arrowStyle.strokeWidth ? { value: arrowStyle.strokeWidth } : undefined
            }
        }
    };
}

export async function addConnectorAnnotation_unit(annotation: RootAnnotation, vega_spec: vega.Spec, vlna_spec: VLATopLevel<VLANormalizedSpec>, enclosureData: EnclosureData | null, textData: TextData | TextData[] | null): Promise<ConnectorData | ConnectorData[] | null> {
    // Connectors are mostly used for ensemble, then it will connect in precedence of
    // "enclosure-connect_to" > "text-connect_to" > "target-connect_to" > "enclosure-text" > "target-text" > "target-enclosure" > error.
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
        if (connectorAnnotation.connect_to.target.type === 'pixel-space') {
            x2 = [connectorAnnotation.connect_to.target.x];
            y2 = [connectorAnnotation.connect_to.target.y];
        }
        else if (connectorAnnotation.connect_to.target.type === 'data-space') {
            const view = new vega.View(vega.parse(vega_spec)).initialize().run();
            const { xScaleName, yScaleName } = getScaleNames(vega_spec);
            x2 = [view.scale(xScaleName)(connectorAnnotation.connect_to.target.x)];
            y2 = [view.scale(yScaleName)(connectorAnnotation.connect_to.target.y)];
        }
        else if (connectorAnnotation.connect_to.target.type === 'data-index' || connectorAnnotation.connect_to.target.type === 'data-expr') {
            const markData = await getMarkBoundingBoxFromInternalData(vega_spec, connectorAnnotation.connect_to.target);
            x2 = [];
            y2 = [];
            
            // Extract positions from mark data
            markData.forEach(d => {
                const {x, y} = calculateAnchorPosition(connectorAnnotation.connect_to?.position as Anchor2D || 'middleMiddle', d.bounds as {x1: number, y1: number, x2: number, y2: number});
                x2.push(x)
                y2.push(y)
            });
        }
    }
    else {
        if (textData) {
            // x2 and y2 be the textData positions
            if (Array.isArray(textData)) {
                x2 = textData.map(t => t.x);
                y2 = textData.map(t => t.y);
            }
            else {
                x2 = [textData.x];
                y2 = [textData.y];
            }
        }
    }
    
    // populate x and y
    if (connectorAnnotation.connect_to) {
        if (textData) {
            if (Array.isArray(textData)) {
                x = textData.map(t => t.x);
                y = textData.map(t => t.y);
            }
            else {
                x = [textData.x];
                y = [textData.y];
            }
        }
        else if (enclosureData) {
            x = [(enclosureData.x + enclosureData.x2) / 2];
            y = [(enclosureData.y + enclosureData.y2) / 2];
        }
        else {
            // use target directly
            if (annotation.target?.type === 'pixel-space') {
                x = [annotation.target.x];
                y = [annotation.target.y];
            }
            else if (annotation.target?.type === 'data-space') {
                const view = new vega.View(vega.parse(vega_spec)).initialize().run();
                const { xScaleName, yScaleName } = getScaleNames(vega_spec);
                x = [view.scale(xScaleName)(annotation.target.x)];
                y = [view.scale(yScaleName)(annotation.target.y)];
            }
            else if (annotation.target?.type === 'data-index' || annotation.target?.type === 'data-expr') {
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
        if (textData && enclosureData) {
            x = [(enclosureData.x + enclosureData.x2) / 2];
            y = [(enclosureData.y + enclosureData.y2) / 2];
        }
        else if (textData) {
            if (annotation.target?.type === 'pixel-space') {
                x = [annotation.target.x];
                y = [annotation.target.y];
            }
            else if (annotation.target?.type === 'data-space') {
                const view = new vega.View(vega.parse(vega_spec)).initialize().run();
                const { xScaleName, yScaleName } = getScaleNames(vega_spec);
                x = [view.scale(xScaleName)(annotation.target.x)];
                y = [view.scale(yScaleName)(annotation.target.y)];
            }
            else if (annotation.target?.type === 'data-index' || annotation.target?.type === 'data-expr') {
                const markData = await getMarkBoundingBoxFromInternalData(vega_spec, annotation.target);
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
    if (x.length === 0 || y.length === 0 || x2.length === 0 || y2.length === 0) {
        return null;
    }

    // create connector marks
    const connectorMarks: vega.PathMark[] = [];
    const arrowMarks: vega.SymbolMark[] = [];
    
    for (let i = 0; i < x.length; i++) {
        for (let j = 0; j < x2.length; j++) {
            try {
                const { connectorMark, arrowMarks: newArrowMarks } = createConnectorMarkFromSpace(
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
                arrowMarks.push(...newArrowMarks);
            } catch (error) {
                console.error("Error creating connector mark:", error);
            }
        }
    }
    
    // Add all marks to the vega spec
    vega_spec.marks?.push(...connectorMarks);
    vega_spec.marks?.push(...arrowMarks);
    
    return createConnectorData(connectorMarks);
}