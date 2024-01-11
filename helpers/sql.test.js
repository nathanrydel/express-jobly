"use strict";

const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate tests", function () {
  test("single value to parse", function () {
    const result = sqlForPartialUpdate(
      { firstName: "edited_value" },
      { firstName: "first_name" }
    );
    expect(result).toEqual({
      setCols: "\"first_name\"=$1",
      values: ["edited_value"]
    });
  });

  test("more than one value to parse", function () {
    const result = sqlForPartialUpdate(
      { firstName: "edit_fname", l_name: "edited_lname" },
      { firstName: "first_name", lastName: "last_name" }
    );
    expect(result).toEqual({
      setCols: "\"first_name\"=$1, \"l_name\"=$2",
      values: ["edit_fname", "edited_lname"]
    });
  });

  test("no values to parse - Error returned", function () {
    expect(() => {
      sqlForPartialUpdate({}, { firstName: "first_name", age: "age" });
    }).toThrow(BadRequestError);
  });

});