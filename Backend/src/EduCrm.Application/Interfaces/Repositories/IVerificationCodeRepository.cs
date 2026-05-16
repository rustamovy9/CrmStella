using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IVerificationCodeRepository
{
    Task<VerificationCode?> GetActiveCodeAsync(int userId, VerificationCodeType type);
    Task CreateAsync(VerificationCode code);
    Task InvalidateAllAsync(int userId, VerificationCodeType type);
    Task UpdateAsync(VerificationCode code);
}