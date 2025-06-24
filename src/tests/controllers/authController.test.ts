import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../../../src/models/User';
import authRoutes from '../../../src/routes/authRoutes';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        password: 'testpassword123',
        role: 'admin'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered');
      expect(response.body.user).toMatchObject({
        username: userData.username,
        role: userData.role
      });
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned

      // Verify user was created in database
      const dbUser = await User.findOne({ username: userData.username });
      expect(dbUser).toBeTruthy();
      expect(dbUser!.username).toBe(userData.username);
      expect(dbUser!.role).toBe(userData.role);
      
      // Verify password was hashed
      const isPasswordHashed = await bcrypt.compare(userData.password, dbUser!.password);
      expect(isPasswordHashed).toBe(true);
    });

    it('should default to admin role when no role is specified', async () => {
      const userData = {
        username: 'testuser2',
        password: 'testpassword123'
        // No role specified
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.role).toBe('admin'); // Default role
    });

    it('should handle registration errors gracefully', async () => {
      // First, create a user
      await User.create({
        username: 'existinguser',
        password: await bcrypt.hash('password', 10),
        role: 'admin'
      });

      // Try to register with the same username
      const duplicateUserData = {
        username: 'existinguser',
        password: 'newpassword123',
        role: 'teacher'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUserData)
        .expect(500);

      expect(response.body.error).toBe('Registration failed');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      await User.create({
        username: 'loginuser',
        password: hashedPassword,
        role: 'admin'
      });
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        username: 'loginuser',
        password: 'testpassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');

      // Verify the token is valid
      const decoded = jwt.verify(response.body.token, JWT_SECRET) as any;
      expect(decoded.role).toBe('admin');
      expect(decoded.userId).toBeDefined();
      expect(decoded.exp).toBeDefined(); // Token should have expiration
    });

    it('should return 404 for non-existent user', async () => {
      const loginData = {
        username: 'nonexistentuser',
        password: 'testpassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should return 401 for incorrect password', async () => {
      const loginData = {
        username: 'loginuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should handle login errors gracefully', async () => {
      // Send request with missing data
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(500);

      expect(response.body.error).toBe('Login failed');
    });
  });

  describe('Token Functionality', () => {
    it('should generate tokens with correct payload structure', async () => {
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const user = await User.create({
        username: 'tokenuser',
        password: hashedPassword,
        role: 'teacher'
      });

      const loginData = {
        username: 'tokenuser',
        password: 'testpassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      const decoded = jwt.verify(response.body.token, JWT_SECRET) as any;
      
      expect(decoded.userId).toBe(user._id.toString());
      expect(decoded.role).toBe('teacher');
      expect(decoded.iat).toBeDefined(); // Issued at
      expect(decoded.exp).toBeDefined(); // Expires at
      
      // Verify token expires in 1 day (86400 seconds)
      const expectedExpiry = decoded.iat + 86400;
      expect(decoded.exp).toBe(expectedExpiry);
    });
  });
});