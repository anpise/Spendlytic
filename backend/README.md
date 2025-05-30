# Spendlytic Backend

Backend service for Spendlytic - A smart expense tracking application. This service provides RESTful APIs for authentication, bill/receipt upload and processing, and analytics. It integrates with PostgreSQL, AWS, and OpenAI GPT-4o-mini.

See the [project root README](../README.md) for an overview and the [frontend README](../frontend/README.md) for the web client.

## Tech Stack

- Python 3.11
- Flask
- PostgreSQL (AWS RDS)
- OpenAI GPT-4
- Docker
- AWS (S3, RDS)

## Setup with Docker

### Environment Variables Setup

1. Create a `.env` file in the backend directory with the following variables:

```env
# Flask Settings
SECRET_KEY=your_secret_key
DEBUG=True

# Database Settings (AWS RDS)
DB_USERNAME=your_rds_username
DB_PASSWORD=your_rds_password
DB_HOST=your_rds_endpoint
DB_PORT=5432
DB_NAME=spendlytic

# JWT Settings
JWT_ACCESS_TOKEN_EXPIRES=30

# AWS Settings
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_s3_bucket_name

# OpenAI Settings
OPENAI_API_KEY=your_openai_api_key
```

### Option 1: Using Docker Run

```bash
# Build the image
docker build -t spendlytic-backend .

# Run the container with environment variables from .env file
docker run -p 5000:5000 --env-file .env spendlytic-backend
```

### Option 2: Using Docker Compose

1. Create `docker-compose.yml` in project root:
```yaml
version: '3.8'
services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - FLASK_APP=app.py
      - FLASK_ENV=development
      - FLASK_DEBUG=1
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_NAME=${DB_NAME}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_REGION=${AWS_REGION}
      - S3_BUCKET_NAME=${S3_BUCKET_NAME}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./backend:/app
```

2. Run with docker-compose:
```bash
docker-compose up --build
```

### Important Notes about Environment Variables

1. **Docker Run**:
   - The `--env-file .env` flag is required to pass environment variables
   - Without this flag, the container won't have access to the environment variables
   - The `.env` file must exist in the directory where you run the docker command

2. **Docker Compose**:
   - Docker Compose automatically loads variables from `.env` file in the same directory
   - The `${VARIABLE}` syntax in docker-compose.yml references variables from `.env`
   - You can also set variables directly in the `environment` section

3. **Docker Build**:
   - Environment variables are not available during the build process
   - They are only available when the container is running
   - Use ARG in Dockerfile for build-time variables if needed

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```

- `POST /api/login` - User login
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

- `POST /api/refresh-token` - Refresh JWT token
  ```json
  {
    "token": "string"
  }
  ```

### Bills
- `POST /api/upload` - Upload and process a receipt/bill
  - Content-Type: multipart/form-data
  - file: receipt/bill file (pdf, png, jpg, jpeg)

- `GET /api/bills` - Get user's bills
  - Requires JWT token in Authorization header

- `GET /api/bills/<id>` - Get specific bill
  - Requires JWT token in Authorization header

- `DELETE /api/bills/<id>` - Delete a bill
  - Requires JWT token in Authorization header

## Database Schema

The application uses PostgreSQL with the following tables:

### Users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Bills
```sql
CREATE TABLE bills (
    id SERIAL PRIMARY KEY,
    merchant_name VARCHAR(255) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Items
```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE
);
```

## Development

For local development:

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

## Environment Variables

All required environment variables are listed in the `.env` file template above. Make sure to set them before running the application. The S3 bucket name is required for file uploads to AWS S3.

## Security

- JWT-based authentication
- Password hashing with Werkzeug
- Secure file upload handling
- Environment variable configuration
- CORS protection
- Input validation
