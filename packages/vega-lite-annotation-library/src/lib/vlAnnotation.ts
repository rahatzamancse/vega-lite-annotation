import type {VLATopLevelSpec, VLANormalizedSpec, VLATopLevelUnitSpec, VLALayerSpec, VLANormalizedLayerSpec, VLATopLevel, VLANormalizedUnitSpec, EnclosureData, TextData, ConnectorData} from './vlAnnotationTypes'
import {TopLevelSpec as VLSpec, TopLevel, LayoutSizeMixins} from 'vega-lite/spec'
import {RootAnnotation} from './spec'
import {compile, normalize} from 'vega-lite'
import * as vega from 'vega'
import {Field} from 'vega-lite/channeldef'
import {addTextAnnotation_unit} from './textAnnotation'
import { addEnclosureAnnotation_unit } from './enclosureAnnotation'
import { addConnectorAnnotation_unit } from './connectorAnnotation'

export function VLANormalize(spec: VLATopLevelSpec): VLATopLevel<VLANormalizedSpec> & LayoutSizeMixins {
    // Deep copy the spec to avoid mutations
    const inputSpec: VLATopLevelSpec = JSON.parse(JSON.stringify(spec));
    
    // Handle both unit and layer specs
    if ('layer' in inputSpec) {
        // Handle layer spec case
        
        // Add names to layers if they don't have one
        const inputLayers = (inputSpec as VLATopLevel<VLALayerSpec<Field>>).layer;
        inputLayers.forEach((layer, i) => {
            if (!layer?.name) {
                layer.name = `layer_${i}`;
            }
        });

        // Normalize the spec
        const normalizedSpec = normalize(inputSpec) as TopLevel<VLANormalizedLayerSpec> & LayoutSizeMixins;

        // Get top-level annotations from the input layer spec
        const topLevelAnnotations = (inputSpec as VLATopLevel<VLALayerSpec<Field>>).annotations;
        if (topLevelAnnotations) {
            // Add top-level annotations to the normalized spec
            normalizedSpec.annotations = topLevelAnnotations;
        }

        // Handle annotations in each layer
        for (const inputLayer of inputLayers) {
            if (inputLayer.annotations && inputLayer.name) {
                // Find corresponding normalized layer by name
                const normalizedLayer = normalizedSpec.layer.find(l => l.name === inputLayer.name);
                if (normalizedLayer) {
                    normalizedLayer.annotations = inputLayer.annotations;
                }
            }
        }

        return normalizedSpec;
    } else if ('mark' in inputSpec || 'encoding' in inputSpec) {
        // Handle unit spec case - verify it has mark or encoding which are required for unit specs
        const annotations = (inputSpec as VLATopLevelUnitSpec<Field>).annotations;

        // Normalize the spec without annotations
        const normalizedSpec = normalize(inputSpec) as TopLevel<VLANormalizedUnitSpec> & LayoutSizeMixins;

        // Add annotations back if they existed
        if (annotations) {
            normalizedSpec.annotations = annotations;
        }

        return normalizedSpec;
    } else {
        throw new Error('Not implemented: Only layer spec or unit spec are working now');
    }
}

export function vlnaToV_noAnnotations(spec: VLATopLevel<VLANormalizedSpec>): vega.Spec {
    // Deep copy the spec
    const vlna_spec: VLATopLevel<VLANormalizedSpec> = JSON.parse(JSON.stringify(spec))
    
    // Compile to Vega
    return compile(vlna_spec as VLSpec).spec
}

export async function vlaToV(spec: VLATopLevelSpec): Promise<vega.Spec> {
    // deep copy the spec
    const vlna_spec = VLANormalize(spec)
    
    // Compile to Vega
    let vega_spec: vega.Spec = vlnaToV_noAnnotations(vlna_spec)
    
    // Handle all types of VLATopLevelSpec
    if ('layer' in vlna_spec) {
        // Handle layer spec case
        for (const layer of vlna_spec.layer) {
            const annotations = layer.annotations ? layer.annotations : []
            // TODO: Implement this
        }
    }
    else if ('mark' in vlna_spec || 'encoding' in vlna_spec) {
        // Handle unit spec case
        const annotations = vlna_spec.annotations ? vlna_spec.annotations : []
        // TODO: Sort the annotations topologically first, then add them to the Vega spec
        for (const annotation of annotations) {
            await addAnnotationToVegaSpec_unit(annotation, vega_spec, vlna_spec)
        }
    }
    
    return vega_spec
}

async function addAnnotationToVegaSpec_unit(annotation: RootAnnotation, vega_spec: vega.Spec, vlna_spec: VLATopLevel<VLANormalizedSpec>) {
    let enclosureData: EnclosureData | null = null;
    if (annotation.enclosure) {
        enclosureData = await addEnclosureAnnotation_unit(annotation, vega_spec, vlna_spec)
    }
    console.log("enclosureData", enclosureData)
    let textData: TextData | TextData[] | null = null;
    if (annotation.text) {
        textData = await addTextAnnotation_unit(annotation, vega_spec, vlna_spec, enclosureData)
    }
    console.log("textData", textData)
    let connectorData: ConnectorData | ConnectorData[] | null = null;
    if (annotation.connector) {
        connectorData = await addConnectorAnnotation_unit(annotation, vega_spec, vlna_spec, enclosureData, textData)
    }
}
