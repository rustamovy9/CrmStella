using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Domain.Entities;
using CrmStella.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmStella.Infrastructure.Repositories;

public class HomeworkRepository(AppDbContext context) : IHomeworkRepository
{
    public async Task<List<Homework>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await context.Homeworks
            .Include(h => h.Lesson)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Homework?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await context.Homeworks
            .Include(h => h.Lesson)
            .FirstOrDefaultAsync(h => h.Id == id, cancellationToken);
    }

    public async Task<List<Homework>> GetByLessonIdAsync(
        int lessonId,
        CancellationToken cancellationToken = default)
    {
        return await context.Homeworks
            .Include(h => h.Lesson)
            .Where(h => h.LessonId == lessonId)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Homework>> GetActiveByLessonIdAsync(
        int lessonId,
        CancellationToken cancellationToken = default)
    {
        return await context.Homeworks
            .Include(h => h.Lesson)
            .Where(h => h.LessonId == lessonId && h.IsActive)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsByTitleInLessonAsync(
        int lessonId,
        string title,
        CancellationToken cancellationToken = default)
    {
        return await context.Homeworks
            .AnyAsync(h =>
                    h.LessonId == lessonId &&
                    h.Title == title,
                cancellationToken);
    }

    public async Task CreateAsync(
        Homework homework,
        CancellationToken cancellationToken = default)
    {
        await context.Homeworks.AddAsync(homework, cancellationToken);
    }

    public Task UpdateAsync(
        Homework homework,
        CancellationToken cancellationToken = default)
    {
        context.Homeworks.Update(homework);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var homework = await context.Homeworks
            .FirstOrDefaultAsync(h => h.Id == id, cancellationToken);

        if (homework is null)
            return;

        context.Homeworks.Remove(homework);
    }
}