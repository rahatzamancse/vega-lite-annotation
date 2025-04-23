import * as vega from 'vega'
import { Anchor2D, Anchor1D } from './spec';

// TODO: Weird way of looking for scale names. Should be fixed. Now only works if there is direct scale in the mark.
export function getScaleNames(vega_spec: vega.Spec): { xScaleName: string; yScaleName: string } {
    const aMark = vega_spec.marks?.[0];
    if (!aMark) throw new Error("No mark found in Vega spec");

    if (!aMark.encode?.update?.x || !aMark.encode?.update?.y) {
        throw new Error("No x or y encodings found in mark encode update");
    }
    
    const xUpdate = aMark.encode.update.x;
    const yUpdate = aMark.encode.update.y;
    
    if (!('scale' in xUpdate) || !('scale' in yUpdate)) {
        throw new Error("No x or y scale found in mark encode update");
    }
    
    const xScaleName = xUpdate.scale;
    const yScaleName = yUpdate.scale;
    
    if (typeof xScaleName !== 'string' || typeof yScaleName !== 'string') {
        throw new Error("Scale names must be strings");
    }
    
    return { xScaleName, yScaleName };
}

// Calculate the position of the text based on the anchor and the bounding box
export function calculateAnchorPosition(position: Anchor1D | Anchor2D, boundingBox: {x1: number, y1: number, x2: number, y2: number}): {x: number, y: number} {
    if (position === 'start')
        return {x: boundingBox.x1, y: boundingBox.y1};        
    else if (position === 'end')
        return {x: boundingBox.x2, y: boundingBox.y2};
    else if (position === 'middle')
        return {x: (boundingBox.x2 + boundingBox.x1) / 2, y: (boundingBox.y2 + boundingBox.y1) / 2};
    else if (position === 'upperLeft')
        return {x: boundingBox.x1, y: boundingBox.y1};
    else if (position === 'upperRight')
        return {x: boundingBox.x2, y: boundingBox.y1};
    else if (position === 'lowerLeft')
        return {x: boundingBox.x1, y: boundingBox.y2};
    else if (position === 'middleLeft')
        return {x: boundingBox.x1, y: (boundingBox.y2 + boundingBox.y1) / 2};
    else if (position === 'middleRight')
        return {x: boundingBox.x2, y: (boundingBox.y2 + boundingBox.y1) / 2};
    else if (position === 'upperMiddle')
        return {x: (boundingBox.x2 + boundingBox.x1) / 2, y: boundingBox.y1};
    else if (position === 'lowerMiddle')
        return {x: (boundingBox.x2 + boundingBox.x1) / 2, y: boundingBox.y2};
    else if (position === 'lowerRight')
        return {x: boundingBox.x2, y: boundingBox.y2};
    else if (position === 'middleMiddle')
        return {x: (boundingBox.x2 + boundingBox.x1) / 2, y: (boundingBox.y2 + boundingBox.y1) / 2};
    else {
        return {x: (boundingBox.x2 + boundingBox.x1) / 2, y: (boundingBox.y2 + boundingBox.y1) / 2};
    }
}
