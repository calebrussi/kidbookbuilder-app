# Authentication Implementation

This document outlines the authentication implementation for the Kid Book Builder application.

## Authentication Flow

The authentication flow in the application follows these steps:

1. **User Registration**:
   - User provides registration information (username, password, display name, role)
   - System checks if the username is already taken
   - If not, the password is hashed with a unique salt
   - User account is created and stored
   - Authentication token is generated and returned

2. **User Login**:
   - User provides login credentials (username, password)
   - System retrieves user account by username
   - Password is verified against the stored hash
   - If valid, authentication token is generated and returned

3. **Authentication**:
   - For protected operations, the client provides an authentication token
   - System validates the token
   - If valid and not expired, the operation is allowed
   - If invalid or expired, the operation is rejected

4. **Logout**:
   - User token is invalidated
   - System removes the token from storage

## User Roles

The application supports the following user roles:

- **Parent**: Adult users who can create and manage stories, accounts for children
- **Child**: Young users with restricted abilities 
- **Admin**: System administrators with full access

## Implementation Details

### Storage

Authentication data is stored in the local file system:

- User accounts: `auth/users/<username>.json`
- Authentication tokens: `auth/tokens/<token>.json`

### Password Security

Passwords are secured using:

- PBKDF2 cryptographic hashing
- Individual salt for each password
- Multiple hash iterations (1000)

### Token Management

Tokens have the following characteristics:

- UUID v4 format for uniqueness
- 24-hour expiration
- Stored with user reference
- Validation on each protected operation

## Usage

### Registration

```typescript
const authService = new AuthService(storage);

const registrationData = {
  username: 'user123',
  password: 'securepassword',
  displayName: 'User Name',
  role: UserRole.Parent,
};

const result = authService.register(registrationData);
if (result.success) {
  // Registration successful
  const user = result.user;
  const token = result.token;
} else {
  // Registration failed
  const error = result.error;
}
```

### Login

```typescript
const authService = new AuthService(storage);

const credentials = {
  username: 'user123',
  password: 'securepassword',
};

const result = authService.login(credentials);
if (result.success) {
  // Login successful
  const user = result.user;
  const token = result.token;
} else {
  // Login failed
  const error = result.error;
}
```

### Token Validation

```typescript
const authService = new AuthService(storage);

const user = authService.validateToken(tokenString);
if (user) {
  // Token is valid, user is authenticated
} else {
  // Token is invalid or expired
}
```

### Logout

```typescript
const authService = new AuthService(storage);

const success = authService.logout(tokenString);
``` 