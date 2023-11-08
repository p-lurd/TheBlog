const supertest = require("supertest");
const app = require("../app");
const { connect } = require("./database");
const UserModel = require("../models/user");
const BlogModel = require("../models/blog");

// Test suite
describe("posting blogs", () => {
  let token;
  let _id = "12";
  let user_id = "12";
  let connection;
  // before hook
  beforeAll(async () => {
    connection = await connect();
  });

  beforeEach(async () => {
    // create user
    const user = await UserModel.create({
      _id: "12",
      first_name: "John",
      last_name: "Doe",
      email: "test@example.com",
      password: "securePassword",
      confirm_password: "securePassword",
    });
    // login user
    const response = await supertest(app)
      .post("/v1/login")
      .set("content-type", "application/json")
      .send({
        email: "test@example.com",
        password: "securePassword",
      });
    const setCookieHeader = response.headers["set-cookie"];

    if (setCookieHeader) {
      const tokenCookie = setCookieHeader
        .map((cookie) => cookie.split(";")[0])
        .find((cookie) => cookie.startsWith("token="));

      if (tokenCookie) {
        token = tokenCookie.split("=")[1]; // Extract the token valu
      } else {
        // Handle the case where the 'token' cookie is not found
        console.error("Token cookie not found in the response headers.");
      }
    } else {
      // Handle the case where the 'set-cookie' header is not present in the response
      console.error("'set-cookie' header is not present in the response.");
    }

    const blog = await BlogModel.create({
      _id,
      title: "Test Blog",
      description: "This is a test blog",
      body: "Test blog content",
      tags: "test",
      user_id,
      author: "Test",
      timestamp: "11",
      read_count: "1",
      reading_time: "1",
    });
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

  it("should be able to edit a single blog post", async () => {
    const response = await supertest(app)
      .post(`/blogs/user/edit`)
      .set("Cookie", `user_id=${user_id}`)
      .set("Cookie", `token=${token}`)
      .send({
        _id,
      title: "Test Blog",
      description: "This is a test blog",
      body: "Edited content",
      tags: "test"
      })

    expect(response.status).toBe(302);
    expect(response.text).toContain("Found. Redirecting to /blogs/users");
    expect(response.header['location']).toBe("/blogs/users");
  });

  it("should not be able to edit a single blog post with missing parameters(e.g. content", async () => {
    const response = await supertest(app)
      .post(`/blogs/user/edit`)
      .set("Cookie", `user_id=${user_id}`)
      .set("Cookie", `token=${token}`)
      .send({
        _id,
      title: "Test Blog",
      description: "This is a test blog",
      tags: "test"
      })

    expect(response.status).toBe(302);
    expect(response.text).toContain("Found. Redirecting to /blogs/user/12?error=%22body%22%20is%20required");
    expect(response.header['location']).toBe("/blogs/user/12?error=%22body%22%20is%20required");
  });
});