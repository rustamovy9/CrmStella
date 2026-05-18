using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Infrastructure.Persistence.Data;

namespace EduCrm.Infrastructure.Repositories;

public class UnitOfWork(AppDbContext context) : IUnitOfWork
{
    private ICourseRepository? _courses;
    private IFileStorageRepository? _files;
    private IGroupRepository? _groups;
    private IGroupStudentRepository? _groupStudents;
    private IMentorRepository? _mentors;
    private IStudentRepository? _students;
    private IUserRepository? _users;
    private IVerificationCodeRepository? _verificationCodes;
    private IPaymentRepository? _payments;

    public IUserRepository Users
        => _users ??= new UserRepository(context);

    public IVerificationCodeRepository VerificationCodes
        => _verificationCodes ??= new VerificationCodeRepository(context);

    public IMentorRepository Mentors
        => _mentors ??= new MentorRepository(context);

    public IStudentRepository Students
        => _students ??= new StudentRepository(context);

    public ICourseRepository Courses
        => _courses ??= new CourseRepository(context);

    public IFileStorageRepository Files
        => _files ??= new FileStorageRepository(context);

    public IGroupRepository Groups
        => _groups ??= new GroupRepository(context);

    public IGroupStudentRepository GroupStudents
        => _groupStudents ??= new GroupStudentRepository(context);
    public IPaymentRepository Payments
    => _payments ??= new PaymentRepository(context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await context.SaveChangesAsync(cancellationToken);
    }
}