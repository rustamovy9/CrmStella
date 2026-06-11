using CrmStella.Domain.Entities;
using CrmStella.Domain.Enums;

namespace CrmStella.Application.Interfaces.Repositories;

public interface IVerificationCodeRepository
{
    Task<VerificationCode?> GetActiveCodeAsync(
        int userId,
        VerificationCodeType type,
        CancellationToken cancellationToken = default);

    Task CreateAsync(
        VerificationCode code,
        CancellationToken cancellationToken = default);

    Task InvalidateAllAsync(
        int userId,
        VerificationCodeType type,
        CancellationToken cancellationToken = default);

    Task UpdateAsync(
        VerificationCode code,
        CancellationToken cancellationToken = default);
}