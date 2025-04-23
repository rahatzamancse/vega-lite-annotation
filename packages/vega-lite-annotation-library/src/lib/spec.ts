// Styles
import type { Blend, Cursor } from 'vega'

// Curve Types
export type BaseCurve = {
    type: string
    /** 
     * Controls the direction of the curve's bend
     * - 'clockwise': Force curve to bend clockwise
     * - 'counterclockwise': Force curve to bend counterclockwise
     * - 'auto': Automatically determine direction (default)
     */
    direction?: 'clockwise' | 'counterclockwise' | 'auto'
    
    /**
     * Controls the amount of curve bending (0-1)
     * - 0: No curve (straight line)
     * - 1: Maximum curve
     * - 0.5: Default curve amount
     */
    tension?: number
}

export type LinearCurve = BaseCurve & {
    type: 'linear'
}

export type BasisCurve = BaseCurve & {
    type: 'basis'
}

export type CardinalCurve = BaseCurve & {
    type: 'cardinal'
    tension?: number // Controls the tension of the cardinal curve (0-1)
}

export type CatmullRomCurve = BaseCurve & {
    type: 'catmull-rom'
    alpha?: number // Controls the parametrization (0-1), 0 = uniform, 0.5 = centripetal, 1 = chordal
}

export type MonotoneCurve = BaseCurve & {
    type: 'monotone'
    // Monotone preserves monotonicity, no additional parameters
}

export type NaturalCurve = BaseCurve & {
    type: 'natural'
    // Natural spline, no additional parameters
}

export type StepCurve = BaseCurve & {
    type: 'step'
    align?: 'center' | 'before' | 'after' // Controls the step position
}

export type StepAfterCurve = BaseCurve & {
    type: 'step-after'
}

export type StepBeforeCurve = BaseCurve & {
    type: 'step-before'
}

export type CurveObject = 
    | LinearCurve 
    | BasisCurve 
    | CardinalCurve 
    | CatmullRomCurve 
    | MonotoneCurve 
    | NaturalCurve 
    | StepCurve 
    | StepAfterCurve 
    | StepBeforeCurve

// Markers
export type DataPointMarker = {
    type: 'data-expr'
    expr: string
} | {
    type: 'data-index'
    index: number,
} | {
    type: 'data-index'
    indices: number[]
}

export type AxisMarker = {
    type: 'axis'
    axis: string,
    range?: { min: number, max: number } | { "axis-expr": string },
    parts: "label" | "tick" | "grid" | "tick-label",
    offset?: number,
}

export type ChartPartMarker = {
    type:
    | "title"
    | "legend"
    | "..."
};

export type AnnotationId = string

export interface AnnotationMarker {
    type: "annotation-marker";
    target: AnnotationId;
}

// Positioning
export type FixedPosition = {
    type: "data-space" | "pixel-space";
    x: number;
    y: number;
};

export type Anchor1D = "auto" | "start" | "middle" | "end";
export type Anchor2D = "auto" | "upperLeft" | "upperMiddle" | "upperRight" | "middleLeft" | "middleMiddle" | "middleRight" | "lowerLeft" | "lowerMiddle" | "lowerRight";

export type Markers = 
    | DataPointMarker 
    | FixedPosition 
    // | AnnotationMarker 
    // | ChartPartMarker 
    // | AxisMarker 


export interface LineStyle {
    opacity?: number,
    stroke?: string,
    strokeWidth?: number,
    strokeDash?: [number, number],
    strokeDashOffset?: number,
    strokeJoin?: 'miter' | 'round' | 'bevel',
    strokeMiterLimit?: number,
    blend?: Blend,
    cursor?: Cursor,
    tooltip?: any,
    zIndex?: number,
    strokeCap?: 'square' | 'round' | 'butt'
}

export interface TextStyle {
    opacity?: number,
    cursor?: Cursor,
    url?: string,
    tooltip?: any,
    zIndex?: number,
    align?: 'left' | 'center' | 'right',
    angle?: number,
    baseline?: 'alphabetic' | 'top' | 'middle' | 'bottom' | 'line-top' | 'line-bottom',
    dir?: 'ltr' | 'rtl',
    ellipsis?: string,
    font?: string,
    fontSize?: number,
    fontStyle?: 'normal' | 'italic',
    fontWeight?: 'normal' | 'bold',
    lineBreak?: string,
    lineHeight?: number,
    limit?: number,
    radius?: number,
    theta?: number,
    color?: string,
    href?: string,
    zindex?: number,
}

export interface ShapeStyle {
    opacity?: number,
    cursor?: Cursor,
    url?: string,
    tooltip?: any,
    zIndex?: number,
    fill?: string,
    stroke?: string,
    strokeWidth?: number,
    strokeDash?: [number, number],
    strokeDashOffset?: number,
    strokeJoin?: 'miter' | 'round' | 'bevel',
    strokeMiterLimit?: number,
}

// Annotations
export type Annotation = {
    id?: string
    dx?: number
    dy?: number
}

// Text
export type TextAnnotation = Annotation & {
    text: string
    style?: TextStyle
    position?: FixedPosition | Anchor1D | Anchor2D // dynamically validate based on mark type which anchor to use
}

// Enclosure
export type ShapePath = {
    type: 'shape-path'
    path: string // M x y L x y L x y L x y Z ...
}
export type Rect = {
    type: 'rect'
    width?: number
    height?: number
    cornerRadius?: number | {
        topLeft?: number
        topRight?: number
        bottomLeft?: number
        bottomRight?: number
    }
}

export type Ellipse = {
    type: 'ellipse'
    rx?: number
    ry?: number
}

export type CurlyBraces = {
    type: 'curly-braces'
}

export type EnclosureAnnotation = Annotation & {
    shape?: 
        | Rect 
        // | Ellipse | CurlyBraces | ShapePath // TODO: Add support for these later
    padding?: number | { // will only work with target in data-index or data-expr
        top?: number
        bottom?: number
        left?: number
        right?: number
    }
    style?: {
        stroke?: LineStyle // stroke style
        fill?: string // color
        fillOpacity?: number
        opacity?: number
        href?: string
    }
    position?: FixedPosition
}

export type ArrowStyle = {
    fill?: string
    size?: number
    shape?: 'triangle' | 'triangle-right' | 'triangle-up' | 'triangle-down' | 'arrow'
    rotationAdjust?: number  // Angle adjustment in degrees
    opacity?: number
    stroke?: string
    strokeWidth?: number
}

export type ConnectorAnnotation = Annotation & {
    // Connectors are mostly used for ensemble, then it will connect in precedence of "enclosure-text" > "target-text" > "target-enclosure" > error. If used solely without connect_to, error
    connect_to?: {
        target: Markers
        position?: Anchor1D | Anchor2D
    }
    style?: LineStyle
    // path?: ShapePath
    /** 
     * Type of curve to use for the connector path
     * Can be specified as either a string value or a curve object with specific parameters
     */
    curve?: 'linear' | 'basis' | 'cardinal' | 'catmull-rom' | 'monotone' | 'natural' | 'step' | 'step-after' | 'step-before' | CurveObject
    /** 
     * Control the direction of the curve:
     * - 'clockwise': Force curve to bend clockwise
     * - 'counterclockwise': Force curve to bend counterclockwise
     * - 'auto': Automatically determine direction (default)
     * 
     * Note: This is used when curve is specified as a string. For object curve types, specify direction in the curve object.
     */
    curveDirection?: 'clockwise' | 'counterclockwise' | 'auto'
    /**
     * Control the amount of curvature (0-1):
     * - 0: No curve (straight line)
     * - 1: Maximum curve
     * - 0.5: Default curve amount
     * 
     * Note: This is used when curve is specified as a string. For object curve types, specify tension in the curve object.
     */
    curveTension?: number
    dx2?: number
    dy2?: number
    startArrow?: boolean
    endArrow?: boolean
    startArrowStyle?: ArrowStyle
    endArrowStyle?: ArrowStyle
}

export type IndicatorAnnotation = Annotation & ({ // We haven't yet fully fleshed out the indicator annotation yet
    indicatorType: "line";
    points: {
        expr: string;
        offset?: { x: number; y: number };
    };
    style: ShapeStyle | LineStyle;
} | {
    indicatorType: "area";
    points: {
        expr: string;
        offset?: { x: number; y: number };
    };
    style: ShapeStyle | LineStyle;
})


export interface RootAnnotation {
    target: Markers
    text?: TextAnnotation
    enclosure?: EnclosureAnnotation
    connector?: ConnectorAnnotation
    // indicator?: IndicatorAnnotation
    // ...?: ...
}
