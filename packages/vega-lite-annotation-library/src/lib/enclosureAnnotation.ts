import type { RootAnnotation, EnclosureAnnotation, DataPointMarker, FixedPosition, Rect, Markers, LineStyle } from './spec'
import * as vega from 'vega'
import type { VLATopLevel, VLANormalizedSpec } from './vlAnnotationTypes'
import { getMarkBoundingBoxFromInternalData, RectMarkData } from './extract-sceneGraph'
import type { EnclosureData } from './vlAnnotationTypes';
import { Mark } from 'vega';
import { getScaleNames } from './utils';

// Helper interfaces for better type safety
type Padding = {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
} | number;

// Helper function to calculate padding values
function calculatePadding(padding: Padding | undefined, side?: 'left' | 'right' | 'top' | 'bottom'): number {
    if (typeof padding === 'number') {
        return side ? padding : padding * 2;
    }
    
    if (!padding) return 0;

    if (side && padding) {
        return padding[side] || 0;
    }
    
    return ((padding.left || 0) + (padding.right || 0));
}

// Helper function to apply style properties to mark
function applyRectStyleProperties(enclosureMark: vega.RectMark, enclosureAnnotation: EnclosureAnnotation): vega.RectMark {
    if (!enclosureMark.encode) enclosureMark.encode = { update: {} };
    if (!enclosureMark.encode.update) enclosureMark.encode.update = {};
    
    const update = enclosureMark.encode.update;
    
    update.opacity = { value: enclosureAnnotation.style?.opacity || 0.8 };
    update.fill = { value: enclosureAnnotation.style?.fill || 'lightblue' };
    update.fillOpacity = { value: enclosureAnnotation.style?.fillOpacity || 0.8 };
    update.stroke = { value: enclosureAnnotation.style?.stroke?.stroke || 'blue' };
    update.strokeWidth = { value: enclosureAnnotation.style?.stroke?.strokeWidth || 1 };
    update.strokeCap = { value: enclosureAnnotation.style?.stroke?.strokeCap || 'butt' };
    update.strokeDash = { value: enclosureAnnotation.style?.stroke?.strokeDash || [] };
    update.strokeDashOffset = { value: enclosureAnnotation.style?.stroke?.strokeDashOffset || 0 };
    update.strokeJoin = { value: enclosureAnnotation.style?.stroke?.strokeJoin || 'miter' };
    update.strokeMiterLimit = { value: enclosureAnnotation.style?.stroke?.strokeMiterLimit || 10 };
    update.blend = { value: enclosureAnnotation.style?.stroke?.blend || 'normal' as vega.Blend };
    update.cursor = { value: enclosureAnnotation.style?.stroke?.cursor || 'default' };
    update.tooltip = { value: enclosureAnnotation.style?.stroke?.tooltip || '' };
    update.zIndex = { value: enclosureAnnotation.style?.stroke?.zIndex || 0 };
    update.href = { value: enclosureAnnotation.style?.href || '' };
    
    if (typeof enclosureAnnotation.shape?.cornerRadius === 'object') {
        enclosureMark.encode.update.cornerRadiusTopLeft = { value: enclosureAnnotation.shape?.cornerRadius.topLeft || 0 };
        enclosureMark.encode.update.cornerRadiusTopRight = { value: enclosureAnnotation.shape?.cornerRadius.topRight || 0 };
        enclosureMark.encode.update.cornerRadiusBottomLeft = { value: enclosureAnnotation.shape?.cornerRadius.bottomLeft || 0 };
        enclosureMark.encode.update.cornerRadiusBottomRight = { value: enclosureAnnotation.shape?.cornerRadius.bottomRight || 0 };
    } else {
        enclosureMark.encode.update.cornerRadius = { value: enclosureAnnotation.shape?.cornerRadius || 0 };
    }
    
    return enclosureMark;
}

