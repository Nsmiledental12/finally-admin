# Doctor Portal - Local Development Setup Guide

## Overview
This application connects to a PostgreSQL database to display and manage doctor applications. The architecture includes:
- **Frontend**: React + TypeScript + Vite (runs on port 5174)
- **Backend**: Node.js + Express + PostgreSQL (runs on port 3002)

**For AWS/Production Deployment**: See [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)

## Prerequisites
- Node.js installed
- PostgreSQL database running locally with doctor data
- Your doctors table must have the following columns:
  - id, full_name, email, password, country_code, mobile_number
  - license_number, specialization, year_of_experience, clinic_address
  - created_at, updated_at, status

## Setup Instructions

### Step 1: Configure Backend Database Connection

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your PostgreSQL credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=postgres
   DB_PASSWORD=your_password
   PORT=3002
   CORS_ORIGIN=http://localhost:5174
   DB_SSL=false
   ```

### Step 2: Add Status Column to Your Database (if not present)

If your doctors table doesn't have a `status` column, run this SQL command:

```sql
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'new';
```

Valid status values are: 'new', 'in-process', 'pending', 'accepted', 'rejected'

### Step 3: Start the Backend Server

From the backend directory:

```bash
npm install
npm run dev
```

The backend server will start on http://localhost:3002

You can test the connection at: http://localhost:3002/api/health

### Step 4: Start the Frontend Application

From the project root directory:

```bash
npm run dev
```

The frontend will start on http://localhost:5174

**Note**: Make sure the backend is running on port 3002 before starting the frontend.

## API Endpoints

The backend provides the following endpoints:

- `GET /api/doctors` - Fetch all doctor applications
- `GET /api/doctors/:id` - Fetch a single doctor by ID
- `GET /api/doctors/status/:status` - Fetch doctors by status
- `PUT /api/doctors/:id/status` - Update doctor application status
- `GET /api/health` - Health check endpoint

## Troubleshooting

### Database Connection Errors
- Verify PostgreSQL is running
- Check your `.env` credentials are correct
- Ensure the database and table exist
- Check firewall settings allow connection to PostgreSQL

### CORS Errors
- Backend includes CORS middleware for localhost
- If deploying, update CORS settings in `backend/server.js`

### Port Conflicts
- If port 3002 is in use, change PORT in `backend/.env`
- Update VITE_API_BASE_URL in `.env` accordingly
- If port 5174 is in use, change port in `vite.config.ts`

### Environment Variables Not Working
- Frontend: Make sure variables start with `VITE_`
- Restart dev servers after changing `.env` files
- Backend: Variables must be in `backend/.env`, not root `.env`

## Project Structure

```
project/
├── backend/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection pool
│   ├── routes/
│   │   └── doctors.js           # Doctor API endpoints
│   ├── server.js                # Express server
│   ├── package.json
│   └── .env                     # Database credentials (create this)
├── src/
│   ├── components/
│   │   └── DoctorApplications.tsx   # Main UI component
│   ├── services/
│   │   └── doctorService.ts         # API client functions
│   └── types/
│       └── doctor.ts                # TypeScript interfaces
└── package.json
```

## Next Steps

After setup, you can:
1. View all doctor applications from your database
2. Filter applications by status
3. Search doctors by name or specialization
4. Update application statuses (new, in-process, pending, accepted, rejected)
5. View detailed information for each application

All changes are persisted to your local PostgreSQL database.
