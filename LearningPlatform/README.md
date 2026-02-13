# Super Admin Web Application

A comprehensive super admin dashboard for managing teachers and students in the Learning Platform.

## Features

- **Dashboard**: Overview statistics (Total Teachers, Total Students, Total Bookings)
- **Teachers Management**: Full CRUD operations with table view
- **Students Management**: Full CRUD operations with table view
- **Actions Available**:
  - **Preview**: View detailed information about a teacher/student
  - **Update**: Edit teacher/student information
  - **Audit**: View activity history (bookings, etc.)
  - **Delete**: Remove teacher/student from the system

## Tech Stack

- React 19
- Vite
- Tailwind CSS 4
- React Router DOM
- React Icons
- Supabase (for database operations)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (optional):
Create a `.env` file in the root directory:
```
VITE_API_URL=http://192.168.1.9:3000
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx       # Navigation bar with Dashboard, Teachers, Students links
│   ├── Footer.jsx       # Footer component
│   ├── DataTable.jsx    # Reusable table component with pagination and search
│   └── Modal.jsx        # Reusable modal component
├── pages/
│   ├── Dashboard.jsx    # Dashboard with statistics
│   ├── Teachers.jsx     # Teachers management page
│   └── Students.jsx     # Students management page
├── services/
│   └── api.js           # API service layer for Supabase operations
├── config/
│   └── supabase.js      # Supabase client configuration
├── App.jsx              # Main app component with routing
└── main.jsx             # Entry point
```

## Database Connection

The application connects to Supabase using the configuration in `src/config/supabase.js`. Make sure you have:

1. Supabase project URL
2. Supabase anon key
3. Proper RLS (Row Level Security) policies set up for super_admin role

## Features Details

### Table Features
- **Search**: Filter data by any column
- **Pagination**: Navigate through pages of data
- **Sorting**: Click column headers to sort (if implemented)
- **Responsive**: Works on desktop and mobile devices

### CRUD Operations
- **Create**: Add new teachers/students (can be extended)
- **Read**: View all teachers/students in table format
- **Update**: Edit existing teacher/student information via modal
- **Delete**: Remove teacher/student with confirmation

### Additional Actions
- **Preview**: View complete information in a read-only modal
- **Audit**: View activity history including bookings and related records

## Notes

- The application requires a user with `super_admin` role in the `profiles` table
- RLS policies must be configured to allow super_admin to read/update/delete all records
- The backend API URL can be configured via environment variables
