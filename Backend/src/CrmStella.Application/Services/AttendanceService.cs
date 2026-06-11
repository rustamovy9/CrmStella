using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Attendance.Request;
using CrmStella.Application.DTOs.Attendance.Response;
using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Application.Interfaces.Services;
using CrmStella.Domain.Constants;
using CrmStella.Domain.Entities;
using CrmStella.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CrmStella.Application.Services;

public class AttendanceService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IAuditLogService auditLogService,
    ILogger<AttendanceService> logger) : IAttendanceService
{
    private const string AttendanceCachePrefix = "attendance:";

    public async Task<Result<List<AttendanceListItemResponse>>> GetByLessonIdAsync(
        int lessonId,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{AttendanceCachePrefix}lesson:{lessonId}";

        var cached = await cache.GetAsync<List<AttendanceListItemResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<AttendanceListItemResponse>>.Ok(cached);

        var attendances = await unitOfWork.Attendances
            .GetByLessonIdAsync(lessonId, cancellationToken);

        var response = attendances.Select(MapToListItem).ToList();

        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(5));

        return Result<List<AttendanceListItemResponse>>.Ok(response);
    }

    public async Task<Result<AttendanceSummaryResponse>> GetSummaryAsync(
        DateTime date, CancellationToken ct = default)
    {
        var summary = await unitOfWork.Attendances.GetDailySummaryAsync(date, ct);
        return Result<AttendanceSummaryResponse>.Ok(summary);
    }

    public async Task<Result<List<AttendanceListItemResponse>>> GetByStudentIdAsync(
        int studentId,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{AttendanceCachePrefix}student:{studentId}";

        var cached = await cache.GetAsync<List<AttendanceListItemResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<AttendanceListItemResponse>>.Ok(cached);

        var attendances = await unitOfWork.Attendances
            .GetByStudentIdAsync(studentId, cancellationToken);

        var response = attendances.Select(MapToListItem).ToList();

        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(5));

        return Result<List<AttendanceListItemResponse>>.Ok(response);
    }

    public async Task<Result<AttendanceResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{AttendanceCachePrefix}{id}";

        var cached = await cache.GetAsync<AttendanceResponse>(cacheKey);
        if (cached is not null)
            return Result<AttendanceResponse>.Ok(cached);

        var attendance = await unitOfWork.Attendances.GetByIdAsync(id, cancellationToken);
        if (attendance is null)
        {
            logger.LogWarning("Attendance not found: {Id}", id);
            return Result<AttendanceResponse>.Fail("Attendance not found");
        }

        var response = MapToResponse(attendance);

        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(5));

        return Result<AttendanceResponse>.Ok(response);
    }

    public async Task<Result<AttendanceResponse>> CreateAsync(
        CreateAttendanceRequest request,
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var lesson = await unitOfWork.Lessons.GetByIdAsync(request.LessonId, cancellationToken);
        if (lesson is null)
            return Result<AttendanceResponse>.Fail("Lesson not found");

        var student = await unitOfWork.Students.GetByIdAsync(request.StudentId, cancellationToken);
        if (student is null)
            return Result<AttendanceResponse>.Fail("Student not found");

        int? mentorId = null;

        if (!isAdmin)
        {
            var mentor = await unitOfWork.Mentors.GetByUserIdAsync(userId, cancellationToken);

            if (mentor is null)
            {
                logger.LogWarning("Mentor not found: {UserId}", userId);
                return Result<AttendanceResponse>.Fail("Mentor not found");
            }

            mentorId = mentor.Id;
        }

        var exists = await unitOfWork.Attendances.ExistsAsync(
            request.LessonId,
            request.StudentId,
            cancellationToken);

        if (exists)
            return Result<AttendanceResponse>.Fail(
                "Attendance already exists",
                ErrorType.Conflict);

        var attendance = new Attendance
        {
            LessonId = request.LessonId,
            StudentId = request.StudentId,
            Status = request.Status,
            AbsenceReason = request.AbsenceReason?.Trim(),
            MentorNote = request.MentorNote?.Trim(),
            LateMinutes = request.Status == AttendanceStatus.Late ? request.LateMinutes : null,
            MarkedByMentorId = mentorId,
            MarkedAt = DateTime.UtcNow
        };

        await unitOfWork.Attendances.CreateAsync(attendance, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await auditLogService.LogAsync(
            userId,
            AuditActions.MarkAttendance,
            nameof(Attendance),
            attendance.Id,
            newValues: new
            {
                attendance.LessonId,
                attendance.StudentId,
                attendance.Status,
                attendance.MarkedByMentorId
            });

        await cache.RemoveByPrefixAsync(AttendanceCachePrefix);

        var created = await unitOfWork.Attendances
            .GetByIdAsync(attendance.Id, cancellationToken);

        return Result<AttendanceResponse>.Ok(MapToResponse(created!));
    }

    public async Task<Result<List<AttendanceResponse>>> BulkCreateAsync(
        BulkCreateAttendanceRequest request,
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var lesson = await unitOfWork.Lessons.GetByIdAsync(
            request.LessonId,
            cancellationToken);

        if (lesson is null)
            return Result<List<AttendanceResponse>>
                .Fail("Lesson not found");

        int? mentorId = null;

        if (!isAdmin)
        {
            var mentor = await unitOfWork.Mentors.GetByUserIdAsync(
                userId,
                cancellationToken);

            if (mentor is null)
            {
                logger.LogWarning(
                    "Mentor not found: {UserId}",
                    userId);

                return Result<List<AttendanceResponse>>
                    .Fail("Mentor not found");
            }

            mentorId = mentor.Id;
        }

        var createdList = new List<AttendanceResponse>();

        foreach (var item in request.Students)
        {
            var student = await unitOfWork.Students.GetByIdAsync(
                item.StudentId,
                cancellationToken);

            if (student is null)
                continue;

            var exists = await unitOfWork.Attendances.ExistsAsync(
                request.LessonId,
                item.StudentId,
                cancellationToken);

            if (exists)
                continue;

            var attendance = new Attendance
            {
                LessonId = request.LessonId,
                StudentId = item.StudentId,
                Status = item.Status,
                AbsenceReason = item.AbsenceReason?.Trim(),
                MentorNote = item.MentorNote?.Trim(),
                MarkedByMentorId = mentorId,
                MarkedAt = DateTime.UtcNow
            };

            await unitOfWork.Attendances.CreateAsync(
                attendance,
                cancellationToken);

            createdList.Add(new AttendanceResponse
            {
                LessonId = attendance.LessonId,
                StudentId = attendance.StudentId,
                Status = attendance.Status.ToString(),
                MarkedByMentorId = attendance.MarkedByMentorId,
                MarkedAt = attendance.MarkedAt
            });
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        await auditLogService.LogAsync(
            userId,
            AuditActions.MarkAttendance,
            nameof(Attendance),
            request.LessonId,
            newValues: new
            {
                request.LessonId,
                CreatedCount = createdList.Count
            });

        await cache.RemoveByPrefixAsync(AttendanceCachePrefix);

        logger.LogInformation(
            "Bulk attendance created for lesson {LessonId}. Count: {Count}",
            request.LessonId,
            createdList.Count);

        return Result<List<AttendanceResponse>>.Ok(createdList);
    }

    public async Task<Result<AttendanceResponse>> UpdateAsync(
        int id,
        UpdateAttendanceRequest request,
        CancellationToken cancellationToken = default)
    {
        var attendance = await unitOfWork.Attendances.GetByIdAsync(id, cancellationToken);
        if (attendance is null)
            return Result<AttendanceResponse>.Fail("Attendance not found");

        var oldValues = new
        {
            attendance.Status,
            attendance.AbsenceReason,
            attendance.MentorNote
        };

        attendance.Status = request.Status;
        attendance.AbsenceReason = request.AbsenceReason?.Trim();
        attendance.MentorNote = request.MentorNote?.Trim();
        attendance.LateMinutes = request.Status == AttendanceStatus.Late ? request.LateMinutes : null;

        await unitOfWork.Attendances.UpdateAsync(attendance, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await auditLogService.LogAsync(
            null,
            AuditActions.UpdateAttendance,
            nameof(Attendance),
            id,
            oldValues,
            new
            {
                attendance.Status,
                attendance.AbsenceReason,
                attendance.MentorNote
            });

        await cache.RemoveByPrefixAsync(AttendanceCachePrefix);

        var updated = await unitOfWork.Attendances.GetByIdAsync(id, cancellationToken);
        return Result<AttendanceResponse>.Ok(MapToResponse(updated!));
    }

    public async Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var attendance = await unitOfWork.Attendances.GetByIdAsync(id, cancellationToken);
        if (attendance is null)
            return Result<bool>.Fail("Attendance not found");

        await auditLogService.LogAsync(
            null,
            AuditActions.DeleteAttendance,
            nameof(Attendance),
            id,
            new
            {
                attendance.LessonId,
                attendance.StudentId,
                attendance.Status
            });

        await unitOfWork.Attendances.DeleteAsync(id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(AttendanceCachePrefix);

        return Result<bool>.Ok(true);
    }

    private static AttendanceResponse MapToResponse(Attendance a)
    {
        return new AttendanceResponse
        {
            Id = a.Id,
            LessonId = a.LessonId,
            LessonTitle = a.Lesson?.Title ?? string.Empty,
            StudentId = a.StudentId,
            StudentFullName = a.Student?.User?.FullName ?? string.Empty,
            Status = a.Status.ToString(),
            AbsenceReason = a.AbsenceReason,
            MentorNote = a.MentorNote,
            LateMinutes = a.LateMinutes,
            MarkedByMentorId = a.MarkedByMentorId,
            MarkedByMentorName = a.MarkedByMentor?.User?.FullName,
            MarkedAt = a.MarkedAt,
            UpdatedAt = a.UpdatedAt
        };
    }

    private static AttendanceListItemResponse MapToListItem(Attendance a)
    {
        return new AttendanceListItemResponse
        {
            Id = a.Id,
            LessonId = a.LessonId,
            StudentId = a.StudentId,
            StudentFullName = a.Student?.User?.FullName ?? string.Empty,
            Status = a.Status.ToString(),
            LateMinutes = a.LateMinutes,
            AbsenceReason = a.AbsenceReason,
            MentorNote = a.MentorNote,
            MarkedAt = a.MarkedAt
        };
    }
}