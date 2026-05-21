using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class ExamRepository(AppDbContext context) : IExamRepository
{
    public async Task<List<Exam>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await context.Exams
            .Include(e => e.Group)
            .OrderByDescending(e => e.ExamDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Exam>> GetByGroupAsync(
        int groupId,
        CancellationToken cancellationToken = default)
    {
        return await context.Exams
            .Include(e => e.Group)
            .Where(e => e.GroupId == groupId)
            .OrderByDescending(e => e.ExamDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<Exam?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await context.Exams
            .Include(e => e.Group)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task CreateAsync(
        Exam exam,
        CancellationToken cancellationToken = default)
    {
        await context.Exams.AddAsync(exam, cancellationToken);
    }

    public Task UpdateAsync(
        Exam exam,
        CancellationToken cancellationToken = default)
    {
        context.Exams.Update(exam);
        return Task.CompletedTask;
    }
}