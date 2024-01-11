"use strict";

const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate tests", function () {
  test("single change", function () {
    const result = sqlForPartialUpdate(
      { firstName: "edited_value" },
      { firstName: "first_name" }
    );
    expect(result).toEqual({
      setCols: "\"first_name\"=$1",
      values: ["edited_value"]
    });
  });
  //change word change to values
  test("more than one change", function () {
    const result = sqlForPartialUpdate(
      { firstName: "edit_fname", l_name: "edited_lname" },
      { firstName: "first_name", lastName: "last_name" }
    );
    expect(result).toEqual({
      setCols: "\"first_name\"=$1, \"l_name\"=$2",
      values: ["edit_fname", "edited_lname"]
    });
  });
  //can give key/vals to second argument since would still
  // result in same test error
  test("no changes - Error returned", function () {
    expect(() => {
      sqlForPartialUpdate({}, {});
    }).toThrow(BadRequestError);
  });

});