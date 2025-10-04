# Property Rental Management Backend

A comprehensive backend system for a full-stack property rental management application. This backend is built with Node.js, Express, and TypeScript, and it uses MongoDB as its database. It provides a robust set of features for managing apartments, tenants, owners, and rental applications.

## Features

- **User Authentication:** Secure user registration and login with JWT-based authentication.
- **Role-Based Access Control:** Different roles for Tenants, Owners, and Admins with specific permissions.
- **Apartment Management:** CRUD operations for apartments, including details like location, rent, and amenities.
- **Rental Applications:** Tenants can apply for apartments, and owners can manage these applications (approve/reject).
- **File Uploads:** Supports file uploads for documents like lease agreements, handled with Multer and stored on AWS S3.
- **Scheduled Tasks:** Uses `node-cron` for running scheduled jobs.
- **Email Notifications:** Integrated with Nodemailer and Resend for sending emails for various events.

## Technologies Used

- **Backend:** Node.js, Express.js
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT), bcrypt
- **File Storage:** AWS S3
- **Emailing:** Nodemailer, Resend
- **Scheduling:** node-cron
- **Environment Variables:** dotenv

## Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/try/download/community) instance (local or cloud)
- AWS S3 Bucket and Credentials

## Installation and Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/nfahajan/property-rental-management-backend.git
    cd property-rental-management-backend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory by copying the `env.example` file:
    ```bash
    cp env.example .env
    ```
    Update the `.env` file with your configuration for the database, JWT secret, AWS credentials, etc.

## Running the Application

- **Development Mode:**
  This command starts the server with `nodemon`, which will automatically restart the server on file changes.

  ```bash
  npm run dev
  ```

- **Production Mode:**
  First, build the TypeScript code into JavaScript:
  ```bash
  npm run build
  ```
  Then, start the server:
  ```bash
  npm start
  ```
  The server will be running on the port specified in your `.env` file (e.g., `http://localhost:5000`).

## API Endpoints

The API routes are defined in the `src/app/modules/` directory. Each module has its own route file (e.g., `src/app/modules/apartments/apartment.route.ts`).

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login a user
- `GET /api/v1/apartments` - Get all apartments
- `POST /api/v1/apartments` - Create a new apartment
- ... and many more.

Please refer to the source code for a complete list of endpoints and their functionalities.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
