const assert = require('assert');
const { naturalCompare } = require('../src/lang/natural-compare');

function sort(array) {
    return array.slice().sort(naturalCompare);
}

describe('natural sorting', () => {
    it('sign', () => {
        const input = [
            '1',
            '-1',
            '+1',
            '1.0',
            '-1.0',
            '1',
            '-1',
            '+0',
            '0',
            '0.00',
            '-0'
        ];

        assert.deepEqual(sort(input), [
            '-1.0',
            '-1',
            '-1',
            '-0',
            '0',
            '0.00',
            '+0',
            '1',
            '1',
            '1.0',
            '+1'
        ]);
    });

    it('percentage', () => {
        const input = [
            '5% 6.0%',
            '1%',
            '100%',
            '5%',
            '5% 6%',
            '5% 6%',
            '5% 10%',
            '10%',
            '5.5%',
            '5.0% 7%',
            '5.6%',
            '5.0% 7.0%',
            '5.0% 7%'
        ];

        assert.deepEqual(sort(input), [
            '1%',
            '5%',
            '5% 6%',
            '5% 6%',
            '5% 6.0%',
            '5.0% 7%',
            '5.0% 7%',
            '5.0% 7.0%',
            '5% 10%',
            '5.5%',
            '5.6%',
            '10%',
            '100%'
        ]);
    });

    it('should sort a homogeneous array of strings in ascending direction', () => {
        const input = [
            'x',
            'y',
            'z',
            'a',
            'b',
            'c'
        ];

        assert.deepEqual(sort(input), [
            'a',
            'b',
            'c',
            'x',
            'y',
            'z'
        ]);
    });

    it('should sort a heterogeneous array of numbers and strings in ascending direction', () => {
        const input = [
            'x',
            'y',
            'z',
            1,
            -2,
            3,
            'a',
            'b',
            'c',
            '4',
            '-5',
            '6'
        ];

        assert.deepEqual(sort(input), [
            '-5',
            -2,
            1,
            3,
            '4',
            '6',
            'a',
            'b',
            'c',
            'x',
            'y',
            'z'
        ]);
    });

    it('should allow case insensitive by default', () => {
        const input = [
            'abc_a',
            'aBc_b',
            'ABC_c'
        ];

        assert.deepEqual(sort(input), [
            'ABC_c',
            'aBc_b',
            'abc_a'
        ]);
    });

    it.skip('should be case sensitive with option', () => {
        const input = [
            'abc_a',
            'abc_A',
            'aBc_B',
            'aBc_b',
            'ABC_c',
            'ABC_C'
        ];

        assert.deepEqual(sort(input), [
            'abc_A',
            'abc_a',
            'aBc_B',
            'aBc_b',
            'ABC_C',
            'ABC_c'
        ]);
    });

    it('should sorting including special characters', () => {
        const input = [
            'áeiou_a',
            'aęiou_b',
            'æiou_c',
            'aeioǜ_d',
            'aeiou_e'
        ];

        assert.deepEqual(sort(input), [
            'aeiou_e',
            'aeioǜ_d',
            'aęiou_b',
            'áeiou_a',
            'æiou_c'
        ]);
    });

    it('should allow case sensitive sorting by special characters', () => {
        const input = [
            'áeiou_a',
            'aęiou_b',
            'æiou_c',
            'aEioǜ_d',
            'aeiou_e'
        ];

        assert.deepEqual(sort(input), [
            'aEioǜ_d',
            'aeiou_e',
            'aęiou_b',
            'áeiou_a',
            'æiou_c'
        ]);
    });

    it('should respect sign', () => {
        const input = [
            '0.0.0',
            '-0.-0.-0',
            '-0.+0.-0',
            '+0.+0.+0',
            '+0.-0.+0'
        ];

        assert.deepEqual(sort(input), [
            '-0.-0.-0',
            '-0.+0.-0',
            '0.0.0',
            '+0.-0.+0',
            '+0.+0.+0'
        ]);
    });

    describe('whitespace/delimeters should have lowest precedence than numbers', () => {
        const fixture = [
            '   123',
            '123123',
            '    77',
            '    12',
            '    12  3',
            '    12 3',
            '    12 2',
            '    12   1',
            '    12    3',
            '   76',
            '  123',
            '  10',
            ' 12312',
            '12312'
        ];

        for (const p of [' ', '.', '_']) {
            it(JSON.stringify(p), () => {
                const input = fixture.map(s => s.replace(/\s/g, p));
                const expected = [
                    '  10',
                    '    12',
                    '    12   1',
                    '    12 2',
                    '    12 3',
                    '    12  3',
                    '    12    3',
                    '   76',
                    '    77',
                    '  123',
                    '   123',
                    '12312',
                    ' 12312',
                    '123123'
                ].map(s => s.replace(/\s/g, p));

                assert.deepEqual(sort(input), expected);
            });
        }
    });

    describe('whitespace/delimeters should have lowest precedence than strings', () => {
        const fixture = [
            '   abc',
            'abcdef',
            '    zs',
            '    bd',
            '    bd z',
            '    bd  z',
            '    bd    z',
            '    bd   a',
            '    bd b',
            '   op',
            '  abc',
            '  az',
            ' abcde',
            'abcde'
        ];

        for (const p of [' ', '.', '_']) {
            it(JSON.stringify(p), () => {
                const input = fixture.map(s => s.replace(/\s/g, p));
                const expected = [
                    '  abc',
                    '   abc',
                    'abcde',
                    ' abcde',
                    'abcdef',
                    '  az',
                    '    bd',
                    '    bd   a',
                    '    bd b',
                    '    bd z',
                    '    bd  z',
                    '    bd    z',
                    '   op',
                    '    zs'
                ].map(s => s.replace(/\s/g, p));

                assert.deepEqual(sort(input), expected);
            });
        }
    });

    it('should fallback on numbers first', () => {
        const input = [
            '   1',
            '   001',
            '0001',
            '  01',
            '   01',
            ' 2 0001',
            ' 2   1',
            ' 2  01'
        ];

        assert.deepEqual(sort(input), [
            '   1',
            '  01',
            '   01',
            '   001',
            '0001',
            ' 2   1',
            ' 2  01',
            ' 2 0001'
        ]);
    });

    it('should sort lexicographic orderings in ascending direction', () => {
        const input = [
            '40.50.60.70',
            '40.50.60',
            '40.5.60',
            '4.50.60',
            '4.5.60',
            '40.50.6',
            '4.50.6',
            '40.5.6',
            '4.5.6',
            '4.5.6.7',
            '0.0.0',
            '-0.-0.-0',
            '-0.+0.-0',
            '+0.+0.+0',
            '+0.-0.+0'
        ];

        assert.deepEqual(sort(input), [
            '-0.-0.-0',
            '-0.+0.-0',
            '0.0.0',
            '+0.-0.+0',
            '+0.+0.+0',
            '4.5.6',
            '4.5.6.7',
            '4.5.60',
            '4.50.6',
            '4.50.60',
            '40.5.6',
            '40.5.60',
            '40.50.6',
            '40.50.60',
            '40.50.60.70'
        ]);
    });

    it('should sort mixed dot separated number sequence and a number', () => {
        const input = [
            '40.50.6  10.05%',
            '40.50.6 10.50%',
            '40.50.6 10.5%',
            '40.50.60.70',
            '40.50.6 10.25%',
            '40.50.6 10.05%',
            '40.50.60 10.05%',
            '40.50.60 10.5%',
            '40.50.60 10.05%',
            '40.50.60 10.15%'
        ];

        assert.deepEqual(sort(input), [
            '40.50.6 10.05%',
            '40.50.6  10.05%',
            '40.50.6 10.25%',
            '40.50.6 10.5%',
            '40.50.6 10.50%',
            '40.50.60 10.05%',
            '40.50.60 10.05%',
            '40.50.60 10.15%',
            '40.50.60 10.5%',
            '40.50.60.70'
        ]);
    });

    it('should sort strings containing numbers in ascending direction', () => {
        const input = [
            'a00000.data',
            'a00001.data',
            'a00002.data',
            'a00003.data',
            'a00010.data',
            'a000000.data',
            'a0000003.data',
            'a00002.data.1',
            'a00002.data.2',
            'a00002.data.10',
            'x0y0z',
            'x',
            'x0',
            'x0y0',
            'x0y',
            'x-0y-0z',
            'x+0y+0z',
            'x'
        ];

        assert.deepEqual(sort(input), [
            'a00000.data',
            'a000000.data',
            'a00001.data',
            'a00002.data',
            'a00002.data.1',
            'a00002.data.2',
            'a00002.data.10',
            'a00003.data',
            'a0000003.data',
            'a00010.data',
            'x',
            'x',
            'x0',
            'x0y',
            'x0y0',
            'x0y0z',
            'x+0y+0z',
            'x-0y-0z'
        ]);
    });

    it('IP addresses', () => {
        const input = [
            '127.0.0.1',
            '40.80.120.160',
            '10.20.10.20',
            '10.200.10.20',
            '10.199.10.20',
            '10.21.10.20'
        ];

        assert.deepEqual(sort(input), [
            '10.20.10.20',
            '10.21.10.20',
            '10.199.10.20',
            '10.200.10.20',
            '40.80.120.160',
            '127.0.0.1'
        ]);
    });

    describe('dashes/sign and numbers', () => {
        it('should treat as dash', () => {
            const input = [
                'foo-3',
                'foo-2',
                'foo-1.4',
                'foo-1.05',
                'foo-1.050',
                'foo-3.0',
                'foo-3.03',
                'foo-3.030',
                'foo-3.1'
            ];

            assert.deepEqual(sort(input), [
                'foo-1.05',
                'foo-1.050',
                'foo-1.4',
                'foo-2',
                'foo-3',
                'foo-3.0',
                'foo-3.03',
                'foo-3.030',
                'foo-3.1'
            ]);
        });

        it('should treat as a sign', () => {
            const input = [
                'foo (-3%)',
                'foo (-2%)',
                'foo (-1.4%)',
                'foo (-1.05%)',
                'foo (-1.050%)',
                'foo (-3.0%)',
                'foo (-3.03%)',
                'foo (-3.030%)',
                'foo (-3.1%)',
                'foo (3%)',
                'foo (2%)',
                'foo (1.4%)',
                'foo (1.05%)',
                'foo (1.050%)',
                'foo (3.0%)',
                'foo (3.03%)',
                'foo (3.030%)',
                'foo (3.1%)'
            ];

            assert.deepEqual(sort(input), [
                'foo (-3.1%)',
                'foo (-3.030%)',
                'foo (-3.03%)',
                'foo (-3.0%)',
                'foo (-3%)',
                'foo (-2%)',
                'foo (-1.4%)',
                'foo (-1.050%)',
                'foo (-1.05%)',
                'foo (1.05%)',
                'foo (1.050%)',
                'foo (1.4%)',
                'foo (2%)',
                'foo (3%)',
                'foo (3.0%)',
                'foo (3.03%)',
                'foo (3.030%)',
                'foo (3.1%)'
            ]);
        });
    });

    describe('alphanum-sort tests (with fixes)', () => {
        const tests = [{
            message: 'should sort numbers',
            fixture: ['5', '10', '5', '00', '01', '05', '0', '8', '1'],
            expected: ['0', '00', '1', '01', '5', '5', '05', '8', '10']
        }, {
            message: 'should sort negative numbers',
            fixture: ['10', '-1', '-000033', '0', '5', '-033', '-0', '32', '03', '-20', '3', '00', '-00', '003', '-33', '33'],
            expected: ['-000033', '-033', '-33', '-20', '-1', '-00', '-0', '0', '00', '3', '03', '003', '5', '10', '32', '33'],
            options: { sign: true }
        }, {
            message: 'should sort letters',
            fixture: ['b', 'v', 'd', 'c', 'a'],
            expected: ['a', 'b', 'c', 'd', 'v']
        }, {
            message: 'should sort mixed data',
            fixture: ['z', '5', '-5', 'k', '10', 'f', '00', 'z00', '10f', 'z10'],
            expected: ['-5', '00', '5', '10', '10f', 'f', 'k', 'z', 'z00', 'z10']
        }, {
            message: 'should sort similar dates',
            fixture: ['2008/01/01', '2008/10/01', '1992/01/01', '1991/01/01'],
            expected: ['1991/01/01', '1992/01/01', '2008/01/01', '2008/10/01']
        }, {
            message: 'should sort similar dates (2)',
            fixture: ['0000-3-34', '2000-1-10', '2000-1-2', '1999-12-25', '2000-3-23', '1999-3-3'],
            expected: ['0000-3-34', '1999-3-3', '1999-12-25', '2000-1-2', '2000-1-10', '2000-3-23']
        }, {
            message: 'should sort ISO8601-ish YYYY-MM-DDThh:mm:ss',
            fixture: ['2010-06-15 13:45:30', '2009-06-15 13:45:30', '2009-01-15 01:45:30'],
            expected: ['2009-01-15 01:45:30', '2009-06-15 13:45:30', '2010-06-15 13:45:30']
        }, {
            message: 'should sort unix epoch, Date.getTime()',
            fixture: ['1245098730000', '14330728000', '1245098728000'],
            expected: ['14330728000', '1245098728000', '1245098730000']
        }, {
            message: 'should sort close release numbers',
            fixture: ['1.0.2', '1.0.1', '1.0.0', '1.0.9'],
            expected: ['1.0.0', '1.0.1', '1.0.2', '1.0.9']
        }, {
            message: 'should sort close version numbers (2)',
            fixture: ['1.1beta', '1.1.2alpha3', '1.0.2alpha3', '1.0.2alpha1', '1.0.1alpha4', '2.1.2', '2.1.1'],
            expected: ['1.0.1alpha4', '1.0.2alpha1', '1.0.2alpha3', '1.1.2alpha3', '1.1beta', '2.1.1', '2.1.2']
        }, {
            message: 'should sort fractional release numbers',
            fixture: ['1.011.02', '1.010.12', '1.009.02', '1.009.20', '1.009.10', '1.002.08', '1.002.03', '1.002.01'],
            expected: ['1.002.01', '1.002.03', '1.002.08', '1.009.02', '1.009.10', '1.009.20', '1.010.12', '1.011.02']
        }, {
            message: 'should sort multi-digit branch releases',
            fixture: ['1.0.03', '1.0.003', '1.0.002', '1.0.0001'],
            expected: ['1.0.0001', '1.0.002', '1.0.03', '1.0.003']
        }, {
            message: 'should sort string first releases',
            fixture: ['myrelease-1.1.3', 'myrelease-1.2.3', 'myrelease-1.1.4', 'myrelease-1.1.1', 'myrelease-1.0.5', 'myrelease-2.0.0'],
            expected: ['myrelease-1.0.5', 'myrelease-1.1.1', 'myrelease-1.1.3', 'myrelease-1.1.4', 'myrelease-1.2.3', 'myrelease-2.0.0']
        }, {
            message: 'should sort strings/numbers',
            fixture: ['10', 9, 2, '1', '4'],
            expected: ['1', 2, '4', 9, '10']
        }, {
            message: 'should sort padded numbers',
            fixture: ['0001', '002', '001'],
            expected: ['001', '0001', '002']
        }, {
            message: 'should sort padded & regular numbers',
            fixture: [2, 1, '1', '0001', '002', '02', '001'],
            expected: [1, '1', '001', '0001', 2, '02', '002']
        }, {
            message: 'should sort decimal string vs decimal, same precision',
            fixture: ['10.04', 10.02, 10.03, '10.01'],
            expected: ['10.01', 10.02, 10.03, '10.04']
        }, {
            message: 'should sort negative numbers cast to strings',
            fixture: ['-1', '-2', '4', '-3', '0', '-5'],
            expected: ['-5', '-3', '-2', '-1', '0', '4'],
            options: { sign: true }
        }, {
            message: 'should sort negative numbers of mixed types',
            fixture: [-1, '-2', 4, -3, '0', '-5'],
            expected: ['-5', -3, '-2', -1, '0', 4],
            options: { sign: true }
        }, {
            message: 'should sort IP addresses',
            fixture: ['192.168.0.100', '192.168.0.1', '192.168.1.1', '192.168.0.250', '192.168.1.123', '10.0.0.2', '10.0.0.1'],
            expected: ['10.0.0.1', '10.0.0.2', '192.168.0.1', '192.168.0.100', '192.168.0.250', '192.168.1.1', '192.168.1.123']
        }, {
            message: 'should sort simple filenames',
            fixture: ['img12.png', 'img10.png', 'img2.png', 'img1.png'],
            expected: ['img1.png', 'img2.png', 'img10.png', 'img12.png']
        }, {
            message: 'should sort simple filenames with dashes',
            fixture: ['img-12.png', 'img-10.png', 'img-2.png', 'img-1.png'],
            expected: ['img-1.png', 'img-2.png', 'img-10.png', 'img-12.png']
        }, {
            message: 'should sort complex filenames',
            fixture: ['car.mov', '01alpha.sgi', '001alpha.sgi', 'my.string_41299.tif', 'organic2.0001.sgi'],
            expected: ['01alpha.sgi', '001alpha.sgi', 'car.mov', 'my.string_41299.tif', 'organic2.0001.sgi']
        }, {
            message: 'should sort unix filenames',
            fixture: [
                './system/kernel/js/01_ui.core.js',
                './system/kernel/js/00_jquery-1.3.2.js',
                './system/kernel/js/02_my.desktop.js'
            ],
            expected: [
                './system/kernel/js/00_jquery-1.3.2.js',
                './system/kernel/js/01_ui.core.js',
                './system/kernel/js/02_my.desktop.js'
            ]
        }, {
            message: 'should sort skipping whitespace',
            fixture: ['alpha', ' 1', '  3', ' 2', '0'],
            expected: ['0', ' 1', ' 2', '  3', 'alpha']
        }, {
            message: 'should sort empty strings',
            fixture: ['10023', '999', '', '2', '5'],
            expected: ['', '2', '5', '999', '10023']
        }, {
            skip: true,
            message: 'should sort a case sensitive unsorted array',
            fixture: ['A', 'b', 'C', 'd', 'E', 'f'],
            expected: ['A', 'C', 'E', 'b', 'd', 'f']
        }, {
            message: 'should sort a case insensitive unsorted array',
            fixture: ['A', 'C', 'E', 'b', 'd', 'f'],
            expected: ['A', 'b', 'C', 'd', 'E', 'f'],
            options: { insensitive: true }
        }, {
            message: 'invalid numeric string sorting',
            fixture: ['-1', '-00', '+0', '-2', '0', '4', '+00', '00', '-3', '-32', '-0', '-5', '+00'],
            expected: ['-32', '-5', '-3', '-2', '-1', '-00', '-0', '0', '00', '+0', '+00', '+00', '4'],
            options: { sign: true }
        }, {
            message: 'alphanumeric - number first',
            fixture: ['5D', '1A', '2D', '33A', '5E', '33K', '33D', '5S', '2C', '5C', '5F', '1D', '2M'],
            expected: ['1A', '1D', '2C', '2D', '2M', '5C', '5D', '5E', '5F', '5S', '33A', '33D', '33K']
        }, {
            message: 'should comapre signs only before digits',
            fixture: ['+item', '-item', '+34', '-43'],
            expected: ['-43', '+34', '+item', '-item'],
            options: { sign: true }
        }];

        for (const test of tests) {
            (test.skip ? it.skip : it)(test.message, () => {
                assert.deepEqual(sort(test.fixture), test.expected);
            });
        }
    });
});
