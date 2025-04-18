import * as vega from 'vega'

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
