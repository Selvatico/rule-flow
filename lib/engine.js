'use strict';
const _ = require('lodash');
const vm = require('vm');
const Flow = require('./flow');
const Rule = require('./rule');

/**
 * Main class to manage next functionality:
 *  - initiate a rules
 *  - store rules and their state
 *  - manage rules priority
 *  - expose interface to execute rules for given facts
 * @class
 */
class Engine {

    /**
     * @constructor
     * @param {Array} rules List of JSON rules
     * @param {boolean} [ignoreFactChanges] Options to check if fact changed after rule execution.
     */
    constructor({ rules, ignoreFactChanges = true } = {}) {
        this.rules = [];
        this.activeRules = [];
        this.ignoreFactChanges = ignoreFactChanges;
        this.register(rules);
    }

    /**
     * Remove all rules
     */
    reset() {
        this.rules = [];
        this.activeRules = [];
    }

    /**
     * Add rules or rule to register
     * @param {Array} rules
     */
    register(rules) {
        if (Array.isArray(rules)) {
            rules.forEach((rule) => this.rules.push(new Rule(rule)));
        } else if (rules !== null && typeof(rules) === 'object') {
            this.rules.push(new Rule(rules));
        }

        this.sync();
    }

    sync() {
        this.activeRules = this.rules.filter((rule) => {
            return (rule.on === Rule.State.ON) ? rule : undefined;
        });

        this.activeRules.sort((ruleA, ruleB) => {
            return (ruleA.priority && ruleB.priority) ? ruleA.priority - ruleB.priority : 0;
        });
    }

    /**
     * Run flow with the given fact and apply list of switched "ON" rules
     * @param {object} fact
     * @param {string} group
     * @param {string} name Name of rule to check against
     * @param {string} id
     * @returns {*}
     */
    execute(fact, { group = Rule.NoGroup, name, id } = {}) {
        return (new Flow({ rules: this.findRules({ name, group, id }), fact })).run();
    }

    /**
     * Check one particular rule
     * @param {object} fact Data to check against rule
     * @param {string} name Name of the rule
     * @returns {Promise.<T>}
     */
    executeRule(fact, name) {
        return (new Flow({ rules: this.findRules({ name }), fact })).run();
    }

    /**
     * Find rule by any field in rule definition
     * @param {string} [name]
     * @param {array|string} [group]
     * @param {string} [id]
     * @returns {*}
     */
    findRules({ name, group, id } = {}) {
        // If no conditions given it will search through at all. Even with given conditions look-up takes 3ms.
        return _.filter(this.rules, _.matches(_.pickBy({ name, id, group }, val => !_.isEmpty(val))));
    }

    /**
     * Switch the state of given rule
     * @param state
     * @param filter
     */
    turn(state, filter) {
        this.findRules(filter).forEach((elem, index, arr) => arr[index].on = Rule.State.ON === state);
        this.sync();
    }

    /**
     * Change rule priority on the fly
     * @param {number} priority
     * @param {object} filter
     */
    prioritize(priority, filter) {
        priority = parseInt(priority, 10);
        this.findRules(filter).forEach((elem, index, arr) => arr[index].priority = priority);
        this.sync();
    }

    /**
     * Export list of rules as JSON. Can be used to dump rules to any external storage
     * @returns {Array|*}
     */
    toJSON() {
        if (this.rules instanceof Array) {
            return this.rules.map((rule) => rule.toJSON());
        }
        return this.rules.toJSON();
    }

    /**
     * Import rules to Engine from any external storage
     * @param rules
     */
    fromJSON(rules) {
        let sandbox = {
            condition: undefined,
            consequence: undefined
        };

        this.init();
        if (typeof(rules) === 'string') {
            rules = JSON.parse(rules);
        }
        if (rules instanceof Array) {
            rules = rules.map(function (rule) {
                sandbox = {
                    condition: undefined,
                    consequence: undefined
                };

                vm.runInNewContext('condition = (' + rule.condition + ')', sandbox);
                vm.runInNewContext('consequence = (' + rule.consequence + ')', sandbox);

                rule.condition = sandbox.condition;
                rule.consequence = sandbox.consequence;
                return rule;
            });
        } else if (rules !== null && typeof(rules) === 'object') {
            vm.runInNewContext('condition = (' + rules.condition + ')', sandbox);
            vm.runInNewContext('consequence = (' + rules.consequence + ')', sandbox);

            rules.condition = sandbox.condition;
            rules.consequence = sandbox.consequence;
        }
        this.register(rules);
    }
}

module.exports = Engine;