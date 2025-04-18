import { Field, FieldName } from 'vega-lite/channeldef';
import { Encoding } from 'vega-lite/encoding';
import { DataMixins } from 'vega-lite/spec/base';
import type { FrameMixins, GenericCompositionLayout, GenericCompositionLayoutWithColumns, ResolveMixins } from 'vega-lite/spec/base';
import { GenericConcatSpec } from 'vega-lite/spec/concat';

import type { BaseSpec, GenericFacetSpec, GenericHConcatSpec, GenericVConcatSpec, GenericLayerSpec, GenericUnitSpec } from 'vega-lite/spec';
import type { SelectionParameter } from 'vega-lite/selection'
import type { RootAnnotation } from './spec'
import { AnyMark, Mark, MarkDef } from 'vega-lite/mark';
import { CompositeEncoding, FacetedCompositeEncoding, SharedCompositeEncoding } from 'vega-lite/compositemark';
import { Projection } from 'vega-lite/projection';
import { ExprRef } from 'vega-lite/expr';
import { Datasets, TopLevelParameter, TopLevelProperties } from 'vega-lite/spec/toplevel';
import { LayerRepeatMapping, RepeatMapping } from 'vega-lite/spec/repeat';
import { Config, Dict } from 'vega-lite/index';

export interface VLAGenericUnitSpec<E extends Encoding<any>, M, P = SelectionParameter> extends GenericUnitSpec<E, M, P> {
    annotations?: RootAnnotation[]
}

export interface VLAGenericLayerSpec<U extends VLAGenericUnitSpec<any, any>> extends GenericLayerSpec<U> {
    layer: (VLAGenericLayerSpec<U> | U)[];
    annotations?: RootAnnotation[]
}

export interface VLAGenericFacetSpec<U extends VLAGenericUnitSpec<any, any>, L extends VLAGenericLayerSpec<U>, F extends Field> extends GenericFacetSpec<U, L, F> {
    annotations?: RootAnnotation[]
}

export interface VLAGenericConcatSpec<S extends VLAGenericSpec<any, any, any, any>> extends GenericConcatSpec<S> { }
export interface VLAGenericVConcatSpec<S extends VLAGenericSpec<any, any, any, any>> extends GenericVConcatSpec<S> { }
export interface VLAGenericHConcatSpec<S extends VLAGenericSpec<any, any, any, any>> extends GenericHConcatSpec<S> { }

/**
 * Base interface for a repeat specification.
 */
export interface VLANonLayerRepeatSpec extends BaseSpec, GenericCompositionLayoutWithColumns, ResolveMixins {
    /**
     * Definition for fields to be repeated. One of:
     * 1) An array of fields to be repeated. If `"repeat"` is an array, the field can be referred to as `{"repeat": "repeat"}`. The repeated views are laid out in a wrapped row. You can set the number of columns to control the wrapping.
     * 2) An object that maps `"row"` and/or `"column"` to the listed fields to be repeated along the particular orientations. The objects `{"repeat": "row"}` and `{"repeat": "column"}` can be used to refer to the repeated field respectively.
     */
    repeat: string[] | RepeatMapping;

    /**
     * A specification of the view that gets repeated.
     */
    spec: VLANonNormalizedSpec;
}
export interface VLALayerRepeatSpec extends BaseSpec, GenericCompositionLayoutWithColumns, ResolveMixins {
    /**
     * Definition for fields to be repeated. One of:
     * 1) An array of fields to be repeated. If `"repeat"` is an array, the field can be referred to as `{"repeat": "repeat"}`. The repeated views are laid out in a wrapped row. You can set the number of columns to control the wrapping.
     * 2) An object that maps `"row"` and/or `"column"` to the listed fields to be repeated along the particular orientations. The objects `{"repeat": "row"}` and `{"repeat": "column"}` can be used to refer to the repeated field respectively.
     */
    repeat: LayerRepeatMapping;

    /**
     * A specification of the view that gets repeated.
     */
    spec: VLALayerSpec<Field> | VLAUnitSpecWithFrame<Field>;
}
export type VLARepeatSpec = VLANonLayerRepeatSpec | VLALayerRepeatSpec;

export type VLAGenericSpec<
    U extends VLAGenericUnitSpec<Encoding<F>, any>,
    L extends VLAGenericLayerSpec<U>,
    R extends VLARepeatSpec,
    F extends Field,
> =
    | U
    | L
    | R
    | VLAGenericFacetSpec<U, L, F>
    | VLAGenericConcatSpec<VLAGenericSpec<U, L, R, F>>
    | VLAGenericVConcatSpec<VLAGenericSpec<U, L, R, F>>
    | VLAGenericHConcatSpec<VLAGenericSpec<U, L, R, F>>;

