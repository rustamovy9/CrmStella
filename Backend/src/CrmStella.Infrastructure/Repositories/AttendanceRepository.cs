using CrmStella.Application.DTOs.Attendance.Response;
using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Domain.Entities;
using CrmStella.Domain.Enums;
using CrmStella.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmStella.Infrastructure.Repositories;

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

    public async Task<AttendanceSummaryResponse> GetDailySummaryAsync(
        DateTime date, CancellationToken ct = default)
    {
        var dayStart = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var dayEnd = dayStart.AddDays(1);

        var query = context.Attendances
            .AsNoTracking()
            .Where(a => a.Lesson.LessonDate >= dayStart && a.Lesson.LessonDate < dayEnd);

        var present = await query.CountAsync(a => a.Status == AttendanceStatus.Present, ct);
        var absent = await query.CountAsync(a => a.Status == AttendanceStatus.Absent, ct);
        var late = await query.CountAsync(a => a.Status == AttendanceStatus.Late, ct);

        var recentAbsent = await query
            .Where(a => a.Status == AttendanceStatus.Absent)
            .OrderByDescending(a => a.MarkedAt)
            .Take(10)
            .Select(a => new AbsentItem
            {
                StudentFullName = a.Student.User.FullName,
                LessonTitle = a.Lesson.Title,
                Reason = a.AbsenceReason,
                MarkedAt = a.MarkedAt,
                GroupId = a.Lesson.GroupId,
                GroupName = a.Lesson.Group.Name,
                MentorId = a.Lesson.Group.MentorId,
                MentorUserId = (int?)a.Lesson.Group.Mentor.UserId,
                MentorFullName = a.Lesson.Group.Mentor.User.FullName
            })
            .ToListAsync(ct);

        var recentLate = await query
            .Where(a => a.Status == AttendanceStatus.Late)
            .OrderByDescending(a => a.MarkedAt)
            .Take(10)
            .Select(a => new LateItem
            {
                StudentFullName = a.Student.User.FullName,
                LessonTitle = a.Lesson.Title,
                LateMinutes = a.LateMinutes ?? 0,
                MarkedAt = a.MarkedAt,
                GroupId = a.Lesson.GroupId,
                GroupName = a.Lesson.Group.Name,
                MentorId = a.Lesson.Group.MentorId,
                MentorUserId = (int?)a.Lesson.Group.Mentor.UserId,
                MentorFullName = a.Lesson.Group.Mentor.User.FullName
            })
            .ToListAsync(ct);

        return new AttendanceSummaryResponse
        {
            Present = present,
            Absent = absent,
            Late = late,
            Total = present + absent + late,
            RecentAbsent = recentAbsent,
            RecentLate = recentLate
        };
    }

    public async Task<List<Attendance>> GetByStudentAndLessonsAsync(
        int studentId, List<int> lessonIds)
    {
        return await context.Attendances
            .Where(a => a.StudentId == studentId && lessonIds.Contains(a.LessonId))
            .ToListAsync();
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