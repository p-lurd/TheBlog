const supertest = require("supertest");
const moment = require('moment');
const app = require("../app");
const { connect } = require("./database");
const UserModel = require("../models/user");
const { updateOne } = require("../models/blog");

describe('POST /v1/request-reset', () => {
    let token = '123456qwerty';
    let timestamp = moment().format();
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
            resetToken: token,
            resetTime:  timestamp,
            token
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
      it('should handle valid password reset request', async () => {
        const newPassword = 'new_password';
    
        const response = await supertest(app)
          .post(`/v1/reset/${token}`)
          .send({ password: newPassword, repeat_password: newPassword, urlSafeToken: encodeURIComponent(token) });
    
        expect(response.status).toBe(302);
        expect(response.header['location']).toBe('/login');
      });

      it('should handle invalid password reset request', async () => {
        const invalidToken = 'invalid_reset_token';
        const newPassword = 'new_password';
    
        const response = await supertest(app)
          .post(`/v1/reset/${invalidToken}`)
          .send({ password: newPassword, repeat_password: newPassword, urlSafeToken: invalidToken });
    
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('link is wrong or already used');
      });
    });
    