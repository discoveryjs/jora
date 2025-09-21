- We are working on new implementation of Jora query parser (and tokenizer) located in `./src/lang/parser`. Currently we are fixing parity issues with current (legacy) implementation.
- You can run `nom test` to see difference in new and current (legacy) parser and tokenizer, it output parity stats at the end. Check `jora-parser-parity-diffs.jsonl` for all the differencies details (it's updates once you run a script with jora, including `npm test`)
- Use `compare-old-new-tokens.js` to test parity of new tokenizer with old one (it test tokens all the same by both tokenizers)
- If you need to experiment, just update `experiment.js` module (don't delete the module `experiment.js`, keep it for experiments) – this module just for experimenta, you can change it's content as you wish
- To load parsers for testing use the following imports:
```js
import legacyParser from './src/lang/parse-old.js';
import reworkParser from './src/lang/parser/index.js';

// legacyParser.parse()
// legacyParser.tokenize()
// reworkParser.parse()
// reworkParser.tokenize()
```
- Allways use ESM for code