// Helper function to apply rectangle shape properties
function applyRectOffsetAndPadding(enclosureMark: vega.RectMark, enclosureAnnotation: EnclosureAnnotation): vega.RectMark {
    if (!enclosureMark.encode) enclosureMark.encode = { update: {} };
    if (!enclosureMark.encode.update) enclosureMark.encode.update = {};

    if (enclosureMark.encode.update.x && 'value' in enclosureMark.encode.update.x) {
        enclosureMark.encode.update.x.value = (enclosureMark.encode.update.x.value as number) + 
            (enclosureAnnotation.dx || 0) -
            calculatePadding(enclosureAnnotation.padding, "left")
    }
    if (enclosureMark.encode.update.y && 'value' in enclosureMark.encode.update.y) {
        enclosureMark.encode.update.y.value = (enclosureMark.encode.update.y.value as number) + 
            (enclosureAnnotation.dy || 0) -
            calculatePadding(enclosureAnnotation.padding, "top")
    }
    
    if (enclosureMark.encode.update.x2 && 'value' in enclosureMark.encode.update.x2) {
        enclosureMark.encode.update.x2.value = (enclosureMark.encode.update.x2.value as number) + 
            calculatePadding(enclosureAnnotation.padding, "left") + 
            calculatePadding(enclosureAnnotation.padding, "right") + 
            (enclosureAnnotation.dx || 0)
    }

    if (enclosureMark.encode.update.y2 && 'value' in enclosureMark.encode.update.y2) {
        enclosureMark.encode.update.y2.value = (enclosureMark.encode.update.y2.value as number) + 
            calculatePadding(enclosureAnnotation.padding, "top") + 
            calculatePadding(enclosureAnnotation.padding, "bottom") + 
            (enclosureAnnotation.dy || 0)
    }

    if (enclosureMark.encode.update.width && 'value' in enclosureMark.encode.update.width) {
        enclosureMark.encode.update.width.value = (enclosureMark.encode.update.width.value as number) + 
            calculatePadding(enclosureAnnotation.padding, "left") + 
            calculatePadding(enclosureAnnotation.padding, "right")
    }
    
    if (enclosureMark.encode.update.height && 'value' in enclosureMark.encode.update.height) {
        enclosureMark.encode.update.height.value = (enclosureMark.encode.update.height.value as number) + 
            calculatePadding(enclosureAnnotation.padding, "top") + 
            calculatePadding(enclosureAnnotation.padding, "bottom")
    }
    
    return enclosureMark;
}

// Helper function to create the enclosure data return object
function createEnclosureData(enclosureMark: vega.RectMark): EnclosureData {
    const update = enclosureMark.encode?.update;
    if (!update || !update.x || !update.y || !('value' in update.x) || !('value' in update.y)) throw new Error("Enclosure mark encode update is undefined");
    
    // Handle both x/y/width/height and x/y/x2/y2 formats
    if (update.x2 && update.y2 && 'value' in update.x2 && 'value' in update.y2) {
        return {
            id: enclosureMark.name!,
            x: update.x.value as number,
            y: update.y.value as number,
            x2: update.x2.value as number,
            y2: update.y2.value as number,
        };
    }
    
    if (!(update.width && update.height && 'value' in update.width && 'value' in update.height)) throw new Error("Enclosure mark encode update is undefined");
    
    return {
        id: enclosureMark.name!,
        x: update.x.value as number,
        y: update.y.value as number,
        x2: (update.x.value as number) + (update.width?.value as number),
        y2: (update.y.value as number) + (update.height?.value as number),
    };
}

