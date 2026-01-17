# Todoapp backend

This is backend of Todoapp Where I learn core and understand how the web backend processes and operates . It have

## Tech stack

- NestJS - Framework
- PostgreSQL - Database
- Typescript - Language
- Prisma - Object-Relational Mapper

## Way to run the Backend

1. install library:

```bash
  npm install
```

2. Create and fill out .env as form of .env.example

3. make sure you have connected to your database

4. Generate Prisma Client

```bash
npx prisma generate
```

5. Run migrate (If your DB is empty)

```bash
npx prisma migrate dev
```

6. run server

```bash
  npm run start:dev
```

## Backend Flow

### Happy Path

```
Client (FE / Postman)
|
| HTTP Request
| Method (GET / POST / PATCH / DELETE)
| - URL
| - Headers (Authorization, Cookie, ...)
| - Body / Params / Query
v

NestJS App (main.ts)
|
| Middlewares
| - JSON body parser
| - cookie-parser
v

GUARD (e.g., JwtAuthGuard)✅
| - Check authentication / authorization
| - Read Authorization header or cookie
| - Verify JWT
| - Attach req.user
v

PIPES (ValidationPipe)✅
| - Validate DTO (body / params / query)
| - Transform data (if transform enabled)
v

Controller (Router)
| - Receive validated input
| - Call Service
v

Service (Business Logic)
| - Handle business logic
| - Call Prisma / Database
v

Controller return
v

HTTP Response
- 200 OK
- 201 Created
- 204 No Content
```

### Error Path

#### General flow

```
Guard / Pipes / Controller / Service
|
| throw Exception
v
NestJS Exception Layer
|
v
HTTP Error Response
```

#### Error at Guard

```
Client
|
v
GUARD
|
| ❌ No token
| ❌ Token has wrong format
| ❌ Token expired
| ❌ Valid token but insufficient permissions
|
| throw new UnauthorizedException(...)
| throw new ForbiddenException(...)
v
NestJS Exception Handler
v
HTTP Error Response
```

#### Error at Pipes (VALIDATION)

```
Client
|
v
GUARD  PASS
|
v
PIPES
|
|  ❌ Body / Params / Query do not match DTO
|  ❌ Missing required fields
|  ❌ Wrong data type
|  @IsEmail(), @MinLength(), ... validation failed
|
| throw new BadRequestException (automatic)
v
NestJS Exception Handler
v
HTTP Error Response
```

#### Error at Controller / Service

```
Client
|
v

GUARD ✅
|
v
PIPES ✅
|
v
Controller
|
v
Service
|
| ❌ Business logic error
| ❌ Data not found
| ❌ Duplicate data
| ❌ Database / logic error
|
| throw new BadRequestException(...)
| throw new NotFoundException(...)
| throw new ConflictException(...)
| throw new InternalServerErrorException(...)
v
NestJS Exception Handler
v
HTTP Error Response
```

## Resources and Knowledge I learned

### HTTP status

✅ Success

- 200 – OK
  → API call successful, data returned

- 201 – Created
  → Successfully created new resource (POST)

- 204 – No Content
  → Success but no data returned (DELETE, logout)

❌ Client errors (frontend / user)

- 400 – Bad Request
  → Sent invalid data (validation failed, basic logic error)

- 401 – Unauthorized
  → Not logged in / wrong token / token expired

- 403 – Forbidden
  → Logged in but insufficient permissions

- 404 – Not Found
  → Data not found

- 409 – Conflict
  → Duplicate data (email, username)

- 422 – Unprocessable Entity
  → Correct data type but violates business rules

- 429 – Too Many Requests
  → Too many requests sent (rate limit)

💥 Server errors (backend)

- 500 – Internal Server Error
  → Backend bug / unexpected error

- 503 – Service Unavailable
  → Server overloaded / under maintenance

### ORM (prisma) and database

#### What is Prisma ?

Prisma is an ORM that connects TypeScript applications to databases.
Instead of SQL :

