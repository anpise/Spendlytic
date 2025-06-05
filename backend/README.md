# Spendlytic Backend

## Project Description
Spendlytic is a smart expense tracking and analysis application that helps users manage their finances by automatically extracting and analyzing information from receipts and bills. The backend provides a RESTful API for user authentication, bill upload and processing, and expense analysis using AI services.

## Tech Stack
- **Framework**: Flask (Python)
- **Database**: 
  - Primary: PostgreSQL with SQLAlchemy ORM
  - Fallback: SQLite (when PostgreSQL connection fails)
- **Authentication**: JWT (JSON Web Tokens)
- **AI Services**: OpenAI GPT-4
- **File Storage**: AWS S3
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Monitoring**: Prometheus

## Backend Structure
- **app.py**: Main Flask app, blueprint registration, and configuration
- **routes/**: Modular Flask blueprints for API endpoints
  - `auth.py`: Authentication endpoints (register, login, refresh-token)
  - `upload.py`: File upload endpoint
  - `bills.py`: Bill and item endpoints
  - `health.py`: Health check endpoints
- **models/**: SQLAlchemy models and Pydantic schemas
  - `user.py`, `bill.py`, `item.py`, `upload.py`, `financial_models.py`, `__init__.py`
- **utils/**: Utility modules
  - `auth.py`: Token and authentication helpers
  - `ai_services.py`: AI and OpenAI integration
  - `data_extraction.py`: Data extraction logic
  - `logger.py`: Centralized logging utility
- **k8s/**: Kubernetes manifests and deployment scripts
- **uploads/**: Uploaded files (if not using S3)
- **config.py**: Configuration variables
- **requirements.txt**: Python dependencies
- **Dockerfile**: Containerization setup

For all Kubernetes deployment steps, autoscaling, and monitoring instructions, see the [k8s/README.md](k8s/README.md).

## Environment Variables
Create a `.env` file in the backend directory with the following variables:

```env
# Flask settings
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database settings (PostgreSQL - will fallback to SQLite if connection fails)
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=spendlytic

# JWT settings
JWT_ACCESS_TOKEN_EXPIRES=30

# AI Service settings
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# AWS settings
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=spendlytic
```

Note: The application will:
1. First attempt to connect to PostgreSQL using the provided credentials
2. If the PostgreSQL connection fails, it will automatically fall back to using SQLite (stored in `spendlytic.db`)
3. You will see a message in the console indicating which database is being used

## Python Environment Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- Windows:
```bash
.\venv\Scripts\activate
```
- Unix/MacOS:
```bash
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

1. Start the Flask development server:
```bash
flask run
```

The server will start on `http://localhost:5000`

## Docker Build and Run

1. Build the Docker image:
```bash
docker build -t spendlytic-backend .
```

2. Run the container:
```bash
docker run -p 5000:5000 --env-file .env spendlytic-backend
```

## Pushing Docker Image

1. Tag the image:
```bash
docker tag spendlytic-backend your-registry/spendlytic-backend:latest
```

2. Push to registry:
```bash
docker push your-registry/spendlytic-backend:latest
```

## API Endpoints

### Authentication

1. Register User
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "email": "user@example.com", "password": "password123"}'
```

2. Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "password123"}'
```

3. Refresh Token
```bash
curl -X POST http://localhost:5000/api/refresh-token \
  -H "Authorization: Bearer your_token_here"
```

### Bills and Items

1. Upload Bill
```bash
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer your_token_here" \
  -F "file=@/path/to/your/bill.jpg"
```

2. Get User Bills
```bash
curl -X GET http://localhost:5000/api/bills \
  -H "Authorization: Bearer your_token_here"
```

3. Get Bill Items
```bash
curl -X GET http://localhost:5000/api/bills/{bill_id}/items \
  -H "Authorization: Bearer your_token_here"
```

## Database Schema

### Users Table
- id (Primary Key)
- username (Unique, required)
- email (Unique, required)
- password (Hashed, required)
- created_at (timestamp)
- updated_at (timestamp)
- is_active (boolean)

### Bills Table
- id (Primary Key)
- merchant_name (required)
- total_amount (decimal, required)
- date (timestamp, required)
- user_id (Foreign Key to users, required)
- created_at (timestamp)
- updated_at (timestamp)

### Items Table
- id (Primary Key)
- description (required)
- quantity (integer, required)
- price (decimal, required)
- bill_id (Foreign Key to bills, required)

### Uploads Table
- id (Primary Key)
- user_id (Foreign Key to users, required)
- filename (required)
- upload_date (timestamp)
- file_size (integer, required)
- status (string: completed, failed, processing)

### FinancialData (Pydantic Model for Validation)
- merchant_name: str
- total_amount: float
- date: str (YYYY-MM-DD)
- items: List[Dict[str, Any]]

(See models/ for full implementation details.)
