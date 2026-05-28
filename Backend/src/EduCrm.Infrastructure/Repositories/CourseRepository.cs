using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Course.Request;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class CourseRepository(AppDbContext context) : ICourseRepository
{
    public async Task<PagedResult<Course>> GetAllAsync(
        CourseQueryRequest query,
        CancellationToken cancellationToken = default)
    {
        var q = context.Courses
            .Include(c => c.Groups)
            .ThenInclude(g => g.GroupStudents)
            .AsQueryable();

        // Фильтр по статусу
        if (query.IsActive.HasValue)
            q = q.Where(c => c.IsActive == query.IsActive.Value);

        // Поиск по названию или описанию
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.ToLower();
            q = q.Where(c =>
                c.Name.ToLower().Contains(search) ||
                (c.Description != null && c.Description.ToLower().Contains(search)));
        }

        var totalCount = await q.CountAsync(cancellationToken);

        var items = await q
            .OrderByDescending(c => c.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Course>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<Course?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await context.Courses
            .Include(c => c.Groups)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<bool> ExistsByNameAsync(
        string name,
        CancellationToken cancellationToken = default)
    {
        return await context.Courses
            .AnyAsync(c => c.Name.ToLower() == name.ToLower(), cancellationToken);
    }

    public async Task CreateAsync(
        Course course,
        CancellationToken cancellationToken = default)
    {
        await context.Courses.AddAsync(course, cancellationToken);
    }

    public Task UpdateAsync(
        Course course,
        CancellationToken cancellationToken = default)
    {
        context.Courses.Update(course);
        return Task.CompletedTask;
    }
}