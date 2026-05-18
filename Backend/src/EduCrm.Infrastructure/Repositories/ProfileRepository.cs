using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class ProfileRepository(AppDbContext context) : IProfileRepository
{
    public async Task<Profile?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
        => await context.Profiles
            .AsNoTracking()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public async Task<Profile?> GetByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
        => await context.Profiles
            .AsNoTracking()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

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
            cancellationToken: cancellationToken);
        
        if (profile is not null)
            context.Profiles.Remove(profile);
    }
}