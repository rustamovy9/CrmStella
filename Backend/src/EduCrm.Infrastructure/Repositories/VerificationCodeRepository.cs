using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using EduCrm.Infrastructure.Persistence;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class VerificationCodeRepository(AppDbContext context) : IVerificationCodeRepository
{
    public async Task<VerificationCode?> GetActiveCodeAsync(int userId, VerificationCodeType type)
        => await context.VerificationCodes
            .Where(x => x.UserId == userId
                        && x.Type == type
                        && !x.IsUsed
                        && x.Expiration > DateTime.UtcNow
                        && x.Attempts < x.MaxAttempts)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

    public async Task CreateAsync(VerificationCode code)
    {
        context.VerificationCodes.Add(code);
        await context.SaveChangesAsync();
    }

    public async Task InvalidateAllAsync(int userId, VerificationCodeType type)
    {
        var codes = await context.VerificationCodes
            .Where(x => x.UserId == userId
                        && x.Type == type
                        && !x.IsUsed)
            .ToListAsync();

        foreach (var code in codes)
            code.IsUsed = true;

        await context.SaveChangesAsync();
    }

    public async Task UpdateAsync(VerificationCode code)
    {
        context.VerificationCodes.Update(code);
        await context.SaveChangesAsync();
    }
}