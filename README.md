# School ERP Software

This repository contains a starter School ERP project scaffold for a Node.js + Supabase + React application.

## Structure

```bash
school-erp/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── routes/
│   ├── middleware/
│   ├── controllers/
│   └── supabaseClient.js
│
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── index.css
│       └── components/
│           └── AddStudent.js
│
└── README.md
```

## Getting started

### Backend

1. Copy `backend/.env.example` to `backend/.env` and set the Supabase variables.
2. Run:

```bash
cd backend
npm install
npm run dev
```

### Frontend

1. Run:

```bash
cd frontend
npm install
npm start
```

## Supabase tables

Create the following tables in Supabase:

- `students`
- `teachers`
- `fees`
- `attendance`
- `exams`
- `marks`

## Notes

- The backend exposes student, teacher, fee, attendance, exam, and marks APIs.
- Sample API routes include:
  - `GET /api/students/all`
  - `POST /api/students/add`
  - `GET /api/teachers/all`
  - `POST /api/teachers/add`
  - `GET /api/fees/all`
  - `POST /api/fees/add`
  - `GET /api/attendance/all`
  - `POST /api/attendance/add`
  - `GET /api/exams/all`
  - `POST /api/exams/add`
  - `GET /api/marks/all`
  - `POST /api/marks/add`
- The frontend includes a student form example that posts to the backend.
