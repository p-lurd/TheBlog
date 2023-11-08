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

  it("should be able to view reset token page", async () => {
    const resetToken = '12345';
    const error = 'invalid token';
    const response = (await supertest(app)
    .get(`/reset/${encodeURIComponent(resetToken)}`))
    

    expect(response.status).toBe(200);
    expect(response.text).toContain("check your email(including spams) for the link.(expires in 15mins)");
  });
});