export type VLANormalizedUnitSpec = VLAGenericUnitSpec<Encoding<FieldName>, Mark | MarkDef>;
export type VLANormalizedLayerSpec = VLAGenericLayerSpec<VLANormalizedUnitSpec>;
/**
 * Specs with only primitive marks and without other macros.
 */
export type VLANormalizedSpec = VLAGenericSpec<VLANormalizedUnitSpec, VLANormalizedLayerSpec, never, FieldName>;

export type VLAUnitSpecWithFrame<F extends Field> = VLAGenericUnitSpec<CompositeEncoding<F>, AnyMark> & FrameMixins;
export type VLAUnitSpec<F extends Field> = VLAGenericUnitSpec<CompositeEncoding<F>, AnyMark>;
/**
 * A full layered plot specification, which may contains `encoding` and `projection` properties that will be applied to underlying unit (single-view) specifications.
 */
export interface VLALayerSpec<F extends Field> extends BaseSpec, FrameMixins, ResolveMixins {
    /**
     * Layer or single view specifications to be layered.
     *
     * __Note__: Specifications inside `layer` cannot use `row` and `column` channels as layering facet specifications is not allowed. Instead, use the [facet operator](https://vega.github.io/vega-lite/docs/facet.html) and place a layer inside a facet.
     */
    layer: (VLALayerSpec<F> | VLAUnitSpec<F>)[];

    /**
     * A shared key-value mapping between encoding channels and definition of fields in the underlying layers.
     */
    encoding?: SharedCompositeEncoding<F>;

    /**
     * An object defining properties of the geographic projection shared by underlying layers.
     */
    projection?: Projection<ExprRef>;
    annotations?: RootAnnotation[]
}
export type VLATopLevelFacetSpec = VLATopLevel<VLAGenericFacetSpec<VLAUnitSpecWithFrame<Field>, VLALayerSpec<Field>, Field>> &
    DataMixins;

export type VLAFacetedUnitSpec<F extends Field, P = SelectionParameter> = VLAGenericUnitSpec<
    FacetedCompositeEncoding<F>,
    AnyMark,
    P
> &
    ResolveMixins &
    GenericCompositionLayout &
    FrameMixins;
export type VLANonNormalizedSpec = VLAGenericSpec<VLAFacetedUnitSpec<Field>, VLALayerSpec<Field>, VLARepeatSpec, Field>;

export type VLATopLevelUnitSpec<F extends Field> = VLATopLevel<VLAFacetedUnitSpec<F, TopLevelParameter>> & DataMixins;
export type VLATopLevel<S extends BaseSpec> = S &
    TopLevelProperties & {
        /**
         * URL to [JSON schema](http://json-schema.org/) for a Vega-Lite specification. Unless you have a reason to change this, use `https://vega.github.io/schema/vega-lite/v6.json`. Setting the `$schema` property allows automatic validation and autocomplete in editors that support JSON schema.
         * @format uri
         */
        $schema?: string;

        /**
         * Vega-Lite configuration object. This property can only be defined at the top-level of a specification.
         */
        config?: Config;

        /**
         * A global data store for named datasets. This is a mapping from names to inline datasets.
         * This can be an array of objects or primitive values or a string. Arrays of primitive values are ingested as objects with a `data` property.
         */
        datasets?: Datasets;

        /**
         * Optional metadata that will be passed to Vega.
         * This object is completely ignored by Vega and Vega-Lite and can be used for custom metadata.
         */
        usermeta?: Dict<unknown>;
        annotations?: RootAnnotation[]
    };
/**
 * A Vega-Lite top-level specification.
 * This is the root class for all Vega-Lite specifications.
 * (The json schema is generated from this type.)
 */
export type VLATopLevelSpec =
    | VLATopLevelUnitSpec<Field>
    | VLATopLevel<VLALayerSpec<Field>>
    // TODO: Implement these specs
    // | VLATopLevelFacetSpec
    // | VLATopLevel<VLARepeatSpec>
    // | VLATopLevel<VLAGenericConcatSpec<VLANonNormalizedSpec>>
    // | VLATopLevel<VLAGenericVConcatSpec<VLANonNormalizedSpec>>
    // | VLATopLevel<VLAGenericHConcatSpec<VLANonNormalizedSpec>>;



// Other internal types
export type EnclosureData = {
    id: string,
    x: number,
    y: number,
    x2: number,
    y2: number,
}

export type TextData = {
    id: string,
    x: number,
    y: number,
    text: string,
}

export type ConnectorData = {
    id: string,
    x: number,
    y: number,
    x2: number,
    y2: number,
}

