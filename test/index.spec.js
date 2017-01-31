/*eslint no-unused-vars:0*/
'use strict';

const chai = require('chai');
const expect = chai.expect;
const Hapi = require('hapi');
const Promise = require('bluebird');
const R = require('../lib/engine');

chai.use(require('chai-as-promised'));

describe('Flow plugin', function () {
    let server;

    before(() => {
        return new Promise((resolve) => {
            server = new Hapi.Server();
            server.connection();
            server.register({ register: FlowPlugin, options }, {}, function () {
                resolve();
            });
        });
    });

    it('server expose R instance', function () {
        return new Promise((resolve) => {
            expect(server.plugins.flow.R).to.be.an.instanceof(R);
            resolve();
        });
    });

    it('server expose "execute" method', function () {
        expect(typeof server.plugins.flow.execute).to.be.equal('function');
    });
});