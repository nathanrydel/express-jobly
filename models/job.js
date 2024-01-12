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

  static async create({ title, salary, equity, companyHandle }) {
    const companyCheck = await db.query(`
      SELECT handle
      FROM companies
      WHERE handle =$1`, [companyHandle]);

    if (companyCheck.rows[0]) {
      throw new NotFoundError(`No such company: ${companyHandle}`);
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
                    company_handle AS "companyHandle"`, [
      title,
      salary,
      equity,
      companyHandle,
    ]);

    const job = result.rows[0];

    return job;
  };

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(`
      SELECT id,
             title,
             salary,
             equity,
             company_handle AS "companyHandle"
      FROM jobs
      ORDER BY id
    `);

    return jobsRes.rows;
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
             company_handle AS "companyHandle"
      FROM jobs
      WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No such job: ${id}`);

    return job;
  }
}