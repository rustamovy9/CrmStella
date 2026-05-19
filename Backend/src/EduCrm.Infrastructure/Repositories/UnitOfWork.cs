using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Infrastructure.Persistence.Data;

namespace EduCrm.Infrastructure.Repositories;

public class UnitOfWork(AppDbContext context) : IUnitOfWork
{
    private IUserRepository? _users;
    private IVerificationCodeRepository? _verificationCodes;
    private IMentorRepository? _mentors;
    private IStudentRepository? _students;
    private ICourseRepository? _courses;
    private IGroupRepository? _groups;
    private IGroupStudentRepository? _groupStudents;
    private IFileStorageRepository? _files;
    private IPaymentRepository? _payments;
    private IProfileRepository? _profiles;
    private ILessonRepository? _lessons;
    private IScheduleRepository? _schedules;
    private IAttendanceRepository? _attendances;
    private IHomeworkRepository? _homeworks;
    private IHomeworkSubmissionRepository? _homeworkSubmissions;
    private ILessonScoreRepository? _lessonScores;
    private IStudentProgressRepository? _studentProgress;
    private IExamRepository? _exams;

    public IUserRepository Users =>
        _users ??= new UserRepository(context);

    public IVerificationCodeRepository VerificationCodes =>
        _verificationCodes ??= new VerificationCodeRepository(context);

    public IMentorRepository Mentors =>
        _mentors ??= new MentorRepository(context);

    public IStudentRepository Students =>
        _students ??= new StudentRepository(context);

    public ICourseRepository Courses =>
        _courses ??= new CourseRepository(context);

    public IFileStorageRepository Files =>
        _files ??= new FileStorageRepository(context);

    public IGroupRepository Groups =>
        _groups ??= new GroupRepository(context);

    public IGroupStudentRepository GroupStudents =>
        _groupStudents ??= new GroupStudentRepository(context);

    public IPaymentRepository Payments =>
        _payments ??= new PaymentRepository(context);

    public IProfileRepository Profiles =>
        _profiles ??= new ProfileRepository(context);

    public ILessonRepository Lessons =>
        _lessons ??= new LessonRepository(context);

    public IScheduleRepository Schedules =>
        _schedules ??= new ScheduleRepository(context);

    public IAttendanceRepository Attendances =>
        _attendances ??= new AttendanceRepository(context);

    public IHomeworkRepository Homeworks =>
        _homeworks ??= new HomeworkRepository(context);

    public IHomeworkSubmissionRepository HomeworkSubmissions =>
        _homeworkSubmissions ??= new HomeworkSubmissionRepository(context);

    public ILessonScoreRepository LessonScores =>
        _lessonScores ??= new LessonScoreRepository(context);

    public IStudentProgressRepository StudentProgress =>
        _studentProgress ??= new StudentProgressRepository(context);
    public IExamRepository Exams =>
    _exams ??= new ExamRepository(context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => await context.SaveChangesAsync(cancellationToken);
}