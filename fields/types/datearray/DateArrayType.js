var FieldType = require('../Type');
var moment = require('moment');
var util = require('util');
var utils = require('keystone-utils');

/**
 * Date FieldType Constructor
 * @extends Field
 * @api public
 */
function datearray (list, path, options) {
	this._nativeType = [Date];
	this._defaultSize = 'medium';
	this._underscoreMethods = ['format'];
	this._properties = ['formatString'];
	this.parseFormatString = options.parseFormat || 'YYYY-MM-DD';
	this.formatString = (options.format === false) ? false : (options.format || 'Do MMM YYYY');
	if (this.formatString && typeof this.formatString !== 'string') {
		throw new Error('FieldType.Date: options.format must be a string.');
	}
	this.separator = options.separator || ' | ';
	datearray.super_.call(this, list, path, options);
}
util.inherits(datearray, FieldType);

/**
 * Formats the field value
 */
datearray.prototype.format = function (item, format, separator) {
	var value = item.get(this.path);
	if (format || this.formatString) {
		value = value.map(function (d) {
			return moment(d).format(format || this._formatString);
		});
	}
	return value.join(separator || this.separator);
};

/**
 * Asynchronously confirms that the provided value is valid
 */
datearray.prototype.validateInput = function (data, callback) {
	var value = this.getValueFromData(data);
	var result = true;
	if (value !== undefined) {
		if (!Array.isArray(value)) {
			value = [value];
		}
		for (var i = 0; i < value.length; i++) {
			if (!moment(value[i], this.parseFormatString).isValid()) {
				result = false;
				break;
			}
		}
	}
	utils.defer(callback, result);
};

/**
 * Asynchronously confirms that the a value is present
 */
datearray.prototype.validateRequiredInput = function (item, data, callback) {
	var value = this.getValueFromData(data);
	var result = false;
	if (value === undefined) {
		if (item.get(this.path) && item.get(this.path).length) {
			result = true;
		}
	} else if (typeof value === 'string' || typeof value === 'number' || Array.isArray(value) && value.length) {
		result = true;
	}
	utils.defer(callback, result);
};

/**
 * Checks that a valid array of dates has been provided in a data object
 * An empty value clears the stored value and is considered valid
 *
 * Deprecated
 */
datearray.prototype.inputIsValid = function (data, required, item) {

	var value = this.getValueFromData(data);
	var parseFormatString = this.parseFormatString;

	if (typeof value === 'string') {
		if (!moment(value, parseFormatString).isValid()) {
			return false;
		}
		value = [value];
	}

	if (required) {
		if (value === undefined && item && item.get(this.path) && item.get(this.path).length) {
			return true;
		}
		if (value === undefined || !Array.isArray(value)) {
			return false;
		}
		if (Array.isArray(value) && !value.length) {
			return false;
		}
	}

	if (Array.isArray(value)) {
		// filter out empty fields
		value = value.filter(function (date) {
			return date.trim() !== '';
		});
		// if there are no values left, and requried is true, return false
		if (required && !value.length) {
			return false;
		}
		// if any date in the array is invalid, return false
		if (value.some(function (dateValue) { return !moment(dateValue, parseFormatString).isValid(); })) {
			return false;
		}
	}

	return (value === undefined || Array.isArray(value));

};


/**
 * Updates the value for this field in the item from a data object
 */
datearray.prototype.updateItem = function (item, data, callback) {

	var value = this.getValueFromData(data);

	if (value !== undefined) {
		if (Array.isArray(value)) {
			// Only save valid dates
			value = value.filter(function (date) {
				return moment(date).isValid();
			});
		}
		if (value === null) {
			value = [];
		}
		if (typeof value === 'string') {
			if (moment(value).isValid()) {
				value = [value];
			}
		}
		if (Array.isArray(value)) {
			item.set(this.path, value);
		}
	}

	process.nextTick(callback);
};

/* Export Field Type */
module.exports = datearray;
