using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class AttendanceRepository(AppDbContext context) : IAttendanceRepository
{
    public async Task<List<Attendance>> GetByLessonIdAsync(
        int lessonId,
        CancellationToken cancellationToken = default)
    {
        return await context.Attendances
            .AsNoTracking()
            .Include(x => x.Student).ThenInclude(x => x.User)
            .Include(x => x.Lesson)
            .Include(x => x.MarkedByMentor).ThenInclude(x => x!.User)
            .Where(x => x.LessonId == lessonId)
            .OrderBy(x => x.Student.User.LastName)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Attendance>> GetByStudentIdAsync(
        int studentId,
        CancellationToken cancellationToken = default)
    {
        return await context.Attendances
            .AsNoTracking()
            .Include(x => x.Lesson)
            .Include(x => x.Student).ThenInclude(x => x.User)
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.MarkedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Attendance?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await context.Attendances
            .AsNoTracking()
            .Include(x => x.Student).ThenInclude(x => x.User)
            .Include(x => x.Lesson)
            .Include(x => x.MarkedByMentor).ThenInclude(x => x!.User)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<Attendance?> GetByLessonAndStudentAsync(
        int lessonId,
        int studentId,
        CancellationToken cancellationToken = default)
    {
        return await context.Attendances
            .AsNoTracking()
            .Include(x => x.Student).ThenInclude(x => x.User)
            .Include(x => x.Lesson)
            .FirstOrDefaultAsync(
                x => x.LessonId == lessonId && x.StudentId == studentId,
                cancellationToken);
    }

    public async Task<bool> ExistsAsync(
        int lessonId,
        int studentId,
        CancellationToken cancellationToken = default)
    {
        return await context.Attendances
            .AsNoTracking()
            .AnyAsync(
                x => x.LessonId == lessonId && x.StudentId == studentId,
                cancellationToken);
    }

    public async Task<Attendance> CreateAsync(
        Attendance attendance,
        CancellationToken cancellationToken = default)
    {
        await context.Attendances.AddAsync(attendance, cancellationToken);
        return attendance;
    }

    public Task<Attendance> UpdateAsync(
        Attendance attendance,
        CancellationToken cancellationToken = default)
    {
        attendance.UpdatedAt = DateTime.UtcNow;
        context.Attendances.Update(attendance);
        return Task.FromResult(attendance);
    }

    public async Task DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var attendance = await context.Attendances
            .FindAsync([id], cancellationToken);
        if (attendance is null) return;
        context.Attendances.Remove(attendance);
    }
}