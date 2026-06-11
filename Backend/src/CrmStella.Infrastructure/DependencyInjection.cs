using CrmStella.Application.Common;
using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Application.Interfaces.Services;
using CrmStella.Application.Services;
using CrmStella.Infrastructure.BackgroundJobs;
using CrmStella.Infrastructure.Persistence.Data;
using CrmStella.Infrastructure.Repositories;
using CrmStella.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CrmStella.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ДИАГНОСТИКА
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        Console.WriteLine(
            $"[DependencyInjection] ConnectionString: {(string.IsNullOrEmpty(connectionString) ? "NULL or EMPTY" : connectionString)}");

        if (string.IsNullOrEmpty(connectionString))
            throw new Exception("DefaultConnection is not configured! Check appsettings.json, appsettings.Development.json, development.json, or environment variables.");

        // DbContext
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        // Cache
        services.AddMemoryCache();

        // Repositories
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Core Services
        services.AddSingleton<ICacheService, CacheService>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<ILeadService, LeadService>();

        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IMentorService, MentorService>();
        services.AddScoped<IStudentService, StudentService>();
        services.AddScoped<IStudentProgressService, StudentProgressService>();

        services.AddScoped<ICourseService, CourseService>();
        services.AddScoped<IGroupService, GroupService>();
        services.AddScoped<IGroupStudentService, GroupStudentService>();

        services.AddScoped<ILessonService, LessonService>();
        services.AddScoped<ILessonScoreService, LessonScoreService>();
        services.AddScoped<IScheduleService, ScheduleService>();
        services.AddScoped<IAttendanceService, AttendanceService>();

        services.AddScoped<IFileStorageService, FileStorageService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IBillingService, BillingService>();
        services.AddHostedService<BillingJob>();

        //Exam module
        services.AddScoped<IExamService, ExamService>();
        services.AddScoped<IExamResultService, ExamResultService>();
        services.AddScoped<IAuditLogService, AuditLogService>();

        // Homework module
        services.AddScoped<IHomeworkService, HomeworkService>();
        services.AddScoped<IHomeworkSubmissionService, HomeworkSubmissionService>();
        services.AddScoped<IWeekResultService, WeekResultService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<INotificationService, NotificationService>();

        // Settings
        services.Configure<EmailSettings>(
            configuration.GetSection("EmailSettings"));

        return services;
    }
}
