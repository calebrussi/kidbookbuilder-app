import { Storage } from '../storage';
import { AuthResult, AuthToken, Credentials, RegistrationData, UserProfile } from './types';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

/**
 * Authentication service for the Kid Book Builder application.
 * This is a simple implementation using local storage.
 */
export class AuthService {
  private storage: Storage;
  private usersPath = 'auth/users';
  private tokensPath = 'auth/tokens';

  /**
   * Creates a new authentication service instance
   * @param storage Storage instance for persisting authentication data
   */
  constructor(storage: Storage) {
    this.storage = storage;
    this.ensureAuthDirectories();
  }

  /**
   * Ensures the authentication directories exist
   */
  private ensureAuthDirectories(): void {
    this.storage.ensureDirectory(this.storage.getFullPath(this.usersPath));
    this.storage.ensureDirectory(this.storage.getFullPath(this.tokensPath));
  }

  /**
   * Hash a password with a salt
   * @param password Password to hash
   * @returns Hashed password and salt
   */
  private hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
    return { hash, salt };
  }

  /**
   * Verify a password against a hash and salt
   * @param password Password to verify
   * @param hash Hash to verify against
   * @param salt Salt used for hashing
   * @returns true if the password matches the hash
   */
  private verifyPassword(password: string, hash: string, salt: string): boolean {
    const verifyHash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
    return hash === verifyHash;
  }

  /**
   * Generate a new authentication token
   * @param userId User ID to generate a token for
   * @returns Authentication token
   */
  private generateToken(userId: string): AuthToken {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    const tokenData = {
      token,
      userId,
      expiresAt: expiresAt.toISOString(),
    };

    const tokenPath = `${this.tokensPath}/${token}.json`;
    this.storage.writeFile(tokenPath, JSON.stringify(tokenData));

    return {
      token,
      expiresAt,
    };
  }

  /**
   * Register a new user
   * @param data Registration data
   * @returns Authentication result
   */
  public register(data: RegistrationData): AuthResult {
    // Check if user already exists
    const userFilePath = `${this.usersPath}/${data.username}.json`;
    const existingUser = this.storage.readFile(userFilePath);
    
    if (existingUser) {
      return {
        success: false,
        error: 'Username already exists',
      };
    }

    // Create new user
    const { hash, salt } = this.hashPassword(data.password);
    const now = new Date();
    
    const user: UserProfile & { passwordHash: string; passwordSalt: string } = {
      id: uuidv4(),
      username: data.username,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      createdAt: now,
      updatedAt: now,
      passwordHash: hash,
      passwordSalt: salt,
    };

    // Save user to storage
    this.storage.writeFile(userFilePath, JSON.stringify(user));

    // Generate token
    const token = this.generateToken(user.id);

    // Return success result (without the password hash)
    const { passwordHash, passwordSalt, ...userProfile } = user;
    return {
      success: true,
      user: userProfile,
      token,
    };
  }

  /**
   * Log in a user
   * @param credentials Login credentials
   * @returns Authentication result
   */
  public login(credentials: Credentials): AuthResult {
    // Find user
    const userFilePath = `${this.usersPath}/${credentials.username}.json`;
    const userData = this.storage.readFile(userFilePath);
    
    if (!userData) {
      return {
        success: false,
        error: 'Invalid username or password',
      };
    }

    // Parse user data
    const user = JSON.parse(userData.toString()) as UserProfile & {
      passwordHash: string;
      passwordSalt: string;
    };

    // Verify password
    if (!this.verifyPassword(credentials.password, user.passwordHash, user.passwordSalt)) {
      return {
        success: false,
        error: 'Invalid username or password',
      };
    }

    // Generate token
    const token = this.generateToken(user.id);

    // Return success result (without the password hash)
    const { passwordHash, passwordSalt, ...userProfile } = user;
    return {
      success: true,
      user: userProfile,
      token,
    };
  }

  /**
   * Validate a token
   * @param tokenString Token to validate
   * @returns The user profile if the token is valid, null otherwise
   */
  public validateToken(tokenString: string): UserProfile | null {
    const tokenPath = `${this.tokensPath}/${tokenString}.json`;
    const tokenData = this.storage.readFile(tokenPath);
    
    if (!tokenData) {
      return null;
    }

    const token = JSON.parse(tokenData.toString()) as {
      token: string;
      userId: string;
      expiresAt: string;
    };

    // Check if token is expired
    const expiresAt = new Date(token.expiresAt);
    if (expiresAt < new Date()) {
      // Token is expired, delete it
      this.storage.deleteFile(tokenPath);
      return null;
    }

    // Find user
    const users = this.listUsers();
    const user = users.find(u => u.id === token.userId);
    
    if (!user) {
      return null;
    }

    return user;
  }

  /**
   * List all users
   * @returns List of user profiles
   */
  public listUsers(): UserProfile[] {
    const userFiles = this.storage.listFiles(this.usersPath);
    const users: UserProfile[] = [];

    for (const file of userFiles) {
      const userData = this.storage.readFile(`${this.usersPath}/${file}`);
      if (userData) {
        const user = JSON.parse(userData.toString()) as UserProfile & {
          passwordHash: string;
          passwordSalt: string;
        };
        const { passwordHash, passwordSalt, ...userProfile } = user;
        users.push(userProfile);
      }
    }

    return users;
  }

  /**
   * Logout a user
   * @param tokenString Token to invalidate
   * @returns true if the token was invalidated
   */
  public logout(tokenString: string): boolean {
    const tokenPath = `${this.tokensPath}/${tokenString}.json`;
    return this.storage.deleteFile(tokenPath);
  }
} 