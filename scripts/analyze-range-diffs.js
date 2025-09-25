#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';

// Run npm test to generate fresh data
console.log('Running npm test to generate fresh parity data...');
try {
    execSync('npm test', { stdio: 'pipe' });
    console.log('Test run completed.\n');
} catch (error) {
    // npm test might exit with non-zero code due to failing tests, but we still get the data
}

function findAllNodesWithRanges(obj, path = '') {
    const nodes = [];

    if (!obj || typeof obj !== 'object') {
        return nodes;
    }

    // If this object has a range property and a type, record it
    if (obj.range && obj.type && Array.isArray(obj.range) && obj.range.length === 2) {
        nodes.push({
            path,
            type: obj.type,
            range: obj.range,
            node: obj
        });
    }

    // Recursively search all properties
    for (const [key, value] of Object.entries(obj)) {
        if (key === 'range') {
            continue;
        } // Skip the range property itself

        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                const itemPath = path ? `${path}.${key}[${index}]` : `${key}[${index}]`;
                nodes.push(...findAllNodesWithRanges(item, itemPath));
            });
        } else if (value && typeof value === 'object') {
            const childPath = path ? `${path}.${key}` : key;
            nodes.push(...findAllNodesWithRanges(value, childPath));
        }
    }

    return nodes;
}

function getSourceFragment(source, range) {
    if (!source || !range || !Array.isArray(range) || range.length !== 2) {
        return '';
    }
    const [start, end] = range;
    return source.substring(start, end);
}

function compareRanges(range1, range2) {
    if (!range1 && !range2) {
        return null;
    }
    if (!range1 || !range2) {
        return 'nullability';
    }
    if (!Array.isArray(range1) || !Array.isArray(range2)) {
        return 'not_array';
    }
    if (range1.length !== 2 || range2.length !== 2) {
        return 'invalid_length';
    }

    const [start1, end1] = range1;
    const [start2, end2] = range2;

    if (start1 !== start2 && end1 !== end2) {
        return 'both';
    }
    if (start1 !== start2) {
        return 'start';
    }
    if (end1 !== end2) {
        return 'end';
    }

    return null; // No difference
}

function analyzeRangeDiffs(parityData) {
    const rangeStatsByNodeType = {};

    for (const item of parityData) {
        if (item.kind !== 'AST_MISMATCH' || !item.legacyAst || !item.newAst) {
            continue;
        }

        const query = item.source || '';

        // Find all nodes with ranges in both ASTs
        const legacyNodes = findAllNodesWithRanges(item.legacyAst);
        const newNodes = findAllNodesWithRanges(item.newAst);

        // Create a map of path -> node for easier lookup
        const legacyNodeMap = new Map(legacyNodes.map(n => [n.path, n]));
        const newNodeMap = new Map(newNodes.map(n => [n.path, n]));

        // Find all unique paths that have nodes with ranges
        const allPaths = new Set([...legacyNodeMap.keys(), ...newNodeMap.keys()]);

        for (const path of allPaths) {
            const legacyNode = legacyNodeMap.get(path);
            const newNode = newNodeMap.get(path);

            // Skip if both nodes don't exist (shouldn't happen with our logic)
            if (!legacyNode && !newNode) {
                continue;
            }

            if (!legacyNode?.range && newNode?.range) {
                // New node has range, legacy does not – likely an improvement
                continue;
            }

            // Compare ranges
            const rangeDiff = compareRanges(legacyNode?.range, newNode?.range);

            if (rangeDiff) {
                // Determine the node type - prefer the existing node's type
                const nodeType = legacyNode?.type || newNode?.type || 'unknown';

                // Build node path for context (traverse up the AST structure)
                const nodePath = buildNodePathFromAst(item.legacyAst || item.newAst, path);

                if (!rangeStatsByNodeType[nodeType]) {
                    rangeStatsByNodeType[nodeType] = [];
                }

                // Create diff entry
                const legacyRange = legacyNode?.range;
                const newRange = newNode?.range;
                const legacyFragment = legacyRange ? getSourceFragment(query, legacyRange) : '';
                const newFragment = newRange ? getSourceFragment(query, newRange) : '';

                rangeStatsByNodeType[nodeType].push({
                    id: item.id,
                    path: path,
                    nodePath: nodePath,
                    query: query,
                    options: item.options,
                    type: rangeDiff,
                    legacyRange: legacyRange ? `[${legacyRange[0]},${legacyRange[1]}]` : 'null',
                    newRange: newRange ? `[${newRange[0]},${newRange[1]}]` : 'null',
                    legacyFragment: legacyFragment,
                    newFragment: newFragment
                });
            }
        }
    }

    return Object.fromEntries(Object.entries(rangeStatsByNodeType)
        .sort((a, b) => b[1].length - a[1].length)
    );
}

function buildNodePathFromAst(ast, targetPath) {
    // This builds a path showing the types of nodes traversed to reach the target
    const parts = targetPath.split('.');
    const nodeTypes = [];
    let current = ast;

    for (const part of parts) {
        if (!current) {
            break;
        }

        // Add current node type if it exists
        if (current.type) {
            nodeTypes.push(current.type);
        }

        // Navigate to next part
        if (part.includes('[') && part.includes(']')) {
            const [key, indexStr] = part.split('[');
            const index = parseInt(indexStr.replace(']', ''));

            if (key && current[key]) {
                current = current[key];
            }

            if (Array.isArray(current) && index < current.length) {
                current = current[index];
            } else {
                break;
            }
        } else {
            current = current[part];
        }
    }

    // Add the final node type if we reached it
    if (current && current.type && !nodeTypes.includes(current.type)) {
        nodeTypes.push(current.type);
    }

    return nodeTypes.join('->') || 'unknown';
}

function generateStatistics(rangeStatsByNodeType) {
    console.log('=== Statistics by Node Type ===');
    console.log('Type            Total Start   End');
    console.log('---------------------------------');

    const sortedTypes = Object.keys(rangeStatsByNodeType).sort((a, b) =>
        rangeStatsByNodeType[b].length - rangeStatsByNodeType[a].length
    );

    let total = 0;
    for (const nodeType of sortedTypes) {
        const diffs = rangeStatsByNodeType[nodeType];
        const startCount = diffs.filter(d => d.type === 'start' || d.type === 'both').length;
        const endCount = diffs.filter(d => d.type === 'end' || d.type === 'both').length;

        console.log(`${nodeType.padEnd(15)} ${String(diffs.length).padStart(5)} ${String(startCount).padStart(5)} ${String(endCount).padStart(5)}`);
        total += diffs.length;
    }

    console.log('---------------------------------');
    console.log(`Total ${String(total).padStart(11)}`);
}

// Main execution
const data = JSON.parse(fs.readFileSync('tmp/parser-parity-diffs.json'));
const parityData = data.parity || data;

console.log('Reading parity differences...');
console.log(`Analyzing ${parityData.length} parity entries...`);
console.log('Generating statistics...\n');

const rangeStatsByNodeType = analyzeRangeDiffs(parityData);

// Write detailed results
fs.writeFileSync('tmp/range-analysis-detailed.json', JSON.stringify(rangeStatsByNodeType, null, 2));

console.log('=== Range Analysis Results ===');
console.log('Detailed analysis written to: tmp/range-analysis-detailed.json\n');

generateStatistics(rangeStatsByNodeType);
