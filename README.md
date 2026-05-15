# Education CRM — Production-Level Domain Entities

> Stack: .NET 8 / ASP.NET Core Web API / EF Core / PostgreSQL / Blazor WebAssembly  
> Architecture: Clean Architecture + Result Pattern + Repository Pattern + JWT Auth without Identity  
> Namespace: `Domain.Entities`

---

## 1. Main Improvements

Ин версия entity-ҳоро тоза мекунад, такроршавиро кам мекунад ва domain model-ро барои real CRM мувофиқ мекунад.

### Problems fixed

- `Shedule` renamed to `Schedule`.
- `Attendance` changed from `bool IsPresent` to `AttendanceStatus` enum.
- `LessonScore` separated from homework submission logic.
- Added `HomeworkSubmission`.
- Added `Exam` and `ExamResult`.
- Added `FileStorage` for all uploaded files.
- Added `VerificationCodeType`, `IsUsed`, `Attempts`.
- `WeekResult` used only for weekly analytics.
- `StudentProgress` used only for total group progress.
- `AuditLog` improved for production usage.
- `Profile`, `Student`, and `Mentor` responsibilities are separated more clearly.

---

## 2. Recommended Folder Structure

```text
Domain
├── Entities
│   ├── User.cs
│   ├── Role.cs
│   ├── Profile.cs
│   ├── Student.cs
│   ├── Mentor.cs
│   ├── Course.cs
│   ├── Group.cs
│   ├── GroupStudent.cs
│   ├── Lesson.cs
│   ├── Schedule.cs
│   ├── Attendance.cs
│   ├── Homework.cs
│   ├── HomeworkSubmission.cs
│   ├── LessonScore.cs
│   ├── Exam.cs
│   ├── ExamResult.cs
│   ├── WeekResult.cs
│   ├── StudentProgress.cs
│   ├── Payment.cs
│   ├── Notification.cs
│   ├── VerificationCode.cs
│   ├── FileStorage.cs
│   └── AuditLog.cs
│
├── Enums
│   ├── UserRole.cs
│   ├── GroupStatus.cs
│   ├── AttendanceStatus.cs
│   ├── PaymentType.cs
│   ├── PaymentMethod.cs
│   ├── NotificationType.cs
│   ├── VerificationCodeType.cs
│   ├── FileOwnerType.cs
│   └── ExamResultStatus.cs
```

---

# 3. Enums

## `UserRole.cs`

```csharp
namespace Domain.Enums;

public enum UserRole
{
    Admin = 1,
    Mentor = 2,
    Student = 3
}
```

## `GroupStatus.cs`

```csharp
namespace Domain.Enums;

public enum GroupStatus
{
    Active = 1,
    Completed = 2,
    Paused = 3,
    Cancelled = 4
}
```

## `AttendanceStatus.cs`

```csharp
namespace Domain.Enums;

public enum AttendanceStatus
{
    Present = 1,
    Absent = 2,
    Late = 3,
    Excused = 4
}
```

## `PaymentType.cs`

```csharp
namespace Domain.Enums;

public enum PaymentType
{
    Payment = 1,
    Debt = 2,
    Refund = 3,
    Bonus = 4,
    Discount = 5
}
```

## `PaymentMethod.cs`

```csharp
namespace Domain.Enums;

public enum PaymentMethod
{
    Cash = 1,
    Card = 2,
    Transfer = 3,
    Online = 4,
    Other = 5
}
```

## `NotificationType.cs`

```csharp
namespace Domain.Enums;

public enum NotificationType
{
    Info = 1,
    Success = 2,
    Warning = 3,
    Error = 4,
    Payment = 5,
    Lesson = 6,
    Exam = 7,
    Homework = 8
}
```

## `VerificationCodeType.cs`

```csharp
namespace Domain.Enums;

public enum VerificationCodeType
{
    EmailConfirmation = 1,
    PasswordReset = 2,
    LoginTwoFactor = 3,
    PhoneConfirmation = 4
}
```

## `FileOwnerType.cs`

```csharp
namespace Domain.Enums;

public enum FileOwnerType
{
    Lesson = 1,
    Homework = 2,
    HomeworkSubmission = 3,
    Profile = 4,
    PaymentReceipt = 5,
    Course = 6
}
```

