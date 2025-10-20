# Social Media Content Generator

AI-powered social media content generation platform with automated posting capabilities.

## 🚀 Features

- **AI Content Generation**: Generate platform-specific content using AI
- **Multi-Platform Support**: Facebook, Instagram, LinkedIn, Twitter, Threads
- **Image Generation**: AI-generated images for social media posts
- **Content Management**: Review, approve, and manage generated content
- **Automated Posting**: Schedule and publish content across platforms
- **Analytics Dashboard**: Track performance and engagement metrics

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Modern styling
- **shadcn/ui** - Component library
- **Lucide Icons** - Beautiful icons

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Database
- **Redis** - Caching and task queue
- **Celery** - Background task processing
- **Alembic** - Database migrations
- **SQLAlchemy** - ORM

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.9+
- Docker and Docker Compose (recommended)
- PostgreSQL (if not using Docker)
- Redis (if not using Docker)

### Quick Start with Docker

```bash
# Clone the repository
git clone <repository-url>
cd social_generator_media

# Start all services
docker-compose up --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/api/docs
```

## 🔧 Development Setup

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Open http://localhost:3000
```

## 🗄️ Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py
```

## 🔑 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dbname

# Security
SECRET_KEY=your-secret-key-here

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Social Media APIs
INSTAGRAM_USERNAME=your-username
INSTAGRAM_PASSWORD=your-password
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📁 Project Structure

```
social_generator_media/
├── backend/
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── core/        # Core configuration
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   ├── tasks/       # Celery tasks
│   │   └── utils/       # Utilities
│   ├── alembic/         # Database migrations
│   └── tests/           # Backend tests
├── frontend/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   ├── lib/             # Utilities and API client
│   └── types/           # TypeScript types
└── docker-compose.yml   # Docker services
```

## 🚦 API Endpoints

- **POST** `/api/v1/auth/register` - Register new user
- **POST** `/api/v1/auth/login` - Login user
- **POST** `/api/v1/content/generate` - Generate content
- **GET** `/api/v1/content` - List content
- **POST** `/api/v1/content/{id}/approve` - Approve content
- **GET** `/api/v1/posts` - List posts
- **GET** `/api/v1/social-accounts` - List connected accounts

Full API documentation available at: `http://localhost:8000/api/docs`

## 🎨 UI Features

- **Smooth Animations**: Professional 400ms cubic-bezier transitions
- **Responsive Design**: Mobile-first approach
- **Dark Mode Ready**: Modern gradient designs
- **Interactive Elements**: Hover effects and micro-interactions
- **Image Modals**: Full-screen image viewer
- **Real-time Updates**: Dynamic content updates

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- FastAPI for the modern Python web framework
- shadcn/ui for the beautiful components
- OpenAI for AI capabilities

docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
