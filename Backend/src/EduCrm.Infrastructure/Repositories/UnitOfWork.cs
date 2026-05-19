using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Infrastructure.Persistence.Data;

namespace EduCrm.Infrastructure.Repositories;

public class UnitOfWork(AppDbContext context) : IUnitOfWork
{
    private IAttendanceRepository? _attendances;
    private ICourseRepository? _courses;
    private IFileStorageRepository? _files;
    private IGroupRepository? _groups;
    private IGroupStudentRepository? _groupStudents;
    private IHomeworkRepository? _homeworks;
    private IHomeworkSubmissionRepository? _homeworkSubmissions;
    private ILessonRepository? _lessons;
    private IMentorRepository? _mentors;
    private IPaymentRepository? _payments;
    private IProfileRepository? _profiles;
    private IScheduleRepository? _schedules;
    private IStudentRepository? _students;
    private IUserRepository? _users;
    private IVerificationCodeRepository? _verificationCodes;
    private IStudentProgressRepository? _studentProgress;

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

    public IStudentProgressRepository StudentProgress =>
        _studentProgress ??= new StudentProgressRepository(context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => await context.SaveChangesAsync(cancellationToken);
}