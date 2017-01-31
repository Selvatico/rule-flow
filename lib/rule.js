'use strict';
const uuid = require('node-uuid');
const Promise = require('bluebird');
const helpers = require('./helper');
const Hoek = require('hoek');

class Rule {
    /**
     * @constructor
     * @param {string} [name] Unique name of the rule to track
     * @param {string} [id]
     * @param {function} condition Function which will check some condition
     * @param {function} consequence Function to execute of condition met
     * @param {number} priority Order for rule
     * @param {string} on State by default for this rule
     * @param {string} group Rule group by attached flow
     */
    constructor({ name = '', id = uuid.v4(), condition, consequence, priority = 100, on = Rule.State.ON, group = Rule.NoGroup }) {
        Hoek.assert(typeof consequence === 'function', `Rule ${name} missing consequence or it is not a function`);
        Hoek.assert(typeof condition === 'function', `Rule ${name} missing condition or it is not a function`);

        this.name = name;
        this.id = id;
        this._condition = condition;
        this._consequence = consequence;
        this.priority = priority;
        this.on = on;
        /**
         * @type {array}
         * @private
         */
        this.group = group;
    }

    /**
     * @return {string}
     */
    static get NoGroup() {
        return 'none';
    }

    /**
     * Some rules could be switched off for some period of time.
     * @returns {{ON: string, OFF: string}}
     * @constructor
     */
    static get State() {
        return { ON: 'ON', OFF: 'OFF' };
    }

    static get helpers() {
        return helpers;
    }

    get helpers() {
        return Rule.helpers;
    }

    /**
     * Get either id or name from rule to track it
     * @returns {string|*}
     */
    getIdentifier() {
        return this.name || this.id;
    }

    /**
     * Execute some transformation or code if rule matched. Could be promise based
     * @param {object} session Flow session
     * @param {Flow} flow Instance of the flow in which this rule is now running in
     * @returns {Promise.<T>}
     */
    consequence(session, flow) {
        return Promise.try(() => this._consequence(session, flow));
    }

    /**
     * Run internal
     * @param {object} session Flow session
     * @param {Flow} flow Instance of the flow in which this rule is now running in
     * @returns {Promise.<T>}
     */
    condition(session, flow) {
        return Promise.try(() => this._condition(session, flow));
    }

    /**
     * Export to store in any way as JSON or MongoDB record
     * @returns {{consequence: (string|*|String), condition: (string|*|String)}}
     */
    toJSON() {
        return {
            consequence: this._consequence.toString(),
            condition: this._condition.toString()
        };
    }
}

module.exports = Rule;
