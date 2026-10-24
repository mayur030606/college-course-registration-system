# College Course Registration System

A full-stack DBMS mini project built with **React + Vite** frontend and **Java Spring Boot** backend, using **MySQL** as the database.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios |
| Backend | Java 21, Spring Boot 3.2, Spring Data JPA, Spring Security |
| Database | MySQL 8.0+ |
| Authentication | HTTP Basic Auth with BCrypt password hashing |

## 📁 Project Structure

```
CollegeCourseRegistration/
├── frontend/          # React + Vite frontend
├── backend/           # Spring Boot backend
├── database/
│   └── schema.sql     # MySQL schema and sample data
├── .gitignore
└── README.md
```

## 🚀 Setup Instructions (Windows 11)

### Prerequisites
- Java JDK 21
- Node.js 18+ and npm
- MySQL 8.0+ (via MySQL Workbench or CLI)
- Apache Maven 3.9+

### Step 1: Create the Database & Tables

Run the safe, automated PowerShell setup script from the project root:
```powershell
.\setup-database.ps1
```
*(Prompts for your MySQL username [default: root] and securely for your password; never hardcodes credentials. It creates the database, all 5 tables, and sample data without dropping or duplicating records).*

**Or** execute directly in MySQL Workbench / CLI:
```sql
SOURCE C:/Users/mayur/OneDrive/Desktop/DBMS Project/database/schema.sql;
```

### Step 2: Set Environment Variables

Open PowerShell and set these environment variables:

```powershell
# Database connection
$env:DB_URL = "jdbc:mysql://localhost:3306/CollegeRegistration?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your_mysql_password"

# Owner account bootstrap (first time only)
$env:OWNER_USERNAME = "owner"
$env:OWNER_PASSWORD = "YourSecurePassword123!"
$env:OWNER_EMAIL = "owner@college.edu"
$env:OWNER_FULLNAME = "System Owner"
```

> ⚠️ Replace `your_mysql_password` with your actual MySQL root password.
> ⚠️ Choose a strong owner password. This is only used once to create the first owner account.

**For persistent environment variables** (optional), use System Settings → Environment Variables, or add them to your PowerShell profile.

### Step 3: Start the Backend

You can run the helper script:
```powershell
.\start-backend.ps1
```
*(Prompts for database and owner bootstrap passwords securely if not already in environment)*

**Or** manual command:
```powershell
cd "c:\Users\mayur\OneDrive\Desktop\DBMS Project\backend"
mvn spring-boot:run
```

The backend starts on **http://localhost:8080**.

### Step 4: Start the Frontend

Open a **new** PowerShell window:
```powershell
.\start-frontend.ps1
```

**Or** manual command:
```powershell
cd "c:\Users\mayur\OneDrive\Desktop\DBMS Project\frontend"
npm run dev
```

The frontend starts on **http://localhost:5173**.

### Step 5: Login

1. Open **http://localhost:5173** in your browser
2. Login with the owner credentials you set in Step 2
3. You'll see the full dashboard with all features including the Database Explorer

## 🔐 Security

- **Passwords** are hashed with BCrypt before storage
- **Owner account** is bootstrapped from environment variables (one-time)
- **Database credentials** are read from environment variables, never hardcoded
- **Owner dashboard** endpoints are protected by Spring Security role checks
- **Database Explorer** only inspects allowlisted tables with parameterized queries
- **Password hashes** are never exposed in any API response
- **No arbitrary SQL** execution through the browser

## 📋 Features

### Main Application
- ✅ Student CRUD with search, filter, sort, pagination
- ✅ Department CRUD management
- ✅ Course management with enrollment counts
- ✅ Course registration with duplicate prevention
- ✅ Dashboard with statistics cards
- ✅ CSV export for all data
- ✅ Confirmation dialogs before deletion
- ✅ Toast notifications for all operations
- ✅ Responsive design (desktop + mobile)

### Owner Dashboard (Database Explorer)
- ✅ View all database tables with record counts
- ✅ Inspect table structures (columns, types, keys)
- ✅ Browse records with pagination and search
- ✅ View student-course relationships
- ✅ Database connection status (no credentials exposed)
- ✅ CSV export for records
- ✅ Refresh data on demand

## 🧪 Testing

### Test Database Connection
```powershell
curl http://localhost:8080/api/owner/db-status -u owner:YourSecurePassword123!
```

### Test Owner Access
```powershell
# Should succeed (owner)
curl http://localhost:8080/api/owner/tables -u owner:YourSecurePassword123!

# Should fail (wrong credentials)
curl http://localhost:8080/api/owner/tables -u student:wrong
```

### Test CRUD Operations
```powershell
# Get all students
curl http://localhost:8080/api/students -u owner:YourSecurePassword123!

# Get dashboard stats
curl http://localhost:8080/api/dashboard/stats -u owner:YourSecurePassword123!
```

## 🔧 Troubleshooting

### "Access denied for user"
- Check your MySQL password is correct in the `DB_PASSWORD` environment variable
- Make sure the MySQL user has access to the `CollegeRegistration` database

### "Table doesn't exist"
- Run the `database/schema.sql` script in MySQL first
- Make sure you're connected to the `CollegeRegistration` database

### "Connection refused" on backend
- Make sure MySQL is running
- Check the port (default 3306) in your `DB_URL`

### "Network Error" on frontend
- Make sure the backend is running on port 8080
- Check the Vite proxy configuration in `vite.config.js`

### Maven build fails
- Make sure Java 21 is installed: `java --version`
- Make sure Maven is installed: `mvn --version`
- Try `mvn clean install -DskipTests` first

### Owner login doesn't work
- Make sure you set `OWNER_USERNAME` and `OWNER_PASSWORD` env vars **before** starting the backend
- Check the backend console for "Owner account created" message
- If you need to reset, delete the owner from the `admin` table and restart with env vars set

## 📄 License

This project is for educational purposes (DBMS Mini Project).