```bash
SELECT * FROM user;
```

You code:

```bash
prisma.user.findMany()
```

| Part          | Used for                                         |
| :------------ | :----------------------------------------------- |
| Prisma Schema | Database Design                                  |
| Prisma Client | Querying the database in code                    |
| Prisma CLI    | commands help you “talk” with Prisma by terminal |

#### Step 1 Install Prisma (Prisma CLI + Prisma Client)

```bash
npm install prisma --save-dev
npm install @prisma/client
```

result:

- Prisma in devDependencies (CLI)
- @prisma/client in dependencies (use in code)

#### Step 2 Initialize Prisma

```bash
npx prisma init
```

Created:

- prisma/schema.prisma (Used for create models)
- .env (Used for fill DB url)

#### Write and update prisma/schema.prisma

Add model, enum, @relation, @unique, @default(now()), @updatedAt, … Then, save file.

#### Check whether the schema is valid

```bash
npx prisma validate
```

#### Create table in DB by migration

First time:

```bash
npx prisma migrate dev --name init
```

Next time you update the schema:

```bash
npx prisma migrate dev --name <Updating Name>
```

This command will do the following:

- Create a new migration in the prisma/migrations directory
- Apply the changes to the database
- Run prisma generate

#### Create PrismaService in NestJS for using Prisma Client

Step 1: Create module prisma/  
Step 2: Ctreate prisma.service.ts (wrap PrismaClient)  
Step 3: Export PrismaService, other module inject to use

### CRUD Module (user)

#### What is a Router?

Router = the place where you define “which URL is handled by which logic”

Example:

```
POST /auth/login  → handle login

GET  /tasks       → get task list
```

The Router decides:

- Where this URL goes

- Which HTTP method is used (GET / POST / PATCH / DELETE)

#### DTO + Validation

A DTO (Data Transfer Object) defines the shape of incoming data.
Validator = The "Gatekeeper" layer that inspects request data before it enters the logic.

- class-validator
- ValidationPipe

Request body
→ DTO
→ Validation
→ Controller

Invalid data is blocked before it reaches business logic.

#### Dependency Injection (DI)

NestJS automatically creates and injects instances for you.

```
@Injectable()
Constructor-based injection
constructor(private prisma: PrismaService) {}
```

- No manual new keyword
- Easier testing and replacement of dependencies

#### Module

##### What is a Module?

Module = A functional container It groups related Controllers, Services, and Providers into a single logical block.

Examples:

- AuthModule: Handles login, registration, and refresh tokens.
- UsersModule: Manages user information.
- TasksModule: Manages tasks, comments, files, and permissions.

##### Why are Modules mandatory in NestJS?

NestJS utilizes Dependency Injection (DI). → The system needs modules to know which class instances to create, where to inject them, and define their scope.

##### Without modules:

Controllers will not execute.

Services cannot be injected.

Guards / Interceptors will not function.

##### What are the responsibilities of a Module file?

1. Declare Controllers (Routing)

```
controllers: [AuthController]
```

NestJS recognizes: "Okay, this controller exists to handle incoming requests."

2. Declare Providers (Service, Guard, Helper...)

```
providers: [AuthService, JwtAuthGuard]
```

NestJS will:

- Instantiate the class (Create an instance).
- Inject it into the constructor where it is needed.

WHEN is it necessary to declare providers?  
The Core Principle (MUST REMEMBER): Any class that is injected via a constructor MUST be registered as a provider.  
 You need to declare a provider when:

- The class is decorated with @Injectable() Example:

```
@Injectable()
export class AuthService {}
```

- The class is used via constructor injection Example:

```
constructor(private authService: AuthService) {}
```

Reason: NestJS must be responsible for creating the instance of that class and "handing" it to the constructor.

3. Import other Modules imports:

```
 imports: [UsersModule, JwtModule]
```

