using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class HomeworkSubmissionRepository(AppDbContext context) : IHomeworkSubmissionRepository
{
    public async Task<List<HomeworkSubmission>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await context.HomeworkSubmissions
            .AsNoTracking()
            .Include(hs => hs.Homework)
            .Include(hs => hs.Student)
            .ToListAsync(cancellationToken);
    }

    public async Task<HomeworkSubmission?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await context.HomeworkSubmissions
            .AsNoTracking()
            .Include(hs => hs.Homework)
            .Include(hs => hs.Student)
            .FirstOrDefaultAsync(hs => hs.Id == id, cancellationToken);
    }

    public async Task<List<HomeworkSubmission>> GetByHomeworkIdAsync(int homeworkId, CancellationToken cancellationToken = default)
    {
        return await context.HomeworkSubmissions
            .AsNoTracking()
            .Include(hs => hs.Student)
            .Where(hs => hs.HomeworkId == homeworkId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<HomeworkSubmission>> GetByStudentIdAsync(int studentId, CancellationToken cancellationToken = default)
    {
        return await context.HomeworkSubmissions
            .AsNoTracking()
            .Include(hs => hs.Homework)
            .Where(hs => hs.StudentId == studentId)
            .ToListAsync(cancellationToken);
    }

    public async Task<HomeworkSubmission?> GetByHomeworkAndStudentAsync(int homeworkId, int studentId, CancellationToken cancellationToken = default)
    {
        return await context.HomeworkSubmissions
            .AsNoTracking()
            .FirstOrDefaultAsync(hs => hs.HomeworkId == homeworkId && hs.StudentId == studentId, cancellationToken);
    }

    public async Task<bool> HasSubmittedAsync(int homeworkId, int studentId, CancellationToken cancellationToken = default)
    {
        return await context.HomeworkSubmissions
            .AnyAsync(hs => hs.HomeworkId == homeworkId && hs.StudentId == studentId, cancellationToken);
    }

    public async Task CreateAsync(HomeworkSubmission submission, CancellationToken cancellationToken = default)
    {
        await context.HomeworkSubmissions.AddAsync(submission, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(HomeworkSubmission submission, CancellationToken cancellationToken = default)
    {
        context.HomeworkSubmissions.Update(submission);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var submission = await context.HomeworkSubmissions.FirstOrDefaultAsync(hs => hs.Id == id, cancellationToken);
        if (submission != null)
        {
            context.HomeworkSubmissions.Remove(submission);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}