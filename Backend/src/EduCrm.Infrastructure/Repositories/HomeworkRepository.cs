using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class HomeworkRepository(AppDbContext context) : IHomeworkRepository
{
    public async Task<List<Homework>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await context.Homeworks
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Homework?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.Homeworks
            .AsNoTracking()
            .FirstOrDefaultAsync(homework => homework.Id == id, cancellationToken);
    }

    public async Task<List<Homework>> GetByLessonIdAsync(int lessonId, CancellationToken cancellationToken = default)
    {
        return await context.Homeworks
            .AsNoTracking()
            .Where(homework => homework.LessonId == lessonId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Homework>> GetActiveByLessonIdAsync(int lessonId, CancellationToken cancellationToken = default)
    {
        return await context.Homeworks
            .AsNoTracking()
            .Where(homework => homework.LessonId == lessonId && homework.IsActive)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsByTitleInLessonAsync(int lessonId, string title, CancellationToken cancellationToken = default)
    {
        return await context.Homeworks
            .AnyAsync(homework => homework.LessonId == lessonId && homework.Title == title, cancellationToken);
    }

    public async Task CreateAsync(Homework homework, CancellationToken cancellationToken = default)
    {
        await context.Homeworks.AddAsync(homework, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Homework homework, CancellationToken cancellationToken = default)
    {
        context.Homeworks.Update(homework);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var homework = await context.Homeworks.FirstOrDefaultAsync(h => h.Id == id, cancellationToken);
        if (homework != null)
        {
            context.Homeworks.Remove(homework);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}