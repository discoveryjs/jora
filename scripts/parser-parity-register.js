
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./scripts/parser-parity-loader.js', pathToFileURL('./'));
