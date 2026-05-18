using EduCrm.Domain.Entities;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class LessonRepository(AppDbContext context) : ILessonRepository
{
    public async Task<List<Lesson>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await context.Lessons.AsNoTracking().ToListAsync(cancellationToken);
    }

    public async Task<Lesson?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.Lessons.AsNoTracking().FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
    }

    public async Task<List<Lesson>> GetByCourseIdAsync(int courseId, CancellationToken cancellationToken = default)
    {
        return await context.Lessons
            .AsNoTracking()
            .Where(l => l.Group.CourseId == courseId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Lesson>> GetByGroupIdAsync(int groupId, CancellationToken cancellationToken = default)
    {
        return await context.Lessons
            .AsNoTracking()
            .Where(l => l.GroupId == groupId)
            .ToListAsync(cancellationToken);
    }

    public async Task<Lesson?> GetByTitleAsync(string title, CancellationToken cancellationToken = default)
    {
        return await context.Lessons
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Title == title, cancellationToken);
    }

    public async Task<bool> ExistsByTitleInCourseAsync(int courseId, string title, CancellationToken cancellationToken = default)
    {
        return await context.Lessons
            .AnyAsync(l => l.Group.CourseId == courseId && l.Title == title, cancellationToken);
    }

    public async Task CreateAsync(Lesson lesson, CancellationToken cancellationToken = default)
    {
        await context.Lessons.AddAsync(lesson, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Lesson lesson, CancellationToken cancellationToken = default)
    {
        context.Lessons.Update(lesson);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var lesson = await context.Lessons.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
        if (lesson != null)
        {
            context.Lessons.Remove(lesson);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
    
}