using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class MentorRepository(AppDbContext context) : IMentorRepository
{
    public async Task<List<Mentor>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await context.Mentors
            .Include(m => m.User)
            .ThenInclude(u => u.Profile)
            .OrderByDescending(m => m.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<Mentor?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await context.Mentors
            .Include(m => m.User)
            .ThenInclude(u => u.Profile)
            .Include(m => m.Groups)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    public async Task<Mentor?> GetByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        return await context.Mentors
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.UserId == userId, cancellationToken);
        
    }

    public async Task<bool> ExistsByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        return await context.Mentors
            .AnyAsync(m => m.UserId == userId, cancellationToken);
    }

    public async Task CreateAsync(
        Mentor mentor,
        CancellationToken cancellationToken = default)
    {
        await context.Mentors.AddAsync(mentor, cancellationToken);
    }

    public Task UpdateAsync(Mentor mentor, CancellationToken cancellationToken = default)
    {
        var tracked = context.ChangeTracker.Entries<Mentor>()
            .FirstOrDefault(e => e.Entity.Id == mentor.Id);

        if (tracked is not null)
            tracked.CurrentValues.SetValues(mentor);
        else
            context.Mentors.Update(mentor);

        return Task.CompletedTask;
    }
    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var mentor = await context.Mentors
            .FindAsync([id], cancellationToken);  

        if (mentor is null) return;

        context.Mentors.Remove(mentor);
    }
}