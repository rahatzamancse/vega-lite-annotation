import type {TextAnnotation, RootAnnotation, FixedPosition, DataPointMarker, Anchor2D} from './spec'
import * as vega from 'vega'
import type {VLATopLevel, VLANormalizedSpec, EnclosureData, TextData} from './vlAnnotationTypes'
import { getMarkBoundingBoxFromInternalData } from './extract-sceneGraph'
import { getScaleNames, calculateAnchorPosition } from './utils'

function applyTextStyleProperties(textMark: vega.TextMark, textAnnotation: TextAnnotation) {
    if (!textMark.encode) textMark.encode = { update: {} };
    if (!textMark.encode.update) textMark.encode.update = {};

    textMark.encode.update.align = { value: textAnnotation.style?.align || null }
    textMark.encode.update.angle = { value: textAnnotation.style?.angle || null }
    textMark.encode.update.baseline = { value: textAnnotation.style?.baseline || null }
    textMark.encode.update.dir = { value: textAnnotation.style?.dir || null }
    textMark.encode.update.dx = { value: textAnnotation.dx || null }
    textMark.encode.update.dy = { value: textAnnotation.dy || null }
    textMark.encode.update.ellipsis = { value: textAnnotation.style?.ellipsis || null }
    textMark.encode.update.font = { value: textAnnotation.style?.font || null }
    textMark.encode.update.fontSize = { value: textAnnotation.style?.fontSize || null }
    textMark.encode.update.fontWeight = { value: textAnnotation.style?.fontWeight || null }
    textMark.encode.update.fontStyle = { value: textAnnotation.style?.fontStyle || null }
    textMark.encode.update.lineBreak = { value: textAnnotation.style?.lineBreak || null }
    textMark.encode.update.lineHeight = { value: textAnnotation.style?.lineHeight || null }
    textMark.encode.update.limit = { value: textAnnotation.style?.limit || null }
    textMark.encode.update.radius = { value: textAnnotation.style?.radius || null }
    textMark.encode.update.text = { value: textAnnotation.text }
    textMark.encode.update.theta = { value: textAnnotation.style?.theta || null }
}

function applyTextOffset(textMark: vega.TextMark, textAnnotation: TextAnnotation) {
    if (!textMark.encode) textMark.encode = { update: {} };
    if (!textMark.encode.update) textMark.encode.update = {};

    if (textMark.encode.update.x && 'value' in textMark.encode.update.x) {
        textMark.encode.update.x.value = (textMark.encode.update.x.value as number) + (textAnnotation.dx || 0)
    }
    if (textMark.encode.update.y && 'value' in textMark.encode.update.y) {
        textMark.encode.update.y.value = (textMark.encode.update.y.value as number) + (textAnnotation.dy || 0)
    }
}

function createTextData(textMark: vega.TextMark | vega.TextMark[]): TextData | TextData[] {
    if (Array.isArray(textMark)) {
        return textMark.map(t => (createTextData(t) as TextData));
    }
    const update = textMark.encode?.update;
    if (!update) throw new Error("Text mark encode update is undefined");
    if (!update.x || !update.y || !update.text) throw new Error("Text mark encode update is undefined");

    if (!(update.x && 'value' in update.x && update.y && 'value' in update.y && update.text && 'value' in update.text))
        throw new Error("Text mark encode update is undefined");

    return {
        id: textMark.name!,
        x: (update.x.value as number),
        y: (update.y.value as number),
        text: (update.text.value as string),
    }
}

function createTextMarkFromSpace(textAnnotation: TextAnnotation, vega_spec: vega.Spec, position?: FixedPosition, id?: string): vega.TextMark {
    if (!position) {
        if (typeof textAnnotation.position === 'object') {
            position = textAnnotation.position;
        }
    }
    if (!position) throw new Error("Position is required in either textAnnotation or as a parameter");

    let x: number, y: number;
    if (position.type === 'pixel-space') {
        x = position.x;
        y = position.y;
    }
    else if (position.type === 'data-space') {
        const view = new vega.View(vega.parse(vega_spec)).initialize().run();
        const { xScaleName, yScaleName } = getScaleNames(vega_spec);
        x = view.scale(xScaleName)(position.x);
        y = view.scale(yScaleName)(position.y);
    }

    const textMark: vega.TextMark = {
        name: id || textAnnotation.id,
        type: 'text',
        encode: {
            update: {
                x: { value: x! },
                y: { value: y! },
                text: { value: textAnnotation.text }
            }
        }
    };

    return textMark;
}

