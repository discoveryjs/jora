const { Slugger } = require('marked');
const slugger = new Slugger();

module.exports = function(data, { addQueryHelpers }) {
    addQueryHelpers({
        slug(current) {
            return slugger.slug(current, { dryrun: true });
        }
    });
};
