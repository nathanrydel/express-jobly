"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */


// CREATE TABLE jobs (
//   id SERIAL PRIMARY KEY,
//   title TEXT NOT NULL,
//   salary INTEGER CHECK (salary >= 0),
//   equity NUMERIC CHECK (equity <= 1.0),
//   company_handle VARCHAR(25) NOT NULL
//     REFERENCES companies ON DELETE CASCADE
// );

describe("create", function () {
  const newJob = {
    title: "job",
    salary: 1000,
    equity: "0.5",
    company_handle: "c1",
  };
  test("creating a job in the database", async function () {
    const job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "job",
      salary: 1000,
      equity: "0.5",
      company_handle: "c1",
    });

    const result = await db.query(
      `
      SELECT id, title, salary, equity, company_handle
      FROM jobs
      WHERE id=$1;
      `, [job.id]
    );

    expect(result.rows[0]).toEqual({
      id: expect.any(Number),
      title: "job",
      salary: 1000,
      equity: "0.5",
      company_handle: "c1",
    });
  });

  test(
    "fail creating a job when company handle does not exist",
    async function () {
      const invalidJob = {
        title: "job",
        salary: 1000,
        equity: "0.5",
        company_handle: "error",
      }
      expect(async () =>
        await Job.create(invalidJob))
        .toThrow(BadRequestError);
    });
});










/************************************** get */









/************************************** update */








/************************************** remove */