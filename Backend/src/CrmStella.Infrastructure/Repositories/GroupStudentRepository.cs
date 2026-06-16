using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Domain.Entities;
using CrmStella.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmStella.Infrastructure.Repositories;

public class GroupStudentRepository(AppDbContext context) : IGroupStudentRepository
{
    public async Task<List<GroupStudent>> GetByGroupAsync(
        int groupId,
        CancellationToken cancellationToken = default)
    {
        return await context.GroupStudents
            .Include(gs => gs.Group)
            .Include(gs => gs.Student)
            .ThenInclude(s => s.User)
            .Include(gs => gs.TransferredTo)
            .Where(gs => gs.GroupId == groupId)
            .OrderByDescending(gs => gs.JoinedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<GroupStudent?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await context.GroupStudents
            .Include(gs => gs.Group)
            .Include(gs => gs.Student)
            .ThenInclude(s => s.User)
            .FirstOrDefaultAsync(gs => gs.Id == id, cancellationToken);
    }

    public async Task<bool> IsActiveEnrollmentAsync(
        int groupId,
        int studentId,
        CancellationToken cancellationToken = default)
    {
        return await context.GroupStudents
            .AnyAsync(gs =>
                gs.GroupId == groupId &&
                gs.StudentId == studentId &&
                gs.IsActive, cancellationToken);
    }

    public async Task<int> CountActiveInGroupAsync(
        int groupId,
        CancellationToken cancellationToken = default)
    {
        return await context.GroupStudents
            .CountAsync(gs => gs.GroupId == groupId && gs.IsActive, cancellationToken);
    }

    public async Task CreateAsync(
        GroupStudent groupStudent,
        CancellationToken cancellationToken = default)
    {
        await context.GroupStudents.AddAsync(groupStudent, cancellationToken);
    }

    public Task UpdateAsync(
        GroupStudent groupStudent,
        CancellationToken cancellationToken = default)
    {
        context.GroupStudents.Update(groupStudent);
        return Task.CompletedTask;
    }

    public async Task<List<GroupStudent>> GetDueBillingsAsync(
        DateTime asOf, CancellationToken ct = default)
    {
        return await context.GroupStudents
            .Where(gs => gs.IsActive
                         && gs.NextBillingDate != null
                         && gs.NextBillingDate <= asOf)
            .ToListAsync(ct);
    }

    public async Task<GroupStudent?> GetByGroupAndStudentAsync(
        int groupId, int studentId, CancellationToken ct = default)
        => await context.GroupStudents
            .FirstOrDefaultAsync(gs =>
                    gs.GroupId == groupId &&
                    gs.StudentId == studentId &&
                    gs.IsActive,
                ct);

    public async Task<List<GroupStudent>> GetByStudentAsync(int studentId, CancellationToken ct = default)
    {
        return await context.GroupStudents
            .Where(gs =>
                    gs.StudentId == studentId &&
                    gs.IsActive)
                .Include(gs => gs.Group)
                    .ThenInclude(g => g.Course)
                .Include(gs => gs.Group)
                    .ThenInclude(g => g.Mentor)
                        .ThenInclude(m => m.User)
            .ToListAsync(ct);
    }
}