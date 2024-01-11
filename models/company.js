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

  //could combine findAll and findFilteredCompanies and check on query string input
  static async findFilteredCompanies(filterCriteria) {
    //could put _sqlForFilteringCompanies since is an internal function
    const whereStatementSql = this.sqlForFilteringCompanies(filterCriteria);
    const queryStr = `
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        WHERE ${whereStatementSql.whereCols}
        ORDER BY name`;
    const companiesRes = await db.query(queryStr, whereStatementSql.values);
    return companiesRes.rows;
  }

  /** Takes an object of filter criteria and generates corresponding
  * SQL statements for the WHERE clause and sanitizes values
  *
  * dataToFilter: {minEmployees: 2, maxEmployees: 3, nameLike: 'c'}
  *
  * @example {minEmployees: 2, maxEmployees: 3, nameLike: 'c', } =>
  * {
  *    whereCols: '"num_employees" >= $1"',
  *      '"num_employees" <= $2"',
  *       '"name ILIKE $3"'
  *    values: [2, 3, '%c%']
  * }
  */

  static _sqlForFilteringCompanies(dataToFilter) {
    const keys = Object.keys(dataToFilter);
    const sanitizedValues = [];

    const sqlStatements = keys.map(function (key, idx) {
      if (keys[idx] === "minEmployees") {
        sanitizedValues.push(Number(dataToFilter[keys[idx]]));
        return `"num_employees" >= $${idx + 1}`;
      }
      if (keys[idx] === "maxEmployees") {
        sanitizedValues.push(Number(dataToFilter[keys[idx]]));
        return `"num_employees" <= $${idx + 1}`;
      }
      if (keys[idx] === "nameLike") {
        sanitizedValues.push(`%${dataToFilter[keys[idx]]}%`);
        return `"name" ILIKE $${idx + 1}`;
      }
    });

    if (sqlStatements.includes(undefined)) {
      throw new BadRequestError("Bad query param included");
    }

    //could use join to concatenate everything with and between
    let counter = 0;
    while (counter < sqlStatements.length - 1) {
      sqlStatements[counter] += " AND";
      counter += 1;
    }

    return {
      whereCols: sqlStatements.join(" "),
      values: sanitizedValues,
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
