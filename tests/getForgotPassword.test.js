const supertest = require("supertest");
const app = require("../app");
const { connect } = require("./database");
const UserModel = require("../models/user");
const BlogModel = require("../models/blog");

// Test suite
describe("posting blogs", () => {
  let connection;
  // before hook
  beforeAll(async () => {
    connection = await connect();
  });

  afterEach(async () => {
    await connection.cleanup();
  });

  // after hook
  afterAll(async () => {
    if (connection) {
      await connection.disconnect();
    }
  });

  it("should be able to view forgot password page", async () => {
    const response = await supertest(app)
      .get(`/forgot_password`)

    expect(response.status).toBe(200);
    expect(response.text).toContain("check your email(including spams) for the link.(expires in 15mins)");
  });
});