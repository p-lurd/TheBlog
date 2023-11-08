const supertest = require("supertest");

const app = require("../app");
const { connect } = require("./database");
const UserModel = require("../models/user");

describe('POST /v1/request-reset', () => {
    beforeAll(async () => {
        connection = await connect();
      });
      beforeEach(async () => {
        // create user
        const user = await UserModel.create({
            first_name: 'John',
            last_name: 'Doe',
            email: 'test@example.com',
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
    it('should attempt to send an email to the defined email', async () => {
        const mockValidData = { email: 'test@example.com' };
      const response = await supertest(app)
        .post('/v1/request-reset')
        .send(mockValidData);
  
      expect(response.statusCode).toBe(302);
      expect(response.text).toContain("Found. Redirecting to /");
    });
  
    it('should respond with a 302 redirecting to same page when email is not filled ', async () => {
      const mockInvalidData = {}; // Missing required 'email' field
  
      const response = await supertest(app)
        .post('/v1/request-reset')
        .send(mockInvalidData);
  
      expect(response.statusCode).toBe(302);
      expect(response.text).toContain("Found. Redirecting to /forgot_password?error=%22email%22%20is%20required");
    });
  });
  