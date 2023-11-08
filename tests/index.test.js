const supertest = require("supertest");

const app = require("../app");
const { connect } = require("./database");
const BlogModel = require("../models/blog");

describe("GET /", () => {
  beforeAll(async () => {
    connection = await connect();
  });
  beforeEach(async () => {
    // create user
    const blog = await BlogModel.create({
      title: "Eating fish",
      description: "How to eat fish",
      tags: "eat",
      author: "Tolu",
      body: "Eating fishes takes great patience",
      user_id: "1234",
      reading_time: 1,
      timestamp: new Date(),
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

  it('responds with a rendered "index" template', async () => {
    // Using supertest to make a GET request to the route
    const response = await supertest(app).get("/");

    // checking the response status code
    expect(response.status).toBe(200);
  });

  it('responds with a rendered "notFound" template when callng a route that does not exist', async () => {
    const response = await supertest(app).get("/undefined");
    expect(response.status).toBe(404);
    // because of redirecting
  });
});
