using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class HomeworkSubmissionRepository(AppDbContext context) : IHomeworkSubmissionRepository
{
    public async Task<List<HomeworkSubmission>> GetByHomeworkAsync(
        int homeworkId,
        CancellationToken cancellationToken = default)
        => await context.HomeworkSubmissions
            .Include(s => s.Homework)
            .Include(s => s.Student)
                .ThenInclude(st => st.User)
            .Where(s => s.HomeworkId == homeworkId)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync(cancellationToken);

    public async Task<HomeworkSubmission?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
        => await context.HomeworkSubmissions
            .Include(s => s.Homework)
            .Include(s => s.Student)
                .ThenInclude(st => st.User)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

    public async Task<HomeworkSubmission?> GetByHomeworkAndStudentAsync(
        int homeworkId,
        int studentId,
        CancellationToken cancellationToken = default)
        => await context.HomeworkSubmissions
            .Include(s => s.Homework)
            .Include(s => s.Student)
                .ThenInclude(st => st.User)
            .FirstOrDefaultAsync(
                s => s.HomeworkId == homeworkId && s.StudentId == studentId,
                cancellationToken);

    public async Task CreateAsync(
        HomeworkSubmission submission,
        CancellationToken cancellationToken = default)
        => await context.HomeworkSubmissions.AddAsync(submission, cancellationToken);

    public Task UpdateAsync(
        HomeworkSubmission submission,
        CancellationToken cancellationToken = default)
    {
        context.HomeworkSubmissions.Update(submission);
        return Task.CompletedTask;
    }
}