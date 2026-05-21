using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class LessonScoreRepository(AppDbContext context) : ILessonScoreRepository
{
    public async Task<List<LessonScore>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await context.LessonScores
            .AsNoTracking()
            .Include(ls => ls.Lesson)
            .Include(ls => ls.Student)
            .Include(ls => ls.ScoredByMentor)
            .ToListAsync(cancellationToken);
    }

    public async Task<LessonScore?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.LessonScores
            .AsNoTracking()
            .Include(ls => ls.Lesson)
            .Include(ls => ls.Student)
            .Include(ls => ls.ScoredByMentor)
            .FirstOrDefaultAsync(ls => ls.Id == id, cancellationToken);
    }

    public async Task<List<LessonScore>> GetByLessonIdAsync(int lessonId, CancellationToken cancellationToken = default)
    {
        return await context.LessonScores
            .AsNoTracking()
            .Include(ls => ls.Student)
            .Where(ls => ls.LessonId == lessonId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<LessonScore>> GetByStudentIdAsync(int studentId,
        CancellationToken cancellationToken = default)
    {
        return await context.LessonScores
            .AsNoTracking()
            .Include(ls => ls.Lesson)
            .Where(ls => ls.StudentId == studentId)
            .ToListAsync(cancellationToken);
    }

    public async Task<LessonScore?> GetByHomeworkSubmissionIdAsync(int homeworkSubmissionId,
        CancellationToken cancellationToken = default)
    {
        return await context.LessonScores
            .AsNoTracking()
            .FirstOrDefaultAsync(ls => ls.HomeworkSubmissionId == homeworkSubmissionId, cancellationToken);
    }

    public async Task<bool> ExistsByLessonAndStudentAsync(int lessonId, int studentId,
        CancellationToken cancellationToken = default)
    {
        return await context.LessonScores
            .AnyAsync(ls => ls.LessonId == lessonId && ls.StudentId == studentId, cancellationToken);
    }

    public async Task CreateAsync(LessonScore lessonScore, CancellationToken cancellationToken = default)
    {
        await context.LessonScores.AddAsync(lessonScore, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(LessonScore lessonScore, CancellationToken cancellationToken = default)
    {
        context.LessonScores.Update(lessonScore);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var lessonScore = await context.LessonScores.FirstOrDefaultAsync(ls => ls.Id == id, cancellationToken);
        if (lessonScore != null)
        {
            context.LessonScores.Remove(lessonScore);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}