This allows the use of services from other modules.  
Note: Without importing, dependency injection will fail.  
WHEN do you need to import another module?  
The STANDARD Rule: If Module A wants to use a Service belonging to Module B, then Module A must import Module B.

4. Export Services for other modules exports:

If a Service wants to be injected by another module → It MUST be exported

```
exports: [AuthService]
```

This makes the service "visible" and available for other modules to inject.  
WHY does NestJS design it this way?  
This is a common point of confusion for many developers.

```
 (NestJS will throw an error): imports: [UsersService]
```

```
 imports: [UsersModule]
```

Modules act as Boundaries A module serves as a protective layer that controls:

- Public Services: What you are allowed to use from the outside (via exports).
- Private Services: Internal logic that should stay hidden (Encapsulation).

##### WHY does AppModule import all other modules?

```
@Module({ imports: [AuthModule, UsersModule, TasksModule] })
 export class AppModule {}
```

Because AppModule is the Root Container of the entire application.

The NestJS Bootstrap Process :

In main.ts, the application calls: NestFactory.create(AppModule)

NestJS starts the engine:

It loads the AppModule first.

It traverses (duyệt qua) all the modules listed in the imports array.  
It recursively loads the entire Module Tree.

Conclusion: If a module is not imported into AppModule (directly or indirectly), NestJS will "ignore" it. It's like a branch that isn't connected to the tree trunk—it won't receive any water (resources/logic).

#### Controller (Router + Entry Point)

Responsibilities:

- Receive HTTP requests
- Extract data from body / params / query
- Call the Service

Does NOT handle heavy business logic  
 Does NOT query the database

#### Service (Business Logic)

Service = where business logic is handled

Responsibilities:

- Handle business rules
- Check conditions
- Call Prisma (database)
- Return results to the Controller
- The Service does not know anything about HTTP

#### Prisma service ,JWT service and Config service

##### PrismaService

PrismaService = A wrapper around Prisma Client.

Prisma Client: Generated automatically by Prisma.

PrismaService helps to:

- Enable Dependency Injection (DI): Making it injectable into any Controller or Service within NestJS.

- Manage Lifecycle: Automatically handling connection and disconnection (connect / disconnect) when the app starts or shuts down.

Global Usage: Shared across the entire application.  
How does PrismaService operate?

```
@Injectable() export class PrismaService extends PrismaClient {}
```

The Nature of it:PrismaClient: The base class provided by Prisma.PrismaService: The class managed by NestJS.  
 Key Logic: NestJS can only manage and inject classes decorated with @Injectable(). By extending PrismaClient, PrismaService possesses all the database power of Prisma while becoming "compatible" with NestJS's Dependency Injection system.  
 The Usage Workflow (Luồng hoạt động)  
 The Data Flow:UsersService → PrismaService (The Wrapper) → Prisma Client (The Engine) → Database.

##### JwtService

JwtService is a service provided by the @nestjs/jwt package. It assists you in:

- Signing tokens (sign): Creating a new token.
- Verifying tokens (verify): Checking if a token is valid and untampered with.
- Decoding tokens: Extracting data from a token without verification.

Why is JwtService a "special service"?

- It is not self-written: It comes from an external library and is pre-injected by NestJS.
- It is Config-dependent: It relies on specific settings like secret (private key) and expiresIn (expiration time).  
  Note: If you don't configure the JwtModule, the service cannot function.

Common Use Cases:

1.  Generating Access Tokens:

```
this.jwt.sign(payload)
```

2.  Verifying Tokens (in Guards):

```
this.jwt.verifyAsync(token)
```

##### ConfigService

Comes from the library: @nestjs/config.

Reads values from:

- .env files.
- System environment variables.

Allows injection into Services / Guards / Modules.  
 Rule: Do not read process.env directly within your logic.

Why is ConfigService needed? (Core Reason)

1. DANGEROUS Method (Not recommended):

```
 process.env.JWT_SECRET Problems:
```

- No control over missing environment variables.
- Difficult to test.
- Scattered throughout the code.
- Prone to production errors.

