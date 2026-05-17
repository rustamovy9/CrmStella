using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class GroupRepository(AppDbContext context) : IGroupRepository
{
    public async Task<List<Group>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await context.Groups
            .Include(g => g.Course)
            .Include(g => g.Mentor)
            .ThenInclude(m => m.User)
            .Include(g => g.GroupStudents)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Group?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await context.Groups
            .Include(g => g.Course)
            .Include(g => g.Mentor)
            .ThenInclude(m => m.User)
            .Include(g => g.GroupStudents)
            .FirstOrDefaultAsync(g => g.Id == id, cancellationToken);
    }

    public async Task<bool> ExistsByNameAsync(
        string name,
        CancellationToken cancellationToken = default)
    {
        return await context.Groups
            .AnyAsync(g => g.Name.ToLower() == name.ToLower(), cancellationToken);
    }

    public async Task CreateAsync(
        Group group,
        CancellationToken cancellationToken = default)
    {
        await context.Groups.AddAsync(group, cancellationToken);
    }

    public Task UpdateAsync(
        Group group,
        CancellationToken cancellationToken = default)
    {
        context.Groups.Update(group);
        return Task.CompletedTask;
    }
}