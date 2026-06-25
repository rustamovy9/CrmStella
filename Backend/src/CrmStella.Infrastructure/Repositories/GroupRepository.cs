using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Group.Request;
using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Domain.Entities;
using CrmStella.Domain.Enums;
using CrmStella.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmStella.Infrastructure.Repositories;

public class GroupRepository(AppDbContext context) : IGroupRepository
{
    public async Task<PagedResult<Group>> GetAllAsync(
        GroupQueryRequest query,
        CancellationToken cancellationToken = default)
    {
        var q = context.Groups
            .Include(g => g.Course)
            .Include(g => g.Mentor)
            .ThenInclude(m => m.User)
            .Include(g => g.GroupStudents)
            .AsQueryable();

        // Фильтр по курсу
        if (query.CourseId.HasValue)
            q = q.Where(g => g.CourseId == query.CourseId.Value);

        // Фильтр по ментору
        if (query.MentorId.HasValue)
            q = q.Where(g => g.MentorId == query.MentorId.Value);

        // Фильтр по статусу
        if (!string.IsNullOrWhiteSpace(query.Status) &&
            Enum.TryParse<GroupStatus>(query.Status, true, out var status))
            q = q.Where(g => g.Status == status);

        // Поиск по названию группы
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.ToLower();
            q = q.Where(g =>
                g.Name.ToLower().Contains(search) ||
                g.Course.Name.ToLower().Contains(search) ||
                g.Mentor.User.FirstName.ToLower().Contains(search) ||
                g.Mentor.User.LastName.ToLower().Contains(search));
        }

        var totalCount = await q.CountAsync(cancellationToken);

        var items = await q
            .OrderByDescending(g => g.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Group>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<Group?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await context.Groups
            .Include(g => g.Course)
            .Include(g => g.Schedules)
            .Include(g => g.Mentor)
            .ThenInclude(m => m.User)
            .Include(g => g.GroupStudents)
            .ThenInclude(gs => gs.Student)
            .ThenInclude(s => s.User)
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

    public async Task<List<Group>> GetByMentorAsync(int mentorId, CancellationToken cancellationToken = default)
    {
        return await context.Groups
            .Include(g=>g.Course)
            .Include(g=>g.Lessons)
            .Include(g=>g.Mentor)
            .ThenInclude(m=>m.User)
            .Include(g=>g.GroupStudents)
            .ThenInclude(m=>m.Student)
            .Where(g => g.MentorId == mentorId)
            .OrderByDescending(g=>g.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}