## `ExamResultStatus.cs`

```csharp
namespace Domain.Enums;

public enum ExamResultStatus
{
    Failed = 1,
    Passed = 2
}
```

---

# 4. Entities

## `Role.cs`

```csharp
namespace Domain.Entities;

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }

    public ICollection<User> Users { get; set; } = new List<User>();
}
```

---

## `User.cs`

```csharp
using Domain.Enums;

namespace Domain.Entities;

public class User
{
    public int Id { get; set; }

    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string FullName => $"{FirstName} {LastName}".Trim();

    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string PasswordHash { get; set; } = null!;

    public int RoleId { get; set; }
    public bool IsActive { get; set; } = true;

    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    public string? InviteToken { get; set; }
    public DateTime? InviteTokenExpiry { get; set; }
    public bool IsPasswordSet { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Role Role { get; set; } = null!;
    public Profile? Profile { get; set; }
    public Mentor? Mentor { get; set; }
    public Student? Student { get; set; }

    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<VerificationCode> VerificationCodes { get; set; } = new List<VerificationCode>();
}
```

### Note

`User` бояд authentication/account entity бошад. Маълумоти иловагӣ мисли avatar, bio, telegram, github дар `Profile` бошад.

---

## `Profile.cs`

```csharp
namespace Domain.Entities;

public class Profile
{
    public int Id { get; set; }
    public int UserId { get; set; }

    public string? AvatarUrl { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? TelegramUsername { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? GithubUrl { get; set; }
    public string? AboutMe { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User User { get; set; } = null!;
}
```

---

## `Student.cs`

```csharp
namespace Domain.Entities;

public class Student
{
    public int Id { get; set; }
    public int UserId { get; set; }

    public decimal Balance { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;

    public ICollection<GroupStudent> GroupStudents { get; set; } = new List<GroupStudent>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<HomeworkSubmission> HomeworkSubmissions { get; set; } = new List<HomeworkSubmission>();
    public ICollection<LessonScore> LessonScores { get; set; } = new List<LessonScore>();
    public ICollection<ExamResult> ExamResults { get; set; } = new List<ExamResult>();
    public ICollection<WeekResult> WeekResults { get; set; } = new List<WeekResult>();
    public ICollection<StudentProgress> StudentProgresses { get; set; } = new List<StudentProgress>();
}
```

---

## `Mentor.cs`

```csharp
namespace Domain.Entities;

public class Mentor
{
    public int Id { get; set; }
    public int UserId { get; set; }

    public string? Specialization { get; set; }
    public int? ExperienceYears { get; set; }
    public DateTime HireDate { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;
    public ICollection<Group> Groups { get; set; } = new List<Group>();
    public ICollection<Course> Courses { get; set; } = new List<Course>();
}
```

---

## `Course.cs`

```csharp
namespace Domain.Entities;

public class Course
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? IconUrl { get; set; }
    public int DurationWeeks { get; set; }
    public bool IsActive { get; set; } = true;

    public int? MentorId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Mentor? Mentor { get; set; }
    public ICollection<Group> Groups { get; set; } = new List<Group>();
}
```

---

## `Group.cs`

```csharp
using Domain.Enums;

namespace Domain.Entities;

public class Group
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;
    public int CourseId { get; set; }
    public int MentorId { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int MaxStudents { get; set; } = 15;
    public GroupStatus Status { get; set; } = GroupStatus.Active;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Course Course { get; set; } = null!;
    public Mentor Mentor { get; set; } = null!;

    public ICollection<GroupStudent> GroupStudents { get; set; } = new List<GroupStudent>();
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Exam> Exams { get; set; } = new List<Exam>();
    public ICollection<WeekResult> WeekResults { get; set; } = new List<WeekResult>();
    public ICollection<StudentProgress> StudentProgresses { get; set; } = new List<StudentProgress>();
}
```

---

## `GroupStudent.cs`

