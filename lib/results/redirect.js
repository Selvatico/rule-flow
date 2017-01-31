'use strict';
const debug = require('debug')('flow:results');

class Redirect {
    constructor({ url }) {
        this.type = 'REDIRECT';
        this.url = url;
    }

    get isUrl() {
        return true;
    }

    isTo(url) {
        const urlArr = Array.isArray(url) ? url : [url];

        return urlArr.some(url => url === this.url);
    }

    run(request, reply) {
        debug(`Rule filed and redirect to: ${this.url}`);
        return reply.redirect(this.url);
    }
}

module.exports = Redirect;