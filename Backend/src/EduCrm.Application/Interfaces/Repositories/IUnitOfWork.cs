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
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}