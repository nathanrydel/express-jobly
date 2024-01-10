"use strict";

const { sqlForPartialUpdate } = require("./sql");

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

  // SHOULD WE TEST THIS HERE OR IN THE ROUTE TEST

  test("no changes - Error returned", function () {
    expect(() => {
      sqlForPartialUpdate({}, {});
    }).toThrow("No data");
  });

});