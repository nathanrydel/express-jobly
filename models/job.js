"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if job already in database.
   *
   */

  static async create({ title, salary, equity, company_handle }) {
    const companyCheck = await db.query(`
      SELECT handle
      FROM companies
      WHERE handle =$1`, [company_handle]);

    if (!companyCheck.rows[0]) {
      throw new NotFoundError(`No such company: ${company_handle}`);
    }

    const result = await db.query(`
                INSERT INTO jobs (title,
                                  salary,
                                  equity,
                                  company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id,
                    title,
                    salary,
                    equity,
                    company_handle`, [
      title,
      salary,
      equity,
      company_handle,
    ]);

    const job = result.rows[0];

    return job;
  };

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(`
      SELECT id,
             title,
             salary,
             equity,
             company_handle
      FROM jobs
      ORDER BY id
    `);

    return jobsRes.rows;
  }

  /** Create WHERE clause for filters, to be used by functions that query
 * with filters.
 *
 * searchFilters (all optional):
 * - minSalary
 * - hasEquity
 * - title (will find case-insensitive, partial matches)
 *
 * Returns {
 *  where: "WHERE minSalary >= $1 AND title ILIKE $2",
 *  vals: [10000, '%Engineer%']
 * }
 */

  static _filterWhereBuilder({ minSalary, hasEquity, title }) {
    let whereParts = [];
    let vals = [];

    if (minSalary !== undefined) {
      vals.push(minSalary);
      whereParts.push(`salary >= $${vals.length}`);
    }

    if (hasEquity === true) {
      whereParts.push(`equity > 0`);
    }

    if (title !== undefined) {
      vals.push(`%${title}%`);
      whereParts.push(`title ILIKE $${vals.length}`);
    }

    const where = (whereParts.length > 0) ?
      "WHERE " + whereParts.join(" AND ")
      : "";

    return { where, vals };
  }

  /** TODO:  Find all jobs according to the filtered criteria*/

  /** TODO:  Takes an object of filter criteria and generates corresponding
  * SQL statements for the WHERE clause and sanitizes values
  * */

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

  static async get(id) {
    const jobRes = await db.query(`
      SELECT id,
             title,
             salary,
             equity,
             company_handle
      FROM jobs
      WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No such job: ${id}`);

    return job;
  }
}
module.exports = Job;