/*eslint no-unused-vars:0*/
'use strict';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));
const Promise = require('bluebird');

describe('Rules engine: Flow', function () {
    describe('reply', () => {
        beforeEach(() => {
            return Promise.resolve();
        });

        it('it for Flow', () => {
            expect(true).to.be.equal(true);
        });
    });
});
