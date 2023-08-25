import assert from 'assert';
import jora from 'jora';
import { naturalCompare } from '@discoveryjs/natural-compare';
import localMethods from '../src/methods.js';

const localMethodNames = Object.keys(localMethods);

describe('query/stat mode', () => {
    describe('default', () => {
        const options = { stat: true };

        it('basic', () => {
            const data = [{ id: 1, foo: 1 }, { id: 2, foo: 42 }];
            const res = jora('.[foo=1]', options)(data);

            assert.deepStrictEqual(res.value, [data[0]]);
            assert.deepStrictEqual(res.stat(3), [{
                context: 'path',
                from: 2,
                to: 5,
                text: 'foo',
                related: null,
                values: new Set([data[0], data[1]])
            }]);
            assert.deepStrictEqual(res.stat(6), [{
                context: 'value',
                from: 6,
                to: 7,
                text: '1',
                related: null,
                values: new Set([1, 42])
            }]);
        });

        describe('getMethodInfo() method', () => {
            it('basic', () =>{
                const methodsInfo = {
                    foo: jora.createMethodInfo([])
                };
                const res = jora('.[]', {...options, methodsInfo})([]);
                assert.deepEqual(res.getMethodInfo('foo'), methodsInfo.foo);
                assert.deepEqual(res.getMethodInfo('bar'), null);
                assert.deepEqual(res.getMethodInfo('bool'), jora.methodsInfo.bool);
            });
        });

        describe('suggestion() method', () => {
            it('default behaviour (no options)', () => {
                const data = [{ id: 1, foo: 1 }, { id: 2, foo: 42 }];
                const res = jora('.[foo=i]', options)(data);

                assert.deepEqual(res.suggestion(3), [{
                    type: 'property',
                    from: 2,
                    to: 5,
                    text: 'foo',
                    suggestions: ['id', 'foo']
                }, {
                    type: 'method',
                    from: 2,
                    to: 5,
                    text: 'foo',
                    suggestions: localMethodNames
                }]);
                assert.deepEqual(res.suggestion(6), [{
                    type: 'value',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: [1, 42]
                }, {
                    type: 'property',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: ['id', 'foo']
                }, {
                    type: 'method',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: localMethodNames
                }]);
            });

            it('default filter', () => {
                const data = [{ id: 1, foo: 1 }, { id: 2, foo: 42 }];
                const res = jora('.[foo=i]', options)(data);

                assert.deepEqual(res.suggestion(3, { filter: true }), [{
                    type: 'property',
                    from: 2,
                    to: 5,
                    text: 'foo',
                    suggestions: ['foo']
                }]);
                assert.deepEqual(res.suggestion(6, { filter: true }), [{
                    type: 'property',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: ['id']
                }, {
                    type: 'method',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: localMethodNames.filter(n => n.match(/i/i))
                }]);
            });

            it('default filter for a "string" value', () => {
                const data = [
                    { id: 1, foo: 'hello' },
                    { id: 2, foo: 'WORLD' },
                    { id: 3, foo: 'test' }
                ];
                const res = jora('.[foo="o"]', options)(data);

                assert.deepEqual(res.suggestion(6, { filter: true }), [{
                    type: 'value',
                    from: 6,
                    to: 9,
                    text: '"o"',
                    suggestions: ['hello', 'WORLD']
                }]);
            });

            it('default filter for a \'string\' value', () => {
                const data = [
                    { id: 1, foo: 'hello' },
                    { id: 2, foo: 'WORLD' },
                    { id: 3, foo: 'test' }
                ];
                const res = jora('.[foo=\'o\']', options)(data);

                assert.deepEqual(res.suggestion(6, { filter: true }), [{
                    type: 'value',
                    from: 6,
                    to: 9,
                    text: '\'o\'',
                    suggestions: ['hello', 'WORLD']
                }]);
            });

            it('custom filter', () => {
                const data = [{ id: 1, foo: 1 }, { id: 'id', foo: 42 }];
                const res = jora('.[foo=id]', options)(data);
                const filter = pattern => value => value === pattern;

                assert.deepEqual(res.suggestion(3, { filter }), [{
                    type: 'property',
                    from: 2,
                    to: 5,
                    text: 'foo',
                    suggestions: ['foo']
                }]);
                assert.deepEqual(res.suggestion(6, { filter }), [{
                    type: 'property',
                    from: 6,
                    to: 8,
                    text: 'id',
                    suggestions: ['id']
                }]);
            });

            it('using limit', () => {
                const data = [
                    { id: 1, foo: 1 },
                    { id: 2, foo: 42, bar: 3 },
                    { id: 3, foo: 33, qux: 5, bar: 4 },
                    { id: 4, foo: 20 }
                ];
                const res = jora('.[foo=i]', options)(data);

                assert.deepEqual(res.suggestion(3, { limit: 3 }), [{
                    type: 'property',
                    from: 2,
                    to: 5,
                    text: 'foo',
                    suggestions: ['id', 'foo', 'bar']
                }, {
                    type: 'method',
                    from: 2,
                    to: 5,
                    text: 'foo',
                    suggestions: localMethodNames.slice(0, 3)
                }]);
                assert.deepEqual(res.suggestion(6, { limit: 3 }), [{
                    type: 'value',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: [1, 42, 33]
                }, {
                    type: 'property',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: ['id', 'foo', 'bar']
                }, {
                    type: 'method',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: localMethodNames.slice(0, 3)
                }]);
            });

            it('filter & limit', () => {
                const data = [
                    { id: 1, foo: 1 },
                    { id: 2, foo: 'zip', fix: 3 },
                    { id: 3, foo: 33, qux: 5, foobar: 4, index: 123 },
                    { id: 4, foo: 'index', FOO: 1 }
                ];
                const res = jora('.[foo=i]', options)(data);

                assert.deepEqual(res.suggestion(3, { filter: true, limit: 2 }), [{
                    type: 'property',
                    from: 2,
                    to: 5,
                    text: 'foo',
                    suggestions: ['foo', 'foobar']
                }]);
                assert.deepEqual(res.suggestion(6, { filter: true, limit: 2 }), [{
                    type: 'value',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: ['zip', 'index']
                }, {
                    type: 'property',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: ['id', 'fix']
                }, {
                    type: 'method',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: localMethodNames.filter(n => n.match(/i/i)).slice(0, 2)
                }]);
            });

            it('default sorting', () => {
                const data = [
                    { id: 1, Foo: 1 },
                    { id: 2, Foo: 42, bar: 3 },
                    { id: 3, Foo: 33, qux: 5, bar: 4, ABC: 123 },
                    { id: 4, Foo: 20 }
                ];
                const res = jora('.[Foo=i]', options)(data);

                assert.deepEqual(res.suggestion(3, { sort: true }), [{
                    type: 'property',
                    from: 2,
                    to: 5,
                    text: 'Foo',
                    suggestions: ['ABC', 'Foo', 'bar', 'id', 'qux']
                }, {
                    type: 'method',
                    from: 2,
                    to: 5,
                    text: 'Foo',
                    suggestions: [...localMethodNames].sort()
                }]);
                assert.deepEqual(res.suggestion(6, { sort: true }), [{
                    type: 'value',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: [1, 20, 33, 42]
                }, {
                    type: 'property',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: ['ABC', 'Foo', 'bar', 'id', 'qux']
                }, {
                    type: 'method',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: [...localMethodNames].sort()
                }]);
            });

            it('custom sorting', () => {
                const data = [
                    { id: 1, Foo: 1 },
                    { id: 2, Foo: 42, bar: 3 },
                    { id: 3, Foo: 33, qux: 5, bar: 4, ABC: 123 },
                    { id: 4, Foo: 20 }
                ];
                const res = jora('.[Foo=i]', options)(data);
                const sort = naturalCompare;

                assert.deepEqual(res.suggestion(3, { sort }), [{
                    type: 'property',
                    from: 2,
                    to: 5,
                    text: 'Foo',
                    suggestions: ['ABC', 'bar', 'Foo', 'id', 'qux']
                }, {
                    type: 'method',
                    from: 2,
                    to: 5,
                    text: 'Foo',
                    suggestions: [...localMethodNames].sort(naturalCompare)
                }]);
                assert.deepEqual(res.suggestion(6, { sort }), [{
                    type: 'value',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: [1, 20, 33, 42]
                }, {
                    type: 'property',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: ['ABC', 'bar', 'Foo', 'id', 'qux']
                }, {
                    type: 'method',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: [...localMethodNames].sort(naturalCompare)
                }]);
            });

            it('sort & filter', () => {
                const data = [
                    { id: 1, foo: 1 },
                    { id: 2, foo: 'zip', fix: 3 },
                    { id: 3, foo: 33, qux: 5, foobar: 4, index: 123 },
                    { id: 4, foo: 'index', FOO: 1 }
                ];
                const res = jora('.[foo=i]', options)(data);

                assert.deepEqual(res.suggestion(3, { sort: true, filter: true }), [{
                    type: 'property',
                    from: 2,
                    to: 5,
                    text: 'foo',
                    suggestions: ['FOO', 'foo', 'foobar']
                }]);
                assert.deepEqual(res.suggestion(6, { sort: true, filter: true }), [{
                    type: 'value',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: ['index', 'zip']
                }, {
                    type: 'property',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: ['fix', 'id', 'index']
                }, {
                    type: 'method',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: localMethodNames.filter(n => n.match(/i/i)).sort()
                }]);
            });

            it('sort & limit', () => {
                const data = [
                    { id: 1, foo: 1 },
                    { id: 2, foo: 42, bar: 3 },
                    { id: 3, foo: 33, qux: 5, bar: 4 },
                    { id: 4, foo: 20 }
                ];
                const res = jora('.[foo=i]', options)(data);

                assert.deepEqual(res.suggestion(3, { sort: true, limit: 3 }), [{
                    type: 'property',
                    from: 2,
                    to: 5,
                    text: 'foo',
                    suggestions: ['bar', 'foo', 'id']
                }, {
                    type: 'method',
                    from: 2,
                    to: 5,
                    text: 'foo',
                    suggestions: [...localMethodNames].sort().slice(0, 3)
                }]);
                assert.deepEqual(res.suggestion(6, { sort: true, limit: 3 }), [{
                    type: 'value',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: [1, 20, 33]
                }, {
                    type: 'property',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: ['bar', 'foo', 'id']
                }, {
                    type: 'method',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: [...localMethodNames].sort().slice(0, 3)
                }]);
            });

            it('sort & filter & limit', () => {
                const data = [
                    { id: 1, foo: 1, foofoo: 2 },
                    { id: 2, foo: 'zip', fix: 3, index1: 1, aid: 1, izzzy: 2 },
                    { id: 3, foo: 33, qux: 5, foobar: 4, index: 123 },
                    { id: 4, foo: 'index', FOO: 1, foos: 2 },
                    { id: 4, foo: 'i6' }
                ];
                const res = jora('.[foo=i]', options)(data);

                assert.deepEqual(res.suggestion(3, { sort: true, filter: true, limit: 4 }), [{
                    type: 'property',
                    from: 2,
                    to: 5,
                    text: 'foo',
                    suggestions: ['FOO', 'foo', 'foobar', 'foofoo']
                }]);
                assert.deepEqual(res.suggestion(6, { sort: true, filter: true, limit: 4 }), [{
                    type: 'value',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: ['i6', 'index', 'zip']
                }, {
                    type: 'property',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: ['aid', 'fix', 'id', 'index']
                }, {
                    type: 'method',
                    from: 6,
                    to: 7,
                    text: 'i',
                    suggestions: localMethodNames.filter(n => n.match(/i/i)).sort().slice(0, 4)
                }]);
            });
        });
    });

    describe('tolerant mode', () => {
        const options = { stat: true, tolerant: true };

        it('basic', () => {
            const data = [{ id: 1, foo: 1 }, { id: 2, foo: 42 }];
            const res = jora('.[foo=]', options)(data);
            //                   ^  ^
            //                   3  6

            assert.deepStrictEqual(res.value, []);
            assert.deepEqual(res.stat(3), [{
                context: 'path',
                from: 2,
                to: 5,
                text: 'foo',
                related: null,
                values: new Set([data[0], data[1]])
            }]);
            assert.deepEqual(res.stat(6), [{
                context: 'value',
                from: 6,
                to: 6,
                text: '',
                related: null,
                values: new Set([1, 42])
            }, {
                context: 'path',
                from: 6,
                to: 6,
                text: '',
                related: null,
                values: new Set([data[0], data[1]])
            }]);
        });

        describe('suggestion() method', () => {
            it('basic', () => {
                const data = [{ id: 1, foo: 1 }, { id: 2, foo: 42 }, { id: 3, foo: 'test' }];
                const res = jora('.[foo=]', options)(data);
                //                   ^  ^
                //                   3  6

                assert.deepEqual(res.suggestion(3), [{
                    type: 'property',
                    from: 2,
                    to: 5,
                    text: 'foo',
                    suggestions: ['id', 'foo']
                }, {
                    from: 2,
                    text: 'foo',
                    to: 5,
                    type: 'method',
                    suggestions: [...localMethodNames]
                }]);
                assert.deepEqual(res.suggestion(6), [{
                    type: 'value',
                    from: 6,
                    to: 6,
                    text: '',
                    suggestions: [1, 42, 'test']
                }, {
                    type: 'property',
                    from: 6,
                    to: 6,
                    text: '',
                    suggestions: ['id', 'foo']
                }, {
                    text: '',
                    from: 6,
                    to: 6,
                    type: 'method',
                    suggestions: [...localMethodNames]
                }]);
            });
        });
    });
});