2.  STANDARD Method:

```
this.config.get('JWT_SECRET') Benefits:
```

- Single point of management.
- Injectable.
- Can be validated.
- Secure and scales well.

3. How does ConfigService work?

- Step 1: Import ConfigModule (Once)

```TypeScript

ConfigModule.forRoot({
  isGlobal: true,
})
```

isGlobal: true → No need to re-import in every module.

- Step 2: Inject ConfigService

```
  constructor(private config: ConfigService) {}
```

- Step 3: Retrieve config values

```
 const secret = this.config.get('JWT_ACCESS_SECRET');
```

4. WHERE is ConfigService commonly used?

- AuthService:
  `this.config.get('JWT_ACCESS_SECRET')`
- JwtAuthGuard:
  ` this.config.get('JWT_ACCESS_SECRET')`
  `Prisma / DB: this.config.get('DATABASE_URL') `
- main.ts:
  `this.config.get('PORT')`

### Auth & Guard

#### Token

1. What is an Access Token?
   Access Token = A "short-term entry pass" to call APIs.

Issued by the backend upon login.

Purpose:

- Included with every request.

- Proves that you are logged in.

- Format: Usually a JWT (JSON Web Token).

Lifespan: Short (5–15 minutes).

Example header: `Authorization: Bearer <access_token>`  
Note: If the access token expires, the backend returns a 401 Unauthorized error.

2. What is a Refresh Token?
   Refresh Token = A "renewal card" to request a new access token.

Issued by the backend alongside the access token.

Purpose: Not used to call APIs; only used when the access token expires.

Lifespan: Long (7–30 days).

The Workflow:

- Access token expires.

- Frontend sends the refresh token to the backend.

- Backend issues a new access token. Note: If the refresh token expires, the user is forced to log in again.

#### Client-Side Storage Categories

1. LocalStorage
   Stores data long-term in the browser.

Data is not lost upon reloading or closing the tab.

Cleared only when:

- The user clears the cache.

- Code explicitly deletes it.

Accessible for reading/writing via JavaScript.  
 Common use cases: Access tokens ( discouraged), theme settings, language preferences, configurations.

2. SessionStorage
   Similar to LocalStorage but limited to a single tab.

Closing the tab → Data is lost.

Reloading the tab → Data persists.

Accessible for reading/writing via JavaScript.  
 Common use cases: Temporary data, unsubmitted forms, multi-step wizards.

3. Cookie
   Data sent along with every HTTP request.

Accessibility: Can be read by JS, or set as HttpOnly (JS cannot access).

Expiration: Has an expiration date (expires / max-age).  
 Common use cases: Refresh tokens (HttpOnly), Session IDs, secure authentication states.

4.  In-memory Storage (JS Variables)
    Stored in the application's RAM.

Reloading or closing the tab → Data is lost.

Not written to browser storage.  
 Common use cases: Access tokens (THE RECOMMENDED WAY), temporary auth states.

5. Cache Storage (Service Worker)
   Caches actual Request/Response objects.

Purpose:

- PWA (Progressive Web Apps).

- Offline mode.

Performance optimization (speeding up load times).  
 Rule: Not intended for authentication tokens.

#### Guard

1.  What is a Guard?

Guard = A layer used to DECIDE whether a request is allowed to proceed or not. Guard is NOT a Business Service, but technically, it IS a Provider.  
A Guard returns true or false:

- true: Allows the request to proceed.
- false or throw error: Blocks the request.

Note: Guards execute BEFORE the Controller.

2. What is a Guard used for?
   Tasks that ONLY Guards should handle:

- Checking if the user is logged in.

- Verifying if the token is valid.

- Checking for permissions to access a specific route.

- Attaching user information to the request (req.user).

Examples:

- Not logged in → Returns 401 Unauthorized.

- Insufficient permissions → Returns 403 Forbidden.

3. Flow  
   HTTP Request → Middleware → GUARD → Controller → Service
