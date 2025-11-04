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
DATABASE_URL_SYNC=postgresql://user:pass@localhost:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-here-min-32-chars
ALGORITHM=HS256

# URLs
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GEMINI_API_KEY=your-gemini-api-key

# Facebook/Instagram OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
INSTAGRAM_APP_ID=your-facebook-app-id
INSTAGRAM_APP_SECRET=your-facebook-app-secret
INSTAGRAM_REDIRECT_URI=http://localhost:8000/api/v1/oauth/instagram/callback

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Twitter OAuth
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# TikTok OAuth
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

See `backend/.env.example` for a complete template.

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

See `frontend/.env.example` for a complete template.

## 🔐 OAuth Setup

This application uses OAuth 2.0 for secure social media account connections. Each platform requires specific configuration:

### Instagram OAuth Setup
Instagram uses Facebook's OAuth system. Follow the detailed guide:
- **Quick Start**: See `INSTAGRAM_OAUTH_CHECKLIST.md`
- **Full Guide**: See `INSTAGRAM_OAUTH_SETUP.md`
- **Summary of Changes**: See `OAUTH_FIXES_SUMMARY.md`

**Quick Steps:**
1. Create a Facebook App at https://developers.facebook.com/
2. Add Instagram product to your app
3. Configure OAuth redirect URIs
4. Link your Instagram Business account to a Facebook Page
5. Set environment variables (see above)
6. Test the connection flow

### Other Platforms
- **LinkedIn**: Create app at https://www.linkedin.com/developers/
- **Twitter**: Create app at https://developer.twitter.com/
- **TikTok**: Create app at https://developers.tiktok.com/
- **Facebook**: Use same app as Instagram

Each platform requires:
1. Creating a developer account
2. Registering your application
3. Configuring OAuth redirect URIs
4. Setting up required permissions/scopes
5. Adding credentials to `.env` file

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

### Authentication
- **POST** `/api/v1/auth/register` - Register new user
- **POST** `/api/v1/auth/login` - Login user
- **GET** `/api/v1/auth/me` - Get current user
- **POST** `/api/v1/auth/refresh` - Refresh access token

### Content Management
- **POST** `/api/v1/content/generate` - Generate AI content
- **POST** `/api/v1/content/create` - Create custom content
- **GET** `/api/v1/content` - List content (with filters)
- **GET** `/api/v1/content/{id}` - Get specific content
- **POST** `/api/v1/content/{id}/approve` - Approve content
- **POST** `/api/v1/content/{id}/regenerate-captions` - Regenerate captions
- **POST** `/api/v1/content/{id}/regenerate-image` - Regenerate image
- **DELETE** `/api/v1/content/{id}` - Delete content

### Social Accounts
- **GET** `/api/v1/social-accounts` - List connected accounts
- **GET** `/api/v1/social-accounts/{id}` - Get specific account
- **POST** `/api/v1/social-accounts/{id}/verify` - Verify account connection
- **DELETE** `/api/v1/social-accounts/{id}` - Disconnect account
- **GET** `/api/v1/social-accounts/platforms/available` - List available platforms

### OAuth
- **GET** `/api/v1/oauth/{platform}/authorize` - Get OAuth URL
- **GET** `/api/v1/oauth/{platform}/callback` - OAuth callback handler
  - Platforms: `instagram`, `facebook`, `linkedin`, `twitter`, `tiktok`

### Posts
- **POST** `/api/v1/posts` - Create and schedule post
- **GET** `/api/v1/posts` - List posts (with filters)
- **GET** `/api/v1/posts/{id}` - Get specific post
- **POST** `/api/v1/posts/{id}/retry` - Retry failed post
- **GET** `/api/v1/posts/{id}/stats` - Get post statistics
- **DELETE** `/api/v1/posts/{id}` - Delete post

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

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start Frontend
npm run dev
