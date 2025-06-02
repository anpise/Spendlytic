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

## Kubernetes Deployment with Minikube

1. Start Minikube:
```bash
minikube start
```

2. Apply Kubernetes configurations:
```bash
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

3. Check deployment status:
```bash
kubectl get pods
kubectl get services
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
- username (Unique)
- email (Unique)
- password (Hashed)
- created_at
- updated_at

### Bills Table
- id (Primary Key)
- user_id (Foreign Key)
- filename
- upload_date
- total_amount
- merchant_name
- transaction_date
- created_at
- updated_at

### Items Table
- id (Primary Key)
- bill_id (Foreign Key)
- name
- quantity
- unit_price
- total_price
- category
- created_at
- updated_at
