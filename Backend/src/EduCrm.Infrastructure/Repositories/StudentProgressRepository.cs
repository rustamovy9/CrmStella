using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class StudentProgressRepository(AppDbContext context) : IStudentProgressRepository
{
    public async Task<StudentProgress?> GetByStudentAndGroupAsync(
        int studentId,
        int groupId,
        CancellationToken cancellationToken = default)
        => await context.StudentProgresses
            .Include(p => p.Student)
            .ThenInclude(s => s.User)
            .Include(p => p.Group)
            .FirstOrDefaultAsync(
                p => p.StudentId == studentId && p.GroupId == groupId,
                cancellationToken);

    public async Task<List<StudentProgress>> GetByGroupAsync(
        int groupId,
        CancellationToken cancellationToken = default)
        => await context.StudentProgresses
            .Include(p => p.Student)
            .ThenInclude(s => s.User)
            .Include(p => p.Group)
            .Where(p => p.GroupId == groupId)
            .OrderByDescending(p => p.OverallProgressPercent)
            .ToListAsync(cancellationToken);

    public async Task CreateAsync(
        StudentProgress progress,
        CancellationToken cancellationToken = default)
        => await context.StudentProgresses.AddAsync(progress, cancellationToken);

    public Task UpdateAsync(
        StudentProgress progress,
        CancellationToken cancellationToken = default)
    {
        context.StudentProgresses.Update(progress);
        return Task.CompletedTask;
    }
}