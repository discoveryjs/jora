- We are working on new implementation of Jora query parser (and tokenizer) located in `./src/lang/parser`. Currently we have parity with old parser (based on jison) in terms of AST structure and correctness, and tokenization. However, `range` on AST nodes (metadata) is not implemented yet, so parity check ignores `range` for now. Also no parity in error messages and metadata (i.e. error details and location) yet. Current focus on polishing implementation, moving responsibilities between tokenizer and parser, and performance optimizations. After that we will work on error messages and metadata.
- You can run `npm test` to see the differences between the new and current (legacy) parsers and tokenizers. It outputs a parity stats report at the end of the test run. Check `tmp/parser-parity-diffs.jsonl` for full details of the differences (this file is updated each time you run `npm test`).
- Use `PRINT_QUERIES=1 npm test` to enable printing of problematic queries alongside the error messages. Other environment options for npm test:
    - `PARITY_MODE` (default: legacy) - mode of operation, possible values:
        - `legacy`: Legacy parser is primary, new parser runs for comparison
        - `new`: New parser is primary, legacy parser runs for comparison
        - `new-only`: New parser only, no comparison
        - `off`: Legacy parser only, no comparison
    - `PARITY_PRINT_QUERIES` (default: false) - print failed queries
    - `PARITY_STRIP_METADATA` (default: true) - strip metadata from ASTs (like `loc`, `range`, etc) for parity comparison
- Use `npm lint -- --fix` to fix linting issues
- Use the `./tmp` folder, if you need to experiment or test something with a temporary script
- Use `scripts/compare-old-new-tokens.js` to test parity of tokenizers
- Use `scripts/parser-benchmark.js` to benchmark performance of old vs new parser
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
