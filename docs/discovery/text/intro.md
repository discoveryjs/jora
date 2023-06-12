Major features:

- Compact syntax for common tasks
- Aggregate values across arrays and eliminate duplicates by default
- Extensible by custom methods
- No input data mutation or side effects<sup>\*</sup>
- Input data never causes to an exception<sup>\*</sup>, i.e. returns *nothing* (`undefined`) for paths that not reachable or not applicable for an operator or a method
- Superset of [JSON5](https://json5.org/)
- Stat collecting mode (powers suggestions)
- Tolerant parsing mode (useful to provide query suggestions in an editor)

> <sup>*</sup> Extension methods may cause input data mutations, have side effects and throw an exception. However, that's an anti-pattern and outside of Jora's scope.
