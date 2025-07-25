# [ArXiv preprint](https://arxiv.org/abs/2507.04236)

## Authors

- [Rahat Zaman](https://rahatzamancse.netlify.app/)
- [Dilshadur Rahman](https://dilshadur.owlstown.net/)
- [Andrew McNutt](https://www.mcnutt.in/)
- [Paul Rosen](https://cspaul.com/)

## Research Paper

This work has been submitted for publication and presents the theoretical foundation and implementation details of the annotation grammar.

**Read the full paper:** [ArXiv preprint](https://arxiv.org/abs/2507.04236)

## Project Overview

VL-Annotations is a university research project that extends Vega-Lite with a declarative grammar for creating rich, contextual annotations in data visualizations. This work elevates annotations from secondary overlays to first-class design elements, making them easier to author, reuse, and maintain.

## Research Origins

This project originated from research into making annotations a core component of visualization grammars, rather than ad-hoc additions. The work introduces **AnnoGram**, an extension to Wilkinson's Grammar of Graphics that treats annotations as siblings to scales and geometries.

The research addresses a fundamental limitation in current visualization tools: most platforms treat annotations as afterthoughts, requiring manual positioning and making them difficult to transfer between different chart types or datasets.

## Key Innovation

Our approach uses a **target-and-effect** model where annotations:
- **Target** specific visualization elements (data points, axes, chart parts)
- Apply various **annotation types** (text, enclosure, connector, indicator)
- Use intelligent **placement strategies** that adapt to different chart layouts

This design enables annotations to be data-driven, portable across chart types, and maintainable as visualizations evolve.