```csharp
namespace Domain.Entities;

public class GroupStudent
{
    public int Id { get; set; }

    public int GroupId { get; set; }
    public int StudentId { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LeftAt { get; set; }
    public bool IsActive { get; set; } = true;
    public string? RemoveReason { get; set; }

    public int? TransferredFromGroupStudentId { get; set; }
    public int? TransferredToGroupStudentId { get; set; }

    public Group Group { get; set; } = null!;
    public Student Student { get; set; } = null!;

    public GroupStudent? TransferredFrom { get; set; }
    public GroupStudent? TransferredTo { get; set; }
}
```

### Rule

Дар EF Core бояд unique index дошта бошад:

```csharp
builder.HasIndex(x => new { x.GroupId, x.StudentId })
       .IsUnique()
       .HasFilter("\"IsActive\" = true");
```

---

## `Schedule.cs`

```csharp
namespace Domain.Entities;

public class Schedule
{
    public int Id { get; set; }

    public int GroupId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? Room { get; set; }

    public DateTime RecurringFrom { get; set; }
    public DateTime? RecurringTo { get; set; }

    public Group Group { get; set; } = null!;
}
```

---

## `Lesson.cs`

```csharp
namespace Domain.Entities;

public class Lesson
{
    public int Id { get; set; }

    public int GroupId { get; set; }
    public int WeekNumber { get; set; }
    public int OrderIndex { get; set; }

    public string Title { get; set; } = null!;
    public string? Description { get; set; }

    public DateTime LessonDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }

    public bool IsCompleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Group Group { get; set; } = null!;

    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<Homework> Homeworks { get; set; } = new List<Homework>();
    public ICollection<LessonScore> LessonScores { get; set; } = new List<LessonScore>();
    public ICollection<FileStorage> Files { get; set; } = new List<FileStorage>();
}
```

---

## `Attendance.cs`

```csharp
using Domain.Enums;

namespace Domain.Entities;

public class Attendance
{
    public int Id { get; set; }

    public int LessonId { get; set; }
    public int StudentId { get; set; }

    public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;
    public string? AbsenceReason { get; set; }
    public string? MentorNote { get; set; }

    public int? MarkedByMentorId { get; set; }
    public DateTime MarkedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Lesson Lesson { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Mentor? MarkedByMentor { get; set; }
}
```

---

## `Homework.cs`

```csharp
namespace Domain.Entities;

public class Homework
{
    public int Id { get; set; }

    public int LessonId { get; set; }

    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string? FileUrl { get; set; }

    public DateTime Deadline { get; set; }
    public int MaxScore { get; set; } = 100;
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Lesson Lesson { get; set; } = null!;
    public ICollection<HomeworkSubmission> Submissions { get; set; } = new List<HomeworkSubmission>();
}
```

---

## `HomeworkSubmission.cs`

```csharp
namespace Domain.Entities;

public class HomeworkSubmission
{
    public int Id { get; set; }

    public int HomeworkId { get; set; }
    public int StudentId { get; set; }

    public string? TextAnswer { get; set; }
    public string? FileUrl { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public bool IsLate { get; set; } = false;

    public Homework Homework { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public LessonScore? LessonScore { get; set; }
}
```

### Why separate this?

`HomeworkSubmission` — кори супоридаи student.  
`LessonScore` — баҳогузории mentor.  
Инҳоро як entity кардан заиф аст, чун workflow-и онҳо гуногун аст.

---

## `LessonScore.cs`

```csharp
namespace Domain.Entities;

public class LessonScore
{
    public int Id { get; set; }

    public int LessonId { get; set; }
    public int StudentId { get; set; }
    public int? HomeworkSubmissionId { get; set; }

    public decimal Score { get; set; }
    public string? MentorFeedback { get; set; }

    public int? ScoredByMentorId { get; set; }
    public DateTime ScoredAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Lesson Lesson { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public HomeworkSubmission? HomeworkSubmission { get; set; }
    public Mentor? ScoredByMentor { get; set; }
}
```

### Rule

Score бояд `0 <= Score <= 5` бошад, агар lesson score аст.  
Агар homework score аз 100 бошад, онро дар `HomeworkSubmission` ё separate `HomeworkScore` нигоҳ доштан мумкин аст.

Барои CRM-и ту беҳтар аст:

- LessonScore: 0–5
- Homework.MaxScore: 100
- WeekResult.TotalScore: calculated

