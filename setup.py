"""
Setup script for initial project configuration.
Run this after cloning the repository.
"""

import os
import sys
import subprocess
from pathlib import Path


def print_header(text: str):
    """Print formatted header."""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60 + "\n")


def run_command(command: str, cwd: str = None) -> bool:
    """Run shell command and return success status."""
    try:
        subprocess.run(command, shell=True, check=True, cwd=cwd)
        return True
    except subprocess.CalledProcessError:
        return False


def check_prerequisites():
    """Check if required tools are installed."""
    print_header("Checking Prerequisites")

    required_tools = {
        "python": "python --version",
        "node": "node --version",
        "npm": "npm --version",
        "docker": "docker --version",
    }

    missing_tools = []

    for tool, command in required_tools.items():
        if run_command(command):
            print(f"✓ {tool} is installed")
        else:
            print(f"✗ {tool} is NOT installed")
            missing_tools.append(tool)

    if missing_tools:
        print(f"\n⚠️  Missing tools: {', '.join(missing_tools)}")
        print("Please install the missing tools and try again.")
        return False

    print("\n✓ All prerequisites are installed!")
    return True


def setup_backend():
    """Setup backend environment."""
    print_header("Setting Up Backend")

    backend_dir = Path("backend")

    # Create virtual environment
    print("Creating Python virtual environment...")
    if not run_command("python -m venv venv", cwd=str(backend_dir)):
        print("✗ Failed to create virtual environment")
        return False
    print("✓ Virtual environment created")

    # Install dependencies
    print("\nInstalling Python dependencies...")
    pip_command = "venv\\Scripts\\pip" if sys.platform == "win32" else "venv/bin/pip"
    if not run_command(
        f"{pip_command} install -r requirements-dev.txt", cwd=str(backend_dir)
    ):
        print("✗ Failed to install dependencies")
        return False
    print("✓ Dependencies installed")

    # Copy .env.example to .env
    env_example = backend_dir / ".env.example"
    env_file = backend_dir / ".env"

    if not env_file.exists():
        print("\nCreating .env file...")
        env_file.write_text(env_example.read_text())
        print("✓ .env file created")
        print("⚠️  Please edit backend/.env with your configuration")
    else:
        print("\n✓ .env file already exists")

    # Create necessary directories
    print("\nCreating directories...")
    (backend_dir / "logs").mkdir(exist_ok=True)
    (backend_dir / "uploads" / "images" / "temp").mkdir(parents=True, exist_ok=True)
    print("✓ Directories created")

    return True


def setup_frontend():
    """Setup frontend environment."""
    print_header("Setting Up Frontend")

    frontend_dir = Path("frontend")

    # Install dependencies
    print("Installing Node.js dependencies...")
    if not run_command("npm install", cwd=str(frontend_dir)):
        print("✗ Failed to install dependencies")
        return False
    print("✓ Dependencies installed")

    # Copy .env.local.example to .env.local
    env_example = frontend_dir / ".env.local.example"
    env_file = frontend_dir / ".env.local"

    if not env_file.exists():
        print("\nCreating .env.local file...")
        env_file.write_text(env_example.read_text())
        print("✓ .env.local file created")
        print("⚠️  Please edit frontend/.env.local if needed")
    else:
        print("\n✓ .env.local file already exists")

    return True


def print_next_steps():
    """Print next steps for the user."""
    print_header("Setup Complete!")

    print("Next steps:")
    print("\n1. Configure your environment variables:")
    print("   - Edit backend/.env with your API keys and database credentials")
    print("   - Edit frontend/.env.local if needed")

    print("\n2. Start PostgreSQL and Redis:")
    print("   - Option A: Using Docker Compose")
    print("     docker-compose up -d postgres redis")
    print("   - Option B: Install and start manually")

    print("\n3. Run database migrations:")
    print("   cd backend")
    if sys.platform == "win32":
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    print("   alembic upgrade head")

    print("\n4. Start the development servers:")
    print("   - Backend: cd backend && uvicorn app.main:app --reload")
    print("   - Frontend: cd frontend && npm run dev")

    print("\n5. Access the application:")
    print("   - Frontend: http://localhost:3000")
    print("   - Backend API: http://localhost:8000")
    print("   - API Docs: http://localhost:8000/api/docs")

    print("\nFor more information, see:")
    print("   - docs/ARCHITECTURE.md - Project architecture")
    print("   - docs/CONTRIBUTING.md - Contributing guidelines")
    print("   - README.md - Complete documentation")

    print("\n" + "=" * 60)


def main():
    """Main setup function."""
    print_header("Social Media Automation Platform - Setup")

    # Check if we're in the project root
    if not Path("backend").exists() or not Path("frontend").exists():
        print("✗ Error: Please run this script from the project root directory")
        sys.exit(1)

    # Check prerequisites
    if not check_prerequisites():
        sys.exit(1)

    # Setup backend
    if not setup_backend():
        print("\n✗ Backend setup failed")
        sys.exit(1)

    # Setup frontend
    if not setup_frontend():
        print("\n✗ Frontend setup failed")
        sys.exit(1)

    # Print next steps
    print_next_steps()


if __name__ == "__main__":
    main()
