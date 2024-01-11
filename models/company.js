"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(`
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`, [
      handle,
      name,
      description,
      numEmployees,
      logoUrl,
    ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        ORDER BY name`);
    return companiesRes.rows;
  }

  /** Find all companies according to the filtered criteria
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   */
  static async findFilteredCompanies(filterCriteria) {
    const whereStatementSql = this.sqlForFilteringCompanies(filterCriteria);
    console.log("this is whereStmtSql", whereStatementSql);
    const queryStr = `
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        WHERE ${whereStatementSql.whereCols}
        ORDER BY name`;
    // console.log("this is queryStr", queryStr);
    const companiesRes = await db.query(queryStr, [whereStatementSql.values]);
    return companiesRes.rows;
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
  static sqlForFilteringCompanies(dataToFilter) {
    // if (keys.length === 0) return;
    // console.log("this is dataToFilter", dataToFilter);
    const keys = Object.keys(dataToFilter);
    console.log("this is keys", keys);
    const unfilteredCols = keys.map(function (key, idx) {
      if (keys[idx] === "minEmployees") {
        return `num_employees >= $${idx + 1}`;
      }
      if (keys[idx] === "maxEmployees") {
        return `num_employees <= $${idx + 1}`;
      }
      if (keys[idx] === "nameLike") {
        return `name ILIKE $${idx + 1}`;
      }
    });

    const cols = unfilteredCols.filter(col => col !== undefined);

    // const cols = [];
    // const parameterizedValues = [];
    // for(let i = 0; i < keys.length; i++){
    //   if (keys[i] === "minEmployees") {
    //     cols.push(`num_employees >= $${i + 1}`);
    //     parameterizedValues.push(keys[i]);
    //   }
    //   if (keys[i] === "maxEmployees") {
    //     console.log("hiiiiiiiiiiiii");
    //     cols.push(`num_employees <= $${i + 1}`);
    //     parameterizedValues.push(keys[i]);
    //   }
    //   if (keys[i] === "nameLike") {
    //     console.log("testtttttttttttt");
    //     cols.push(`name ILIKE $${idx + 1}`);
    //     parameterizedValues.push(`%${keys[i]}%`);
    //   }
    //   // else{
    //   //   continue;
    //   // }
    // }
    console.log('cols', cols);
    // console.log('parameterizedValues', parameterizedValues);
    let counter = 0;
    while (counter < cols.length - 1) {
      cols[counter] += " AND";
      counter += 1;
    }
    return {
      whereCols: cols.join(" "),
      values: Object.values(dataToFilter),
      // values: parameterizedValues
    };
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        WHERE handle = $1`, [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(`
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`, [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
