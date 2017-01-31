const moment = require('moment');
const _ = require('lodash');

module.exports = {
    _convertDate(value) {
        return value instanceof Date ? moment(value) : moment(value, 'YYYY-MM-DD HH:mm:ss');
    },
    /**
     * Check if given date in interval relatively to current date
     * @param {string} date  Given date
     * @param {number} days Number of days to calculate interval from today
     * @returns {*}
     */
    dateIsBetween(date, days) {
        date = this._convertDate(date);
        if (date.isValid() === false) {
            throw new Error('testValue should be a date which is accepted by moment.js');
        }

        days = parseInt(days, 10);

        if (days < 0) {
            return date.isBetween(moment().subtract(Math.abs(days), 'day'), moment());
        }
        return date.isBetween(moment(), moment().add(Math.abs(days), 'day'));
    },
    /**
     * Check if date greater than amount of days
     * @param {string} date Date to test
     * @param {number} [days] Amount of days to test
     * @returns {boolean}
     */
    dateGreater(date, days) {
        date = this._convertDate(date);
        if (date.isValid() === false) {
            throw new Error('Date value should be a date which is accepted by moment.js');
        }
        if (days) {
            return date.diff(days, 'days') > 0;
        }
        return date.diff(moment(), 'days') > 0;
    },

    /**
     * Array should include toFind or at least one value from toFind elements
     * @param {Array.<*>} values
     * @param {*|Array.<*>} toFind
     */
    includesValue(values, toFind) {
        if (!(values instanceof Array)) {
            throw new Error('Values should be instance of Array');
        }
        const toFindArr = _.isArray(toFind) ? toFind : [toFind];
        // find at least one match in values array
        return values.some(value => toFindArr.includes(value));
    }
};
