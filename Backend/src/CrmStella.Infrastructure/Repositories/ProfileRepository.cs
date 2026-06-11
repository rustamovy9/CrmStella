using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Domain.Entities;
using CrmStella.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmStella.Infrastructure.Repositories;

public class ProfileRepository(AppDbContext context) : IProfileRepository
{
    public async Task<Profile?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await context.Profiles
            .AsNoTracking()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<Profile?> GetByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        return await context.Profiles
            .AsNoTracking()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
    }

    public async Task CreateAsync(
        Profile profile,
        CancellationToken cancellationToken = default)
    {
        await context.Profiles.AddAsync(profile, cancellationToken);
    }

    public async Task UpdateAsync(
        Profile profile,
        CancellationToken cancellationToken = default)
    {
        context.Profiles.Update(profile);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var profile = await context.Profiles.FindAsync(
            new object[] { id },
            cancellationToken);

        if (profile is not null)
            context.Profiles.Remove(profile);
    }
}