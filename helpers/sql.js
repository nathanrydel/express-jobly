"use strict";

const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/**
 * Helper function to make updates to database based on variatic input
 *
 * @param {Object} dataToUpdate - the data that you want to edit
 * @param {Object} jsToSql - A JS syntax key with the database col as a value
 * @returns {Object} -
 *  {
 *   setCols: the sql needed to update a col,
 *   values: array of values used in sanitize statement
 * }
 *
 * @example {firstName: 'Aliya', age: 32} =>
 *  {
 *    setCols: '"first_name"=$1', '"age"=$2'
 *    values: ['Aliya', 32]
 * }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
