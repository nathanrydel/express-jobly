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

//add a helper function for sqlForFiltering where we convert the query
//params passed in to a parameterized sql query
/**
 * dataToFilter: {minEmployees: 2, maxEmployees: 3, nameLike: 'c'}
 * queryToParams: {num_employees, name}
 *
  @example {minEmployees: 2, maxEmployees: 3, nameLike: 'c', } =>
 *  {
 *    whereCols: '"num_employees" >= $1"',
 *      '"num_employees" <= $2"',
 *       '"name ILIKE $3"'
 *    values: [2, 3, '%c%']
 * }
 */
function sqlForFilteringCompanies(dataToFilter){
  const keys = Object.keys(dataToUpdate);
  // if (keys.length === 0) return;




}

module.exports = { sqlForPartialUpdate };
