using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class HomeworkRepository(AppDbContext context) : IHomeworkRepository
{
    public async Task<List<Homework>> GetAllAsync(
        CancellationToken cancellationToken = default)
        => await context.Homeworks
            .Include(h => h.Lesson)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<List<Homework>> GetByLessonAsync(
        int lessonId,
        CancellationToken cancellationToken = default)
        => await context.Homeworks
            .Include(h => h.Lesson)
            .Where(h => h.LessonId == lessonId)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<Homework?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
        => await context.Homeworks
            .Include(h => h.Lesson)
            .FirstOrDefaultAsync(h => h.Id == id, cancellationToken);

    public async Task CreateAsync(
        Homework homework,
        CancellationToken cancellationToken = default)
        => await context.Homeworks.AddAsync(homework, cancellationToken);

    public Task UpdateAsync(
        Homework homework,
        CancellationToken cancellationToken = default)
    {
        context.Homeworks.Update(homework);
        return Task.CompletedTask;
    }
}