---

## `Exam.cs`

```csharp
namespace Domain.Entities;

public class Exam
{
    public int Id { get; set; }

    public int GroupId { get; set; }

    public string Title { get; set; } = null!;
    public string? Description { get; set; }

    public DateTime ExamDate { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }

    public decimal PassScore { get; set; } = 70;
    public decimal MaxScore { get; set; } = 100;

    public int? CreatedByMentorId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Group Group { get; set; } = null!;
    public Mentor? CreatedByMentor { get; set; }
    public ICollection<ExamResult> Results { get; set; } = new List<ExamResult>();
}
```

---

## `ExamResult.cs`

```csharp
using Domain.Enums;

namespace Domain.Entities;

public class ExamResult
{
    public int Id { get; set; }

    public int ExamId { get; set; }
    public int StudentId { get; set; }

    public decimal Score { get; set; }
    public ExamResultStatus Status { get; set; }

    public string? Comment { get; set; }
    public int? ScoredByMentorId { get; set; }
    public DateTime ScoredAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Exam Exam { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Mentor? ScoredByMentor { get; set; }
}
```

### Business rule

```csharp
Status = Score >= Exam.PassScore
    ? ExamResultStatus.Passed
    : ExamResultStatus.Failed;
```

---

## `WeekResult.cs`

```csharp
namespace Domain.Entities;

public class WeekResult
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public int GroupId { get; set; }
    public int WeekNumber { get; set; }

    public decimal LessonAverageScore { get; set; } = 0;
    public decimal HomeworkAverageScore { get; set; } = 0;
    public decimal AttendanceScore { get; set; } = 0;
    public decimal BonusScore { get; set; } = 0;
    public decimal ExamScore { get; set; } = 0;
    public decimal TotalScore { get; set; } = 0;

    public string? MentorComment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Student Student { get; set; } = null!;
    public Group Group { get; set; } = null!;
}
```

### Rule

`BonusScore <= 30` per week per student per group.

---

## `StudentProgress.cs`

```csharp
namespace Domain.Entities;

public class StudentProgress
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public int GroupId { get; set; }

    public int TotalLessons { get; set; } = 0;
    public int AttendedLessons { get; set; } = 0;
    public decimal AttendanceRate { get; set; } = 0;

    public decimal AverageLessonScore { get; set; } = 0;
    public decimal AverageHomeworkScore { get; set; } = 0;
    public decimal TotalBonusScore { get; set; } = 0;

    public int ExamsPassed { get; set; } = 0;
    public int ExamsFailed { get; set; } = 0;

    public decimal OverallProgressPercent { get; set; } = 0;
    public bool IsRecommendedForCertificate { get; set; } = false;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Student Student { get; set; } = null!;
    public Group Group { get; set; } = null!;
}
```

---

## `Payment.cs`

```csharp
using Domain.Enums;

namespace Domain.Entities;

public class Payment
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public int GroupId { get; set; }

    public decimal Amount { get; set; }
    public PaymentType Type { get; set; } = PaymentType.Payment;
    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;

    public DateTime Date { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }

    public bool IsConfirmed { get; set; } = false;
    public string? Note { get; set; }
    public string? ReceiptUrl { get; set; }

    public int? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Student Student { get; set; } = null!;
    public Group Group { get; set; } = null!;
    public User? CreatedByUser { get; set; }
}
```

### Balance rule

```text
Student.Balance = SUM(Payments.Amount)
```

Meaning:

```text
Balance < 0  => debt
Balance = 0  => no debt
Balance > 0  => overpayment / available balance
```

---

## `Notification.cs`

```csharp
using Domain.Enums;

namespace Domain.Entities;

public class Notification
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public NotificationType Type { get; set; } = NotificationType.Info;

    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }

    public User User { get; set; } = null!;
}
```

---

## `VerificationCode.cs`

```csharp
using Domain.Enums;

namespace Domain.Entities;

public class VerificationCode
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public string CodeHash { get; set; } = null!;
    public VerificationCodeType Type { get; set; }

    public DateTime Expiration { get; set; }
    public bool IsUsed { get; set; } = false;
    public int Attempts { get; set; } = 0;
    public int MaxAttempts { get; set; } = 5;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UsedAt { get; set; }

    public User User { get; set; } = null!;
}
```

