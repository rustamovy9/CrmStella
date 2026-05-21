using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class ExamResultRepository(AppDbContext context) : IExamResultRepository
{
    public async Task<List<ExamResult>> GetByExamAsync(
        int examId,
        CancellationToken cancellationToken = default)
    {
        return await context.ExamResults
            .Include(r => r.Exam)
            .Include(r => r.Student)
            .ThenInclude(s => s.User)
            .Include(r => r.ScoredByMentor)
            .ThenInclude(m => m!.User)
            .Where(r => r.ExamId == examId)
            .OrderByDescending(r => r.Score)
            .ToListAsync(cancellationToken);
    }

    public async Task<ExamResult?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await context.ExamResults
            .Include(r => r.Exam)
            .Include(r => r.Student)
            .ThenInclude(s => s.User)
            .Include(r => r.ScoredByMentor)
            .ThenInclude(m => m!.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<ExamResult?> GetByExamAndStudentAsync(
        int examId,
        int studentId,
        CancellationToken cancellationToken = default)
    {
        return await context.ExamResults
            .Include(r => r.Exam)
            .Include(r => r.Student)
            .ThenInclude(s => s.User)
            .FirstOrDefaultAsync(
                r => r.ExamId == examId && r.StudentId == studentId,
                cancellationToken);
    }

    public async Task CreateAsync(
        ExamResult result,
        CancellationToken cancellationToken = default)
    {
        await context.ExamResults.AddAsync(result, cancellationToken);
    }

    public Task UpdateAsync(
        ExamResult result,
        CancellationToken cancellationToken = default)
    {
        context.ExamResults.Update(result);
        return Task.CompletedTask;
    }
}