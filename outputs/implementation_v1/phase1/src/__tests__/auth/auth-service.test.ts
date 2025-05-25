import path from 'path';
import fs from 'fs';
import { Storage } from '../../utils/storage';
import { AuthService } from '../../utils/auth/auth-service';
import { UserRole } from '../../utils/auth/types';

// Create a temporary test directory
const testDir = path.join(__dirname, '../../../temp-test-auth');

describe('Auth Service', () => {
  let storage: Storage;
  let authService: AuthService;

  beforeAll(() => {
    // Set up the storage and auth service with test directory
    storage = new Storage(testDir);
    authService = new AuthService(storage);
  });

  afterAll(() => {
    // Clean up test directory after tests
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should register a new user', () => {
    const registrationData = {
      username: 'testuser',
      password: 'password123',
      displayName: 'Test User',
      role: UserRole.Parent,
    };

    const result = authService.register(registrationData);

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.user?.username).toBe('testuser');
    expect(result.user?.displayName).toBe('Test User');
    expect(result.user?.role).toBe(UserRole.Parent);
  });

  it('should not register a user with an existing username', () => {
    const registrationData = {
      username: 'testuser', // Same username as previous test
      password: 'anotherpassword',
      displayName: 'Another User',
      role: UserRole.Child,
    };

    const result = authService.register(registrationData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Username already exists');
  });

  it('should successfully log in a registered user', () => {
    const credentials = {
      username: 'testuser',
      password: 'password123',
    };

    const result = authService.login(credentials);

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.user?.username).toBe('testuser');
  });

  it('should reject login with invalid credentials', () => {
    const credentials = {
      username: 'testuser',
      password: 'wrongpassword',
    };

    const result = authService.login(credentials);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid username or password');
  });

  it('should validate a valid token', () => {
    // First, register and login a user to get a token
    const registrationData = {
      username: 'tokenuser',
      password: 'tokenpass',
      displayName: 'Token User',
      role: UserRole.Child,
    };

    const registerResult = authService.register(registrationData);
    expect(registerResult.success).toBe(true);
    expect(registerResult.token).toBeDefined();

    // Now validate the token
    const token = registerResult.token?.token as string;
    const user = authService.validateToken(token);

    expect(user).not.toBeNull();
    expect(user?.username).toBe('tokenuser');
  });

  it('should reject an invalid token', () => {
    const user = authService.validateToken('invalid-token');
    expect(user).toBeNull();
  });

  it('should list all registered users', () => {
    const users = authService.listUsers();
    
    // We've registered two users in previous tests
    expect(users.length).toBeGreaterThanOrEqual(2);
    
    // Check that our test users are in the list
    const testUser = users.find(u => u.username === 'testuser');
    const tokenUser = users.find(u => u.username === 'tokenuser');
    
    expect(testUser).toBeDefined();
    expect(tokenUser).toBeDefined();
  });

  it('should log out a user', () => {
    // First, register and login a user to get a token
    const registrationData = {
      username: 'logoutuser',
      password: 'logoutpass',
      displayName: 'Logout User',
      role: UserRole.Parent,
    };

    const registerResult = authService.register(registrationData);
    expect(registerResult.success).toBe(true);
    expect(registerResult.token).toBeDefined();

    // Now logout
    const token = registerResult.token?.token as string;
    const result = authService.logout(token);

    expect(result).toBe(true);

    // The token should no longer be valid
    const user = authService.validateToken(token);
    expect(user).toBeNull();
  });
}); 