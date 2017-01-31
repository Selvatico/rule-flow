'use strict';
const Promise = require('bluebird');
const _ = require('lodash');
const debug = require('debug')('flow:execution');
const results = require('./results');
const s = require('ansi-styles');

/**
 * Class to manage rules execution sessions.
 * Apply list of given rules to fact and manage execution flow e.g. next, restart, stop etc.
 * For every new run used new instance of flow to have different flow executions in memory in parallel.
 */
class Flow {
    /**
     * @constructor
     * @param {Array} rules List of rules to apply
     * @param {boolean} ignoreFactChanges If we need to track changes after every rule. Used to restart the flow in case of changes
     * @param {object} fact Data which we need pass through the rules to check
     * @param {boolean} debug If we need to output to console path and other debug information
     */
    constructor({ rules, ignoreFactChanges = true, fact, debug = true }) {
        // Copy rules to property to be independent from any other flow session changes
        this.rules = _.clone(rules);
        this.fact = fact;
        this.matchPath = [];
        this.executionPath = [];
        this.debug = debug;
        this.ignoreFactChanges = ignoreFactChanges;
        this.complete = false;
        this.session = (fact);
        this.lastSession = null;
        this.index = 0;
        // we don't need to track it and copy to memory in case tracking disabled
        if (!this.ignoreFactChanges) {
            this.lastSession = _.clone(fact);
        }
    }

    [Symbol.iterator]() {
        let executionRounds = 0;

        return {
            next: () => {
                if (executionRounds > this.rules.length + 10) {
                    throw Error(`Infinite cycle detected.
                        Rules in flow ${this.rules.length}.
                        Execution rounds: ${executionRounds}
                        Execution path: ${this.executionPath.join(' --> ')}`);
                }

                if (this.index < this.rules.length && !this.complete) {
                    executionRounds++;
                    return { value: this.rules[this.index++], done: false };
                }

                return { done: true, value: undefined };
            }
        };
    }

    /**
     * Used inside rule to say that rule condition met and to track execution path
     */
    matched() {
        this.matchPath.push(this.rules[this.index].id || this.rules[this.index].name);
    }

    /**
     * Reset current index to start flow from beginning
     */
    restart() {
        this.index = 0;
    }

    /**
     * Mark flow as finished. Use case: Rule can call it method inside to stop execution next rule and return result
     */
    stop() {
        this.complete = true;
    }

    /**
     * Move index to next element
     */
    next() {
        this.index++;
    }

    /**
     * Jump to specific rule to change flow execution on the fly
     * @param name
     */
    jumpTo(name) {
        let index = this.rules.findIndex((rule, index) => rule.name === name);

        if (index !== -1) {
            this.index = index;
            this.executionPath.push('jump');
        } else {
            throw Error('Rule to jump in is not found');
        }
    }

    /**
     * Factory method to create result
     * @param type
     * @param options
     */
    result(type, options) {
        if (!results[type]) {
            throw new Error(`Result type ${type} is not defined`);
        }

        return new results[type](options, this.session);
    }

    /**
     * Execute the flow and return the Promise with resolve on the end of the flow
     * @returns {*}
     */
    run() {
        debug(`Flow data: ${JSON.stringify(this.session)}`);

        return Promise.coroutine(function*() {
            let result = { fact: this.session, matchPath: this.matchPath, result: null, lastMatched: null };

            for (let rule of this) {
                let ruleId = rule.getIdentifier();
                this.executionPath.push(ruleId);
                // Condition could be simple function or promise based
                if (yield rule.condition(this.session, this)) {
                    // Run consequence to grab the result. Wrapping to promise because could be Promise bases.
                    result.result = yield rule.consequence(this.session, this);
                    result.lastMatched = ruleId;
                    this.matchPath.push(ruleId);
                }
                // Need to use only in special cases to not overload memory with inneeded objects.
                if (!this.ignoreFactChanges && !_.isEqual(this.lastSession, session)) {
                    this.lastSession = _.clone(this.session);
                    this.restart();
                }
            }
            debug(`Match path: ${this.matchPath.join(` ${s.green.open}-->${s.green.close} `)}`);
            debug(`Execution path: ${this.executionPath.join(` ${s.red.open}-->${s.red.close} `)}`);

            return result;
        }).bind(this)();
    }
}

module.exports = Flow;