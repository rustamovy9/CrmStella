namespace EduCrm.Application.Interfaces.Repositories;

public interface IUnitOfWork
{
    IUserRepository Users { get; }
    IVerificationCodeRepository VerificationCodes { get; }
    IMentorRepository Mentors { get; }
    IStudentRepository Students { get; }
    ICourseRepository Courses { get; }
    IGroupRepository Groups { get; }
    IGroupStudentRepository GroupStudents { get; }
    IFileStorageRepository Files { get; }
    IPaymentRepository Payments { get; }
    IProfileRepository Profiles { get; }
    ILessonRepository Lessons { get; }
    IScheduleRepository Schedules { get; }
    IAttendanceRepository Attendances { get; }

    IHomeworkRepository Homeworks { get; }
    IHomeworkSubmissionRepository HomeworkSubmissions { get; }

    ILessonScoreRepository LessonScores { get; }
    IStudentProgressRepository StudentProgress { get; }
    IExamRepository Exams { get; }
    INotificationRepository Notifications { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}