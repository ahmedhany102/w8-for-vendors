
# MyTestSite - Secure Web Application

A secure full-stack web application with authentication, authorization, and robust security features.

## Project Overview

MyTestSite is a security-focused web application built with:

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Spring Boot (Java)
- **Database**: MySQL or H2 (in-memory for testing)
- **Authentication**: JWT with secure cookies

## Security Features

- Secure authentication with password hashing (bcrypt)
- Role-based access control (User/Admin roles)
- Rate limiting for login attempts
- CSRF protection
- Input validation and sanitization
- Protected routes (both client and server side)
- Session management and tracking
- Secure HTTP-only cookies for JWT
- User tracking with IP logging

## Project Structure

### Frontend (React)

```
src/
├── components/      # Reusable UI components
├── contexts/        # Context providers (Auth)
├── pages/           # Application pages
└── App.tsx          # Main application component
```

### Backend (Spring Boot)

The backend code should be created as a separate project with:

```
src/
├── main/
│   ├── java/com/mytestsite/
│   │   ├── config/         # Security configuration
│   │   ├── controller/     # REST endpoints
│   │   ├── dto/            # Data transfer objects
│   │   ├── entity/         # Database entities
│   │   ├── repository/     # Data access
│   │   ├── security/       # Security utilities
│   │   └── service/        # Business logic
│   └── resources/
│       └── application.properties  # App configuration
└── test/                   # Unit and integration tests
```

## Backend Implementation Requirements

Create a Spring Boot application with:

```xml
<!-- Key dependencies -->
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
    <!-- Additional security dependencies -->
</dependencies>
```

### Key Security Configurations

1. **WebSecurityConfig.java**
   - Configure Spring Security
   - Set up CORS with allowedOrigins from frontend only
   - Implement CSRF protection
   - Configure session management
   - Set up authentication filters

2. **JwtTokenProvider.java**
   - Generate JWT tokens
   - Validate tokens
   - Extract user details

3. **CustomUserDetailsService.java**
   - Load user details for authentication
   - Handle user lookup

4. **Database Migration**
   - Create initial admin user with fixed credentials
   - Set up roles and permissions

### API Endpoints

Create these REST endpoints:

```
POST /api/auth/register - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
GET /api/auth/me - Get current user details

GET /api/admin/users - Get all users (admin only)
GET /api/admin/users/{id} - Get user by ID (admin only)
PUT /api/admin/users/{id} - Update user (admin only)
```

## Setup Instructions

### Frontend Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Backend Setup (Spring Boot)

1. Create a new Spring Boot project
2. Configure application.properties:
   ```
   # Database
   spring.datasource.url=jdbc:h2:mem:mytestsite
   spring.datasource.driverClassName=org.h2.Driver
   spring.datasource.username=sa
   spring.datasource.password=password
   
   # JPA
   spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
   spring.jpa.hibernate.ddl-auto=update
   
   # Security
   security.jwt.token.secret-key=yourSecretKey
   security.jwt.token.expire-length=3600000
   
   # CORS
   security.cors.allowed-origins=http://localhost:8080
   
   # Admin account
   admin.email=admin@mytestsite.com
   admin.password=secureAdminPassword123!
   ```

3. Run the Spring Boot application

## Security Testing Guidelines

To test the security of this application:

1. Attempt to access the admin panel as a regular user
2. Try to modify request payloads to change user roles
3. Test for CSRF vulnerabilities
4. Attempt to bypass authentication
5. Check for information leakage in error messages

## Notes for Testers

The admin account is hardcoded in the backend with:
- Email: admin@mytestsite.com
- Password: (configured in application.properties)

This account is the only one with admin privileges, and the application is designed to prevent any privilege escalation or unauthorized access to admin features.
