using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Domain.Entities;
using CrmStella.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmStella.Infrastructure.Repositories;

public class LessonRepository(AppDbContext context) : ILessonRepository
{
    public async Task<List<Lesson>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await context.Lessons
            .Include(l => l.Group)
            .AsNoTracking()
            .OrderByDescending(l => l.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<Lesson?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.Lessons
            .Include(l => l.Group)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
    }

    public async Task<List<Lesson>> GetByCourseIdAsync(int courseId, CancellationToken cancellationToken = default)
    {
        return await context.Lessons
            .Include(l => l.Group)
            .AsNoTracking()
            .Where(l => l.Group.CourseId == courseId)
            .OrderBy(l => l.OrderIndex)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Lesson>> GetByGroupIdAsync(int groupId, CancellationToken cancellationToken = default)
    {
        return await context.Lessons
            .Include(l => l.Group)
            .AsNoTracking()
            .Where(l => l.GroupId == groupId)
            .OrderBy(l => l.OrderIndex)
            .ToListAsync(cancellationToken);
    }
    
    public async Task<List<Lesson>> GetByGroupAndWeekAsync(int groupId, int weekNumber)
        => await context.Lessons
            .Where(l => l.GroupId == groupId && l.WeekNumber == weekNumber)
            .ToListAsync();

    public async Task<Lesson?> GetByTitleAsync(string title, CancellationToken cancellationToken = default)
    {
        return await context.Lessons
            .Include(l => l.Group)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Title == title, cancellationToken);
    }

    public async Task<bool> ExistsByTitleInCourseAsync(
        int courseId,
        string title,
        CancellationToken cancellationToken = default)
    {
        return await context.Lessons
            .AnyAsync(l => l.Group.CourseId == courseId && l.Title == title, cancellationToken);
    }

    public async Task CreateAsync(Lesson lesson, CancellationToken cancellationToken = default)
    {
        await context.Lessons.AddAsync(lesson, cancellationToken);
    }

    public Task UpdateAsync(Lesson lesson, CancellationToken cancellationToken = default)
    {
        context.Lessons.Update(lesson);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var lesson = await context.Lessons
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (lesson != null) context.Lessons.Remove(lesson);
    }
}