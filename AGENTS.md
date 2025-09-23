- We are working on new implementation of Jora query parser (and tokenizer) located in `./src/lang/parser`. Currently we have parity with old parser (based on jison) in terms of AST structure and correctness, and tokenization. However, `range` on AST nodes (metadata) is not implemented yet, so parity check ignores `range` for now. Also no parity in error messages and metadata (i.e. error details and location) yet. Current focus on polishing implementation, moving responsibilities between tokenizer and parser, and performance optimizations. After that we will work on error messages and metadata.
- You can run `nom test` to see difference in new and current (legacy) parser and tokenizer, it output parity stats at the end. Check `jora-parser-parity-diffs.jsonl` for all the differencies details (it's updates once you run a script with jora, including `npm test`). Use `PRINT_QUERIES=1 npm test` to enable printing of problematic queries next to error message. Other ENV options:
    - `PARITY_MODE` (default: legacy) - mode of operation, possible values:
        - `legacy`: Legacy parser is primary, new parser runs for comparison
        - `new`: New parser is primary, legacy parser runs for comparison
        - `new-only`: New parser only, no comparison
        - `off`: Legacy parser only, no comparison
    - `PARITY_PRINT_QUERIES` (default: false) - print failed queries
    - `PARITY_STRIP_METADATA` (default: true) - strip metadata from ASTs (like `loc`, `range`, etc) for parity comparison
- If you need to experiment or test something using a temporary script, use `./tmp` folder
- Use `compare-old-new-tokens.js` to test parity of new tokenizer with old one (it test tokens all the same by both tokenizers)
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