function createRectMarkFromSpace(enclosureAnnotation: EnclosureAnnotation, vega_spec: vega.Spec, position?: FixedPosition): vega.RectMark {
    if (!position) position = enclosureAnnotation.position;
    if (!position) throw new Error("Position is required in either enclosureAnnotation or as a parameter");

    if (position.type === 'pixel-space') {
        const enclosureMark = {
            name: enclosureAnnotation.id,
            type: 'rect',
            encode: {
                update: {
                    x: { value: position.x},
                    y: { value: position.y},
                    width: { value: enclosureAnnotation.shape?.width || 10 },
                    height: { value: enclosureAnnotation.shape?.height || 10 }
                }
            }
        };
        return enclosureMark as vega.RectMark;
    }
    else if (position.type === 'data-space') {
        const view = new vega.View(vega.parse(vega_spec)).initialize().run();

        const { xScaleName, yScaleName } = getScaleNames(vega_spec);
        const x = view.scale(xScaleName)(position.x);
        const y = view.scale(yScaleName)(position.y);

        const enclosureMark: vega.RectMark = {
            name: enclosureAnnotation.id,
            type: 'rect',
            encode: {
                update: {
                    x: { value: x },
                    y: { value: y },
                    width: { value: enclosureAnnotation.shape?.width || 10 },
                    height: { value: enclosureAnnotation.shape?.height || 10 }
                }
            }
        };
        
        return enclosureMark;
    }
    else {
        throw new Error("Invalid position type");
    }
}

export async function addEnclosureAnnotation_unit(annotation: RootAnnotation, vega_spec: vega.Spec, vlna_spec: VLATopLevel<VLANormalizedSpec>): Promise<EnclosureData | null> {
    if (!vega_spec.marks) vega_spec.marks = [];

    if (!annotation.enclosure) throw new Error("Enclosure annotation is required");
    annotation.enclosure.id = annotation.enclosure.id || ("AnnotationEnclosure" + Math.random().toString(36).substring(2, 15));
    if (!annotation.target) throw new Error("Target is required");

    const enclosureAnnotation = annotation.enclosure;
    let enclosureMark: vega.RectMark;

    // Handle position-based enclosure
    if (enclosureAnnotation.position) {
        enclosureMark = createRectMarkFromSpace(enclosureAnnotation, vega_spec);
    }
    // Handle target-based enclosure
    else if (typeof annotation.target === 'object') {
        if (annotation.target.type === 'pixel-space') {
            enclosureMark = createRectMarkFromSpace(enclosureAnnotation, vega_spec, annotation.target);
        }
        else if (annotation.target.type === 'data-space') {
            enclosureMark = createRectMarkFromSpace(enclosureAnnotation, vega_spec, annotation.target);
        }
        else if (annotation.target.type === 'data-index' || annotation.target.type === 'data-expr') {
            const markData = await getMarkBoundingBoxFromInternalData(vega_spec, annotation.target as DataPointMarker);

            let x: number, y: number, x2: number, y2: number;
            
            // Calculate bounding box based on mark data
            if (markData.length === 0) {
                throw new Error("No mark data found for the data space target");
            }
            // Process mark data to determine the bounding box
            markData.forEach(d => {
                if ('bounds' in d) {
                    if (x === undefined) {
                        x = d.bounds.x1;
                        y = d.bounds.y1;
                        x2 = d.bounds.x2;
                        y2 = d.bounds.y2;
                    }
                    else {
                        x = Math.min(x, d.bounds.x1);
                        y = Math.min(y, d.bounds.y1);
                        x2 = Math.max(x2, d.bounds.x2);
                        y2 = Math.max(y2, d.bounds.y2);
                    }
                }
                else {
                    throw new Error("Mark data does not contain bounds");
                }
            });
            

            enclosureMark = createRectMarkFromSpace(enclosureAnnotation, vega_spec, {
                type: 'pixel-space',
                x: x!,
                y: y!,
            });
            if (!enclosureMark.encode) enclosureMark.encode = { update: {} };
            if (!enclosureMark.encode.update) enclosureMark.encode.update = {};
            enclosureMark.encode.update.width = { value: x2! - x! };
            enclosureMark.encode.update.height = { value: y2! - y! };
        }
    }
    
    applyRectStyleProperties(enclosureMark!, enclosureAnnotation);
    applyRectOffsetAndPadding(enclosureMark!, enclosureAnnotation);
    vega_spec.marks.push(enclosureMark!);
    return createEnclosureData(enclosureMark!);
}