### Security note

`Code`-ро plain text нигоҳ надор. `CodeHash` нигоҳ дор.  
Ин махсусан барои password reset ва email verification муҳим аст.

---

## `FileStorage.cs`

```csharp
using Domain.Enums;

namespace Domain.Entities;

public class FileStorage
{
    public int Id { get; set; }

    public FileOwnerType OwnerType { get; set; }
    public int OwnerId { get; set; }

    public int? UploadedByUserId { get; set; }

    public string OriginalFileName { get; set; } = null!;
    public string StoredFileName { get; set; } = null!;
    public string FilePath { get; set; } = null!;
    public string? Url { get; set; }

    public long FileSize { get; set; }
    public string MimeType { get; set; } = null!;
    public string? Extension { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public User? UploadedByUser { get; set; }
}
```

### Why this is better

Як `FileStorage` метавонад барои ҳама чиз кор кунад:

- Lesson material
- Homework attachment
- Homework submission file
- Profile avatar
- Payment receipt
- Course icon

---

## `AuditLog.cs`

```csharp
namespace Domain.Entities;

public class AuditLog
{
    public int Id { get; set; }

    public int? UserId { get; set; }

    public string Action { get; set; } = null!;
    public string EntityName { get; set; } = null!;
    public int? EntityId { get; set; }

    public string? OldValues { get; set; }
    public string? NewValues { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
```

---

# 5. Important Relationships

## User relationships

```text
User 1 — 1 Profile
User 1 — 0..1 Student
User 1 — 0..1 Mentor
User * — 1 Role
User 1 — many Notifications
User 1 — many VerificationCodes
```

## Education relationships

```text
Course 1 — many Groups
Mentor 1 — many Groups
Group 1 — many Lessons
Group 1 — many Schedules
Group 1 — many Exams
Group many — many Student through GroupStudent
```

## Lesson relationships

```text
Lesson 1 — many Attendance
Lesson 1 — many Homework
Lesson 1 — many LessonScore
Homework 1 — many HomeworkSubmission
HomeworkSubmission 1 — 0..1 LessonScore
```

## Analytics relationships

```text
Student + Group => StudentProgress
Student + Group + WeekNumber => WeekResult
Student + Exam => ExamResult
```

---

# 6. Business Rules

## Authentication

- No ASP.NET Identity.
- Use custom `Users` table.
- Password should be hashed by BCrypt.
- Use JWT access token + refresh token.
- Do not store raw verification code. Store hash.

## Attendance

Allowed statuses:

```text
Present
Absent
Late
Excused
```

Unique rule:

```text
One attendance record per student per lesson.
```

## LessonScore

```text
0 <= Score <= 5
```

Unique rule:

```text
One lesson score per student per lesson.
```

## HomeworkSubmission

Unique rule:

```text
One submission per student per homework.
```

Unless you want multiple attempts. If multiple attempts are needed, add:

```csharp
public int AttemptNumber { get; set; }
```

## Weekly result

```text
BonusScore <= 30
```

Unique rule:

```text
One week result per student per group per week number.
```

## Exam result

```text
Score >= Exam.PassScore => Passed
Score < Exam.PassScore => Failed
```

Unique rule:

```text
One result per student per exam.
```

## Balance

```text
Student.Balance = SUM(Payment.Amount)
```

Examples:

```text
Payment  +500  => student paid 500
Debt     -1000 => student owes 1000
Refund   -200  => money returned / balance reduced
Bonus    +100  => internal bonus
```

## AuditLog

Write audit log for:

```text
User.Create
User.Update
User.Delete
Payment.Create
Attendance.Mark
LessonScore.Create
LessonScore.Update
ExamResult.Create
Profile.Update
GroupStudent.Add
GroupStudent.Remove
```

---

# 7. EF Core Configuration Recommendations

## Indexes

Create indexes for:

