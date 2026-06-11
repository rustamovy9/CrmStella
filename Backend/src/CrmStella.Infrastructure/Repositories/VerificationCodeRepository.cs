using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Domain.Entities;
using CrmStella.Domain.Enums;
using CrmStella.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmStella.Infrastructure.Repositories;

public class VerificationCodeRepository(AppDbContext context) : IVerificationCodeRepository
{
    // AsNoTracking для чтения
    public async Task<VerificationCode?> GetActiveCodeAsync(
        int userId,
        VerificationCodeType type,
        CancellationToken cancellationToken = default)
    {
        return await context.VerificationCodes
            .AsNoTracking()
            .Where(x =>
                x.UserId == userId &&
                x.Type == type &&
                !x.IsUsed &&
                x.Expiration > DateTime.UtcNow &&
                x.Attempts < x.MaxAttempts)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    // БЕЗ AsNoTracking для записи
    public async Task CreateAsync(
        VerificationCode code,
        CancellationToken cancellationToken = default)
    {
        await context.VerificationCodes.AddAsync(code, cancellationToken);
    }

    public async Task InvalidateAllAsync(
        int userId,
        VerificationCodeType type,
        CancellationToken cancellationToken = default)
    {
        var codes = await context.VerificationCodes
            .Where(x =>
                x.UserId == userId &&
                x.Type == type &&
                !x.IsUsed)
            .ToListAsync(cancellationToken);

        foreach (var code in codes)
            code.IsUsed = true;
    }

    public Task UpdateAsync(
        VerificationCode code,
        CancellationToken cancellationToken = default)
    {
        context.VerificationCodes.Update(code);
        return Task.CompletedTask;
    }
}