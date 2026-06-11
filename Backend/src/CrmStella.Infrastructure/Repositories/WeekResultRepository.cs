using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Domain.Entities;
using CrmStella.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmStella.Infrastructure.Repositories;

public class WeekResultRepository(AppDbContext context) : IWeekResultRepository
{
    public async Task<WeekResult?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await context.WeekResults
            .Include(w => w.Student)
            .ThenInclude(s => s.User)
            .Include(w => w.Group)
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
    }

    public async Task<WeekResult?> GetByKeyAsync(
        int studentId, int groupId, int weekNumber,
        CancellationToken cancellationToken = default)
    {
        return await context.WeekResults
            .Include(w => w.Student)
            .ThenInclude(s => s.User)
            .Include(w => w.Group)
            .FirstOrDefaultAsync(
                w => w.StudentId == studentId
                     && w.GroupId == groupId
                     && w.WeekNumber == weekNumber,
                cancellationToken);
    }

    public async Task<List<WeekResult>> GetByStudentAndGroupAsync(
        int studentId, int groupId,
        CancellationToken cancellationToken = default)
    {
        return await context.WeekResults
            .Include(w => w.Student)
            .ThenInclude(s => s.User)
            .Include(w => w.Group)
            .Where(w => w.StudentId == studentId && w.GroupId == groupId)
            .OrderBy(w => w.WeekNumber)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<WeekResult>> GetByGroupAndWeekAsync(
        int groupId, int weekNumber,
        CancellationToken cancellationToken = default)
    {
        return await context.WeekResults
            .Include(w => w.Student)
            .ThenInclude(s => s.User)
            .Include(w => w.Group)
            .Where(w => w.GroupId == groupId && w.WeekNumber == weekNumber)
            .OrderByDescending(w => w.TotalScore)
            .ToListAsync(cancellationToken);
    }

    public async Task CreateAsync(
        WeekResult weekResult,
        CancellationToken cancellationToken = default)
    {
        await context.WeekResults.AddAsync(weekResult, cancellationToken);
    }

    public Task UpdateAsync(
        WeekResult weekResult,
        CancellationToken cancellationToken = default)
    {
        context.WeekResults.Update(weekResult);
        return Task.CompletedTask;
    }
}