export async function addTextAnnotation_unit(annotation: RootAnnotation, vega_spec: vega.Spec, vlna_spec: VLATopLevel<VLANormalizedSpec>, enclosureData: EnclosureData | null): Promise<TextData | TextData[]> {
    if (!vega_spec.marks) vega_spec.marks = [];
    
    if (!annotation.text) throw new Error("Text annotation is required");
    annotation.text.id = annotation.text.id || ("AnnotationText" + Math.random().toString(36).substring(2, 15));
    if (!annotation.target) throw new Error("Target is required");

    const textAnnotation = annotation.text;
    let textMark: vega.TextMark | vega.TextMark[];
    
    // Handle FixedPosition-based text
    if (typeof textAnnotation.position === 'object') {
        textMark = createTextMarkFromSpace(textAnnotation, vega_spec, textAnnotation.position);
    }
    // If there is an enclosure, put the text on the textAnnotation.position of the enclosure
    else if (enclosureData) {
        // TODO: Put the text in an empty position and return whether a connector is needed for connecting to the enclosure
        // Position the text based on textAnnotation.position relative to the enclosure
        if (textAnnotation.position === 'start' || textAnnotation.position === 'end' || textAnnotation.position === 'middle')
            throw new Error("Used 1D anchor for text positioning around enclosure");
        
        let x: number, y: number;
        if (typeof textAnnotation.position === 'string') {
            const ret = calculateAnchorPosition(textAnnotation.position as Anchor2D || 'upperMiddle', { x1: enclosureData.x, y1: enclosureData.y, x2: enclosureData.x2, y2: enclosureData.y2 });
            x = ret.x;
            y = ret.y;
        }
        
        textMark = createTextMarkFromSpace(textAnnotation, vega_spec, {
            type: 'pixel-space',
            x: x!,
            y: y!
        });
    }
    // Handle target-based text
    else if (typeof annotation.target === 'object') {
        if (annotation.target.type === 'pixel-space') {
            textMark = createTextMarkFromSpace(textAnnotation, vega_spec, annotation.target);
        }
        else if (annotation.target.type === 'data-space') {
            textMark = createTextMarkFromSpace(textAnnotation, vega_spec, annotation.target);
        }
        else if (annotation.target.type === 'data-index' || annotation.target.type === 'data-expr') {
            const markData = await getMarkBoundingBoxFromInternalData(vega_spec, annotation.target as DataPointMarker);
            
            if (!annotation.connector) {
                textMark = [];
                markData.forEach((d, i) => {
                    if ('bounds' in d) {
                        const {x, y} = calculateAnchorPosition(textAnnotation.position as Anchor2D || 'upperMiddle', d.bounds as {x1: number, y1: number, x2: number, y2: number});
                        (textMark as vega.TextMark[]).push(createTextMarkFromSpace(
                            textAnnotation,
                            vega_spec,
                            { type: 'pixel-space', x, y },
                            textAnnotation.id + `_${i}`
                        ));
                    }
                    else {
                        console.error("No bounding box found for text annotation", d);
                    }
                })
            }
            else {
                textMark = createTextMarkFromSpace(textAnnotation, vega_spec, {
                    type: 'pixel-space',
                    x: 10,
                    y: 10
                });
            }
        }
    }
    
    if (Array.isArray(textMark!)) {
        textMark.forEach(t => {
            applyTextOffset(t, textAnnotation);
            applyTextStyleProperties(t, textAnnotation);
            vega_spec.marks!.push(t)
        });
    }
    else {
        applyTextOffset(textMark!, textAnnotation);
        applyTextStyleProperties(textMark!, textAnnotation);
        vega_spec.marks!.push(textMark!);
    }
    
    return createTextData(textMark!);
}
