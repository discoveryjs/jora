import { pathToFileURL } from 'node:url';
import path from 'node:path';

const projectRootUrl = pathToFileURL(path.resolve(process.cwd(), '.')).href;
const targetPath = '/src/lang/parse.js';
const replacePath = '/scripts/parser-parity.js';

export async function resolve(specifier, context, nextResolve) {
    const resolved = new URL(specifier, context.parentURL ?? projectRootUrl).href;

    if (resolved.endsWith(targetPath)) {
        return { url: path.join(projectRootUrl, replacePath), shortCircuit: true };
    }

    return nextResolve(specifier, context);
}
