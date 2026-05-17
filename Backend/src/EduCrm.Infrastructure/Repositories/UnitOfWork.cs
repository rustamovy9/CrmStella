using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Infrastructure.Persistence.Data;

namespace EduCrm.Infrastructure.Repositories;

public class UnitOfWork(AppDbContext context) : IUnitOfWork
{
    private IUserRepository? _users;
    private IVerificationCodeRepository? _verificationCodes;

    public IUserRepository Users
        => _users ??= new UserRepository(context);

    public IVerificationCodeRepository VerificationCodes
        => _verificationCodes ??= new VerificationCodeRepository(context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => await context.SaveChangesAsync(cancellationToken);
}
