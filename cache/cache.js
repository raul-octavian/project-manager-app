const NodeCache = require('node-cache');
// stdTTL is the default time-to-live for each cache entry
const cache = new NodeCache({ stdTTL: 360000 });

module.exports = cache;