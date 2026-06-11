# CrmStella

Modern Education CRM system built with ASP.NET Core Web API, Blazor WebAssembly, EF Core, and PostgreSQL using Clean Architecture principles.

## 🚀 Tech Stack

- .NET 8
- ASP.NET Core Web API
- Blazor WebAssembly
- Entity Framework Core
- PostgreSQL
- JWT Authentication
- Clean Architecture
- Repository Pattern
- Result Pattern

---

## 📚 Main Features

- Authentication & Authorization
- Student & Mentor Management
- Courses & Groups
- Lesson Scheduling
- Attendance Tracking
- Homework & Submissions
- Lesson Scores & Exams
- Payments & Balance Tracking
- Notifications
- Audit Logs
- File Storage System

---

## 🏗 Architecture

```text
Domain
Application
Infrastructure
WebApi
BlazorWebAssembly
```

Project follows:
- Clean Architecture
- SOLID Principles
- Separation of Concerns
- Scalable Production-Level Structure

---

## 🔐 Authentication

- JWT Access Token
- Refresh Token
- Custom User System (without ASP.NET Identity)
- BCrypt Password Hashing

---

## 📦 Database

PostgreSQL + EF Core Code First

Run migrations:

```bash
dotnet ef migrations add InitialCreate --project Infrastructure --startup-project WebApi
```

Update database:

```bash
dotnet ef database update --project Infrastructure --startup-project WebApi
```

---

## 👨‍💻 Team

Education CRM developed as a collaborative team project.

- Backend Developers (.NET)
- Mobile Developer (Flutter)
- Web Frontend (Blazor)

---

## 📌 Current Development Phases

### Phase 1
- Auth
- Users
- Courses
- Groups
- Attendance
- Payments

### Phase 2
- Homework
- Lesson Scores
- Student Progress

### Phase 3
- Exams
- Notifications
- Audit Logs
- Reports

---

## 📄 License

This project is for educational and portfolio purposes.
