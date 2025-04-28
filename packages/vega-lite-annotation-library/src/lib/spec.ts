// Styles
import type { Blend, Cursor } from 'vega'

/**
 * Base curve type that defines common properties for all curve types.
 */
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

/**
 * Linear curve type - creates straight line segments between points.
 */
export type LinearCurve = Omit<BaseCurve, "direction" | "tension"> & {
    type: 'linear'
}

/**
 * Basis curve type - creates a B-spline through the specified points.
 */
export type BasisCurve = BaseCurve & {
    type: 'basis'
}

/**
 * Cardinal curve type - creates a Cardinal spline through the specified points.
 */
export type CardinalCurve = BaseCurve & {
    type: 'cardinal'
}

/**
 * Catmull-Rom curve type - creates a Catmull-Rom spline through the specified points.
 */
export type CatmullRomCurve = BaseCurve & {
    type: 'catmull-rom'
    alpha?: number // Controls the parametrization (0-1), 0 = uniform, 0.5 = centripetal, 1 = chordal
}

/**
 * Monotone curve type - creates a cubic spline that preserves monotonicity.
 */
export type MonotoneCurve = BaseCurve & {
    type: 'monotone'
    // Monotone preserves monotonicity, no additional parameters
}

/**
 * Natural curve type - creates a natural cubic spline with zero second derivatives at the endpoints.
 */
export type NaturalCurve = BaseCurve & {
    type: 'natural'
    // Natural spline, no additional parameters
}

/**
 * Step curve type - creates a piecewise constant function (a step function) consisting of horizontal and vertical lines.
 */
export type StepCurve = BaseCurve & {
    type: 'step'
    align?: 'center' | 'before' | 'after' // Controls the step position
}

/**
 * Step-after curve type - creates a step function with the y-value changing after the x-value.
 */
export type StepAfterCurve = BaseCurve & {
    type: 'step-after'
}

/**
 * Step-before curve type - creates a step function with the y-value changing before the x-value.
 */
export type StepBeforeCurve = BaseCurve & {
    type: 'step-before'
}

/**
 * Union type of all possible curve objects that can be used for path generation.
 * Default curve type is BasisCurve.
 */
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

/**
 * Markers for targeting data points in a visualization.
 * Can reference data by expression, single index, or multiple indices.
 */
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

/**
 * Marker for targeting parts of an axis in a visualization.
 */
export type AxisMarker = {
    type: 'axis'
    axis: string,
    range?: { min: number, max: number } | { "axis-expr": string },
    parts: "label" | "tick" | "grid" | "tick-label",
    offset?: number,
}

/**
 * Marker for targeting specific chart parts like title or legend.
 */
export type ChartPartMarker = {
    type:
    | "title"
    | "legend"
    // | "..."
};

/**
 * Unique identifier for annotations.
 */
export type AnnotationId = string

/**
 * Marker for targeting another annotation by its ID.
 */
export type AnnotationMarker = {
    type: "annotation-marker";
    target: AnnotationId;
}

/**
 * Position defined by exact coordinates in either data space or pixel space.
 */
export type FixedPosition = {
    type: "data-space" | "pixel-space";
    x: number;
    y: number;
};

/**
 * One-dimensional anchor positions.
 */
export type Anchor1D = "auto" | "start" | "middle" | "end";

/**
 * Two-dimensional anchor positions.
 */
export type Anchor2D = "auto" | "upperLeft" | "upperMiddle" | "upperRight" | "middleLeft" | "middleMiddle" | "middleRight" | "lowerLeft" | "lowerMiddle" | "lowerRight";

/**
 * Union type of all possible marker types.
 */
export type Markers = 
    | DataPointMarker 
    | FixedPosition 
    // | AnnotationMarker 
    // | ChartPartMarker 
    // | AxisMarker 

/**
 * Style properties for line elements.
 */
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

/**
 * Style properties for text elements.
 */
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

/**
 * Style properties for shape elements.
 */
