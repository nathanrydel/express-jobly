"use strict";

const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate tests", function () {
  test("working correctly", function () {
    const result = sqlForPartialUpdate(
      { firstName: "edited_value" },
      { firstName: "first_name", lastName: "last_name" }
    );

    expect(result).toEqual({
      setCols: "\"first_name\"=$1",
      values: ["edited_value"]
    });
  }

  );

});