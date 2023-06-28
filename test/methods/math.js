import assert from 'assert';
import query from 'jora';

describe('math methods', () => {
    it('abs', () => {
        assert.strictEqual(query('abs()')(-1), Math.abs(-1));
    });
    it('acos', () => {
        assert.strictEqual(query('acos()')(2), Math.acos(2));
    });
    it('acosh', () => {
        assert.strictEqual(query('acosh()')(2), Math.acosh(2));
    });
    it('asin', () => {
        assert.strictEqual(query('asin()')(2), Math.asin(2));
    });
    it('asinh', () => {
        assert.strictEqual(query('asinh()')(2), Math.asinh(2));
    });
    it('atan', () => {
        assert.strictEqual(query('atan()')(2), Math.atan(2));
    });
    it('atan2', () => {
        assert.strictEqual(query('atan2()')(2), Math.atan2(2));
    });
    it('atanh', () => {
        assert.strictEqual(query('atanh()')(2), Math.atanh(2));
    });
    it('cbrt', () => {
        assert.strictEqual(query('cbrt()')(2), Math.cbrt(2));
    });
    it('ceil', () => {
        assert.strictEqual(query('ceil()')(2.123), 3);
    });
    it('clz32', () => {
        assert.strictEqual(query('clz32()')(2), Math.clz32(2));
    });
    it('cos', () => {
        assert.strictEqual(query('cos()')(2), Math.cos(2));
    });
    it('cosh', () => {
        assert.strictEqual(query('cosh()')(2), Math.cosh(2));
    });
    it('exp', () => {
        assert.strictEqual(query('exp()')(2), Math.exp(2));
    });
    it('expm1', () => {
        assert.strictEqual(query('expm1()')(2), Math.expm1(2));
    });
    it('floor', () => {
        assert.strictEqual(query('floor()')(2.123), 2);
    });
    it('fround', () => {
        assert.strictEqual(query('fround()')(5), 5);
        assert.strictEqual(query('fround()')(5.5), 5.5);
        assert.strictEqual(query('fround()')(5.05), 5.050000190734863);
        assert.strictEqual(query('fround()')(-5.05), -5.050000190734863);
    });
    it('hypot', () => {
        assert.strictEqual(query('hypot()')(2), Math.hypot(2));
    });
    it('imul', () => {
        assert.strictEqual(query('imul()')(2), 0);
        assert.strictEqual(query('imul(2)')(2), 4);
    });
    it('log', () => {
        assert.strictEqual(query('log()')(2), Math.log(2));
    });
    it('log10', () => {
        assert.strictEqual(query('log10()')(2), Math.log10(2));
    });
    it('log1p', () => {
        assert.strictEqual(query('log1p()')(2), Math.log1p(2));
    });
    it('log2', () => {
        assert.strictEqual(query('log2()')(2), Math.log2(2));
    });
    it('pow', () => {
        assert.strictEqual(query('pow()')(2), Math.pow(2));
        assert.strictEqual(query('pow(3)')(2), Math.pow(2, 3));
    });
    it('round', () => {
        assert.strictEqual(query('round()')(2.123), 2);
        assert.strictEqual(query('round()')(2.89), 3);
    });
    it('sign', () => {
        assert.strictEqual(query('sign()')(2), 1);
        assert.strictEqual(query('sign()')(-2), -1);
    });
    it('sin', () => {
        assert.strictEqual(query('sin()')(2), Math.sin(2));
    });
    it('sinh', () => {
        assert.strictEqual(query('sinh()')(2), Math.sinh(2));
    });
    it('sqrt', () => {
        assert.strictEqual(query('sqrt()')(4), 2);
    });
    it('tan', () => {
        assert.strictEqual(query('tan()')(2), Math.tan(2));
    });
    it('tanh', () => {
        assert.strictEqual(query('tanh()')(2), Math.tanh(2));
    });
    it('trunc', () => {
        assert.strictEqual(query('trunc()')(2.123), 2);
        assert.strictEqual(query('trunc()')(-2.123), -2);
    });
});
