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

  it('should be able to signup a user', async () => {
    const userData = {
        first_name: "Tolu",
        last_name: "Tolu",
        email: "tolu@gmail.com",
        password: "12345",
        confirm_password: "12345"
      };
    // Using supertest to make a GET request to the route
    const res = await supertest(app)
    .post("/v1/signup").send(userData);

    // checking the response status code
    expect(res.status).toBe(302);
    expect(res.text).toContain("Found. Redirecting to /login");
  });

  it('should handle invalid user data', async () => {
    const invalidUserData = {
      first_name: 'John',
      // Missing last_name, email, password, confirm_password
    };

    // Send a POST request with invalid data
    const response = await supertest(app)
      .post('/v1/signup')
      .send(invalidUserData);

    // Assert the response status and error handling
    expect(response.status).toBe(302); // redirects back to the signup page
    expect(response.header['location']).toBe("/signup?error=%22last_name%22%20is%20required"); // passes the first error encountered(absent last_naame) so as to render it
    
  });

  it('should handle duplicate user creation', async () => {
    const userData = {
        first_name: 'John',
      last_name: 'Doe',
      email: 'johndoe@example.com', // An email that already exists
      password: 'securePassword',
      confirm_password: 'securePassword',
      };

    // Sending a POST request with duplicate user data
    const response = await supertest(app)
      .post('/v1/signup')
      .send(userData);

    // Asserting the response status and error handling
    expect(response.status).toBe(302); // redirects to signup page to display error message and user retries
    expect(response.header['location']).toBe("/signup?error=User%20already%20exists"); // Passes the eror ecountered in header for rendering

  });
});