# Backend Scripts

This directory contains utility scripts for development, testing, and maintenance.

## Available Scripts

### `test_api.py`
Comprehensive API testing script that validates all endpoints.

**Usage:**
```bash
python scripts/test_api.py
```

**Features:**
- Tests authentication (register, login)
- Tests content generation
- Tests social account management
- Tests post creation

### `test_db.py`
Database connection testing utility.

**Usage:**
```bash
python scripts/test_db.py
```

**Checks:**
- PostgreSQL connection
- Database version
- Available databases

### `check_oauth_config.py`
LinkedIn OAuth configuration validator.

**Usage:**
```bash
python scripts/check_oauth_config.py
```

**Validates:**
- Required environment variables
- OAuth redirect URIs
- Configuration completeness

## Requirements

All scripts require the backend dependencies to be installed:

```bash
pip install -r requirements.txt
```

Make sure your `.env` file is properly configured before running these scripts.
