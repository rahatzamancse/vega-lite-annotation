export {
    vlaToV,
    vlnaToV_noAnnotations,
    VLANormalize
} from './lib/vlAnnotation'

export type {
    VLATopLevelSpec,
    VLANormalizedSpec,
} from './lib/vlAnnotationTypes'

export {
    RootAnnotation as Annotation,
} from './lib/spec'

export {
    createOccupancyMatrix
} from './lib/positionResolver'

export {
    vegaSpecToSceneGraph
} from './lib/extract-sceneGraph'