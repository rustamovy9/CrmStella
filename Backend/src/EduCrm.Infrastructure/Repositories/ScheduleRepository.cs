using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class ScheduleRepository(AppDbContext context) : IScheduleRepository
{
    public async Task<List<Schedule>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await context.Schedules
            .AsNoTracking()
            .Include(x => x.Group)
            .OrderBy(x => x.DayOfWeek)
            .ThenBy(x => x.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Schedule>> GetByGroupIdAsync(
        int groupId,
        CancellationToken cancellationToken = default)
    {
        return await context.Schedules
            .AsNoTracking()
            .Include(x => x.Group)
            .Where(x => x.GroupId == groupId)
            .OrderBy(x => x.DayOfWeek)
            .ThenBy(x => x.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<Schedule?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await context.Schedules
            .AsNoTracking()
            .Include(x => x.Group)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<bool> ExistsAsync(
        int groupId,
        DayOfWeek dayOfWeek,
        CancellationToken cancellationToken = default)
    {
        return await context.Schedules
            .AsNoTracking()
            .AnyAsync(x => x.GroupId == groupId
                           && x.DayOfWeek == dayOfWeek,
                cancellationToken);
    }

    public async Task<Schedule> CreateAsync(
        Schedule schedule,
        CancellationToken cancellationToken = default)
    {
        await context.Schedules.AddAsync(schedule, cancellationToken);
        return schedule;
    }

    public Task<Schedule> UpdateAsync(
        Schedule schedule,
        CancellationToken cancellationToken = default)
    {
        context.Schedules.Update(schedule);
        return Task.FromResult(schedule);
    }

    public async Task DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var schedule = await context.Schedules
            .FindAsync([id], cancellationToken);
        if (schedule is null) return;
        context.Schedules.Remove(schedule);
    }
}