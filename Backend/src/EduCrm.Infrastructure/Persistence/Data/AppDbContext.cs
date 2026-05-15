using EduCrm.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Persistence.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();

    public DbSet<Student> Students => Set<Student>();
    public DbSet<Mentor> Mentors => Set<Mentor>();

    public DbSet<Profile> Profiles => Set<Profile>();

    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupStudent> GroupStudents => Set<GroupStudent>();

    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Schedule> Schedules => Set<Schedule>();

    public DbSet<Attendance> Attendances => Set<Attendance>();

    public DbSet<Homework> Homeworks => Set<Homework>();
    public DbSet<HomeworkSubmission> HomeworkSubmissions => Set<HomeworkSubmission>();
    public DbSet<LessonScore> LessonScores => Set<LessonScore>();

    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<ExamResult> ExamResults => Set<ExamResult>();

    public DbSet<Payment> Payments => Set<Payment>();

    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<VerificationCode> VerificationCodes => Set<VerificationCode>();

    public DbSet<FileStorage> FileStorages => Set<FileStorage>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public DbSet<WeekResult> WeekResults => Set<WeekResult>();
    public DbSet<StudentProgress> StudentProgresses => Set<StudentProgress>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}