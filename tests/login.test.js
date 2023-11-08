const supertest = require("supertest");

const app = require("../app");
const { connect } = require("./database");
const BlogModel = require("../models/blog");
const UserModel = require("../models/user");

describe("User should be able to signup the route: /v1/signup", () => {
  beforeAll(async () => {
    connection = await connect();
  });
  beforeEach(async () => {
    // create user
    const user = await UserModel.create({
        first_name: 'John',
        last_name: 'Doe',
        email: 'johndoe@example.com',
        password: 'securePassword',
        confirm_password: 'securePassword',
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



  it('should login successfully with correct credientials', async () => {
    const loginUser = {
        email: 'johndoe@example.com',
        password: 'securePassword'
    };

    // Send a POST request with invalid data
    const response = await supertest(app)
      .post('/v1/login')
      .send(loginUser);

    // Assert the response status and error handling
    expect(response.status).toBe(302); // redirects to own tasks page
    expect(response.header['location']).toBe("/blogs/users"); //redirects to own blogs
    
  });

  it('should return an error on wrong login parameters', async () => {
    const loginUser = {
        email: 'johndoe@example.com',
        password: 'wrongPassword'
    };

    // Send a POST request with invalid data
    const response = await supertest(app)
      .post('/v1/login')
      .send(loginUser);

    // Assert the response status and error handling
    expect(response.status).toBe(302); // redirects to own login page with error
    expect(response.header['location']).toBe("/login?error=email%20or%20password%20is%20wrong"); //redirects to login page with error parameters
    
  });
});