export type ShapeStyle = {
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

/**
 * Base type for all annotation types.
 * Defines common properties shared across annotation types.
 */
export type Annotation = {
    /** Unique identifier for the annotation */
    id?: string
    /** Horizontal offset in pixels */
    dx?: number
    /** Vertical offset in pixels */
    dy?: number
}

/**
 * Text annotation for adding labels or descriptions to visualizations.
 */
export type TextAnnotation = Annotation & {
    /** The text content of the annotation */
    text: string
    /** Style properties for the text */
    style?: TextStyle
    /** Absolute or relative position of the text relative to its anchor point */
    position?: FixedPosition | Anchor1D | Anchor2D // dynamically validate based on mark type which anchor to use
}

/**
 * Shape path for custom enclosure shapes.
 */
export type ShapePath = {
    type: 'shape-path'
    /** SVG path string (e.g., "M x y L x y Z") */
    path: string 
}

/**
 * Rectangle shape for enclosure annotations.
 */
export type Rect = {
    type: 'rect'
    /** Width of the rectangle */
    width?: number
    /** Height of the rectangle */
    height?: number
    /** Radius of the rectangle corners */
    cornerRadius?: number | {
        topLeft?: number
        topRight?: number
        bottomLeft?: number
        bottomRight?: number
    }
}

/**
 * Ellipse shape for enclosure annotations.
 */
export type Ellipse = {
    type: 'ellipse'
    /** Horizontal radius of the ellipse */
    rx?: number
    /** Vertical radius of the ellipse */
    ry?: number
    /** Rotation of the ellipse */
    rotate?: number
}

/**
 * Curly braces shape for enclosure annotations.
 */
export type CurlyBraces = {
    type: 'curly-braces'
}

/**
 * Enclosure annotation for highlighting areas or grouping elements.
 */
export type EnclosureAnnotation = Annotation & {
    /** Shape of the enclosure */
    shape?: 
        | Rect 
        // | Ellipse | CurlyBraces | ShapePath // TODO: Add support for these later
    /** Padding around the target elements */
    padding?: number | { // will only work with target in data-index or data-expr
        top?: number
        bottom?: number
        left?: number
        right?: number
    }
    /** Style properties for the enclosure */
    style?: {
        stroke?: LineStyle // stroke style
        fill?: string // color
        fillOpacity?: number
        opacity?: number
        href?: string
    }
    /** Fixed position for the enclosure to ignore target */
    position?: FixedPosition
}

/**
 * Style properties for arrow elements used in connectors.
 */
export type ArrowStyle = {
    /** Fill color of the arrow */
    fill?: string
    /** Size of the arrow */
    size?: number
    /** Shape of the arrow head */
    shape?: 'triangle' | 'triangle-right' | 'triangle-up' | 'triangle-down' | 'arrow'
    /** Adjustment to the rotation angle in degrees */
    rotationAdjust?: number
    /** Opacity of the arrow */
    opacity?: number
    /** Stroke color of the arrow */
    stroke?: string
    /** Stroke width of the arrow */
    strokeWidth?: number
}

/**
 * Connector annotation for drawing lines between elements.
 * If connect_from and connect_to are not specified, the connector will be drawn from the target element to any other annotations.
 */
export type ConnectorAnnotation = Annotation & {
    /** Target to connect from */
    connect_from?: {
        target: Markers
        position?: Anchor1D | Anchor2D
    }
    /** Target to connect to */
    connect_to?: {
        target: Markers
        position?: Anchor1D | Anchor2D
    }
    /** Style properties for the connector line */
    style?: LineStyle
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
    /** Horizontal offset for the end point */
    dx2?: number
    /** Vertical offset for the end point */
    dy2?: number
    /** Whether to show an arrow at the start of the connector */
    startArrow?: boolean
    /** Whether to show an arrow at the end of the connector */
    endArrow?: boolean
    /** Style properties for the start arrow */
    startArrowStyle?: ArrowStyle
    /** Style properties for the end arrow */
    endArrowStyle?: ArrowStyle
}

/**
 * Indicator annotation for highlighting specific data features.
 * Not fully implemented yet.
 */
export type IndicatorAnnotation = Annotation & ({ 
    /** Type of indicator - line */
    indicatorType: "line";
    /** Data points to include in the indicator */
    points: {
        expr: string;
        offset?: { x: number; y: number };
    };
    /** Style properties for the indicator */
    style: ShapeStyle | LineStyle;
} | {
    /** Type of indicator - area */
    indicatorType: "area";
    /** Data points to include in the indicator */
    points: {
        expr: string;
        offset?: { x: number; y: number };
    };
    /** Style properties for the indicator */
    style: ShapeStyle | LineStyle;
})

/**
 * Root annotation structure that combines various annotation types.
 * This is the main object used to define a complete annotation.
 */
export interface RootAnnotation {
    /** Target element(s) for the annotation */
    target: Markers
    /** Optional text annotation */
    text?: TextAnnotation
    /** Optional enclosure annotation */
    enclosure?: EnclosureAnnotation
    /** Optional connector annotation */
    connector?: ConnectorAnnotation
    // indicator?: IndicatorAnnotation
    // ...?: ...
}
