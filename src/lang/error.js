export default function createCustomError(name, message, extensions) {
    // use Object.create(), because some VMs prevent setting line/column otherwise
    // (iOS Safari 10 even throws an exception)
    const error = Object.assign(Object.create(SyntaxError.prototype), extensions);
    const errorStack = new Error();

    error.name = name;
    error.message = message;

    Object.defineProperty(error, 'stack', {
        get: function() {
            return (errorStack.stack || '').replace(/^(.+\n){1,3}/, name + ': ' + message + '\n');
        }
    });

    return error;
};
