const supertest = require("supertest");
const app = require("../app");
const { connect } = require("./database");
const UserModel = require("../models/user");
const BlogModel = require("../models/blog");

// Test suite
describe("posting blogs", () => {
  let token;
  let user_id;
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

  it("should be able to view login page even when not logged in", async () => {
    const response = await supertest(app)
      .get(`/`)
      .set("Cookie", `user_id=${user_id}`)
      .set("Cookie", `token=${token}`)

    expect(response.status).toBe(200);
    expect(response.text).toContain("<h1>TheBlog</h1>");
  });
});