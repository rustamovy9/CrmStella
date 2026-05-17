using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IUnitOfWork
{
    IUserRepository Users { get; }
    IVerificationCodeRepository VerificationCodes { get; }
    IMentorRepository Mentors { get; }
IStudentRepository Students { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}