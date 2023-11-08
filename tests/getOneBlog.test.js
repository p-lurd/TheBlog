const supertest = require("supertest");

const app = require("../app");
const { connect } = require("./database");
const BlogModel = require("../models/blog");

describe("GET one blog to read via the route: /blog/:_id", () => {
  beforeAll(async () => {
    connection = await connect();
  });
  beforeEach(async () => {
    // create user
    const blog = await BlogModel.create({
      _id: "12345",
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

  it('responds with a page of a single blog', async () => {
    // Using supertest to make a GET request to the route
    const res = await supertest(app).get("/blog/12345");

    // checking the response status code
    expect(res.status).toBe(201);
    expect(res.text).toContain("Eating fish")
  });

});