```text
Users.Email unique
Users.PhoneNumber optional index
Students.UserId unique
Mentors.UserId unique
Profiles.UserId unique
GroupStudents.GroupId + StudentId unique for active records
Attendance.LessonId + StudentId unique
LessonScore.LessonId + StudentId unique
HomeworkSubmission.HomeworkId + StudentId unique
ExamResult.ExamId + StudentId unique
WeekResult.StudentId + GroupId + WeekNumber unique
StudentProgress.StudentId + GroupId unique
Payments.StudentId
Payments.GroupId
AuditLog.UserId
AuditLog.CreatedAt
```

## Decimal precision

```csharp
builder.Property(x => x.Amount).HasPrecision(12, 2);
builder.Property(x => x.Balance).HasPrecision(12, 2);
builder.Property(x => x.Score).HasPrecision(5, 2);
builder.Property(x => x.PassScore).HasPrecision(5, 2);
```

## Delete behavior

Recommended:

```text
User -> Profile: Cascade
User -> Student: Restrict or Cascade depending on business
User -> Mentor: Restrict or Cascade depending on business
Group -> Lessons: Cascade
Lesson -> Attendance: Cascade
Lesson -> Homework: Cascade
Homework -> HomeworkSubmission: Cascade
Student -> Payments: Restrict
Student -> ExamResults: Cascade
Student -> Attendance: Cascade
AuditLog: never cascade-delete important logs
```

---

# 8. Suggested DbContext DbSets

```csharp
public DbSet<User> Users => Set<User>();
public DbSet<Role> Roles => Set<Role>();
public DbSet<Profile> Profiles => Set<Profile>();
public DbSet<Student> Students => Set<Student>();
public DbSet<Mentor> Mentors => Set<Mentor>();

public DbSet<Course> Courses => Set<Course>();
public DbSet<Group> Groups => Set<Group>();
public DbSet<GroupStudent> GroupStudents => Set<GroupStudent>();
public DbSet<Schedule> Schedules => Set<Schedule>();
public DbSet<Lesson> Lessons => Set<Lesson>();

public DbSet<Attendance> Attendances => Set<Attendance>();
public DbSet<Homework> Homeworks => Set<Homework>();
public DbSet<HomeworkSubmission> HomeworkSubmissions => Set<HomeworkSubmission>();
public DbSet<LessonScore> LessonScores => Set<LessonScore>();

public DbSet<Exam> Exams => Set<Exam>();
public DbSet<ExamResult> ExamResults => Set<ExamResult>();

public DbSet<WeekResult> WeekResults => Set<WeekResult>();
public DbSet<StudentProgress> StudentProgresses => Set<StudentProgress>();

public DbSet<Payment> Payments => Set<Payment>();
public DbSet<Notification> Notifications => Set<Notification>();
public DbSet<VerificationCode> VerificationCodes => Set<VerificationCode>();
public DbSet<FileStorage> FileStorages => Set<FileStorage>();
public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
```

---

# 9. Minimal Fluent API Examples

## User configuration

```csharp
builder.Entity<User>(entity =>
{
    entity.HasKey(x => x.Id);

    entity.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
    entity.Property(x => x.LastName).HasMaxLength(100).IsRequired();
    entity.Property(x => x.Email).HasMaxLength(200).IsRequired();
    entity.Property(x => x.PhoneNumber).HasMaxLength(30);
    entity.Property(x => x.PasswordHash).HasMaxLength(512).IsRequired();

    entity.HasIndex(x => x.Email).IsUnique();

    entity.HasOne(x => x.Role)
        .WithMany(x => x.Users)
        .HasForeignKey(x => x.RoleId)
        .OnDelete(DeleteBehavior.Restrict);

    entity.HasOne(x => x.Profile)
        .WithOne(x => x.User)
        .HasForeignKey<Profile>(x => x.UserId)
        .OnDelete(DeleteBehavior.Cascade);
});
```

## GroupStudent configuration

```csharp
builder.Entity<GroupStudent>(entity =>
{
    entity.HasKey(x => x.Id);

    entity.HasIndex(x => new { x.GroupId, x.StudentId })
        .IsUnique();

    entity.HasOne(x => x.Group)
        .WithMany(x => x.GroupStudents)
        .HasForeignKey(x => x.GroupId)
        .OnDelete(DeleteBehavior.Cascade);

    entity.HasOne(x => x.Student)
        .WithMany(x => x.GroupStudents)
        .HasForeignKey(x => x.StudentId)
        .OnDelete(DeleteBehavior.Cascade);
});
```

## Attendance configuration

```csharp
builder.Entity<Attendance>(entity =>
{
    entity.HasKey(x => x.Id);

    entity.HasIndex(x => new { x.LessonId, x.StudentId })
        .IsUnique();

    entity.Property(x => x.Status)
        .HasConversion<string>()
        .HasMaxLength(30)
        .IsRequired();
});
```

## LessonScore configuration

```csharp
builder.Entity<LessonScore>(entity =>
{
    entity.HasKey(x => x.Id);

    entity.HasIndex(x => new { x.LessonId, x.StudentId })
        .IsUnique();

    entity.Property(x => x.Score)
        .HasPrecision(3, 1)
        .IsRequired();
});
```

## Payment configuration

```csharp
builder.Entity<Payment>(entity =>
{
    entity.HasKey(x => x.Id);

    entity.Property(x => x.Amount)
        .HasPrecision(12, 2)
        .IsRequired();

    entity.Property(x => x.Type)
        .HasConversion<string>()
        .HasMaxLength(30)
        .IsRequired();

    entity.Property(x => x.Method)
        .HasConversion<string>()
        .HasMaxLength(30)
        .IsRequired();
});
```

---

# 10. What Not To Do

## Do not put all profile information inside Student and Mentor

Bad:

```csharp
Student.Phone
Student.GithubUrl
Student.AboutMe
Mentor.Phone
Mentor.GithubUrl
Mentor.Bio
```

Better:

```text
Common personal information => Profile
Role-specific information => Student / Mentor
```

## Do not keep attendance as bool

Bad:

```csharp
public bool IsPresent { get; set; }
```

Because it cannot represent:

```text
Late
Excused
Absent with reason
```

Better:

```csharp
public AttendanceStatus Status { get; set; }
```

## Do not merge submission and score

Bad:

```text
LessonScore = submission + score + file + feedback
```

Better:

```text
HomeworkSubmission = what student sent
LessonScore = what mentor graded
```

---

# 11. Final Entity List

| Entity | Purpose |
|---|---|
| User | Login/account/auth |
| Role | Role table |
| Profile | Common personal profile |
| Student | Student-specific data |
| Mentor | Mentor-specific data |
| Course | Course template |
| Group | Real group of students for course |
| GroupStudent | Many-to-many student enrollment |
| Schedule | Weekly recurring schedule |
| Lesson | Concrete lesson |
| Attendance | Student attendance per lesson |
| Homework | Homework task |
| HomeworkSubmission | Student submitted work |
| LessonScore | Mentor score for lesson/homework |
| Exam | Exam for group |
| ExamResult | Student exam result |
| WeekResult | Weekly calculated analytics |
| StudentProgress | Overall group progress |
| Payment | Payment/debt/refund records |
| Notification | User notifications |
| VerificationCode | Secure verification codes |
| FileStorage | Uploaded files |
| AuditLog | Important action history |

---

# 12. Recommended Next Step

After these entities, the next correct step is:

1. Create all `Domain.Entities` classes.
2. Create all `Domain.Enums` classes.
3. Create `ApplicationDbContext`.
4. Create separate EF Core configurations:

```text
Infrastructure/Persistence/Configurations
```

5. Add migration:

```bash
dotnet ef migrations add InitialCreate --project Infrastructure --startup-project WebApi
```

6. Update database:

```bash
dotnet ef database update --project Infrastructure --startup-project WebApi
```

---

# 13. Important Production Advice

Ин project калон аст. Барои 3 разработчик беҳтар аст аввал MVP созед:

## MVP Phase 1

- Auth
- Users
- Roles
- Courses
- Groups
- GroupStudents
- Schedule
- Lessons
- Attendance
- Payments

## Phase 2

- Homework
- HomeworkSubmission
- LessonScore
- StudentProgress
- WeekResult

## Phase 3

- Exams
- ExamResults
- Files
- Notifications
- AuditLog
- Reports

Агар ҳамаашро якбора сар кунед, project зиёд мешиканад. Беҳтар incremental development кунед.
