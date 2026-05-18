using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Attendance.Request;
using EduCrm.Application.DTOs.Attendance.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class AttendanceService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<AttendanceService> logger) : IAttendanceService
{
    private const string AttendanceCachePrefix = "attendance:";

    public async Task<Result<List<AttendanceListItemResponse>>> GetByLessonIdAsync(
        int lessonId,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"attendance:lesson:{lessonId}";

        var cached = await cache.GetAsync<List<AttendanceListItemResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<AttendanceListItemResponse>>.Ok(cached);

        var attendances = await unitOfWork.Attendances
            .GetByLessonIdAsync(lessonId, cancellationToken);

        var response = attendances.Select(MapToListItem).ToList();
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(5));

        return Result<List<AttendanceListItemResponse>>.Ok(response);
    }

    public async Task<Result<List<AttendanceListItemResponse>>> GetByStudentIdAsync(
        int studentId,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"attendance:student:{studentId}";

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
        var cacheKey = $"attendance:{id}";

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
        int mentorUserId, // ✅ Переименовал для ясности
        CancellationToken cancellationToken = default)
    {
        // проверяем lesson
        var lesson = await unitOfWork.Lessons.GetByIdAsync(request.LessonId, cancellationToken);
        if (lesson is null)
            return Result<AttendanceResponse>.Fail("Lesson not found");

        // проверяем student
        var student = await unitOfWork.Students.GetByIdAsync(request.StudentId, cancellationToken);
        if (student is null)
            return Result<AttendanceResponse>.Fail("Student not found");

        // ✅ Ищем Mentor по UserId
        var mentor = await unitOfWork.Mentors.GetByUserIdAsync(mentorUserId, cancellationToken);
        if (mentor is null)
        {
            logger.LogWarning("CreateAttendance failed - mentor not found for UserId: {UserId}", mentorUserId);
            return Result<AttendanceResponse>.Fail("Mentor not found");
        }

        // нельзя отметить дважды
        var exists = await unitOfWork.Attendances
            .ExistsAsync(request.LessonId, request.StudentId, cancellationToken);
        if (exists)
            return Result<AttendanceResponse>.Fail(
                "Attendance already marked for this student and lesson",
                ErrorType.Conflict);

        var attendance = new Attendance
        {
            LessonId = request.LessonId,
            StudentId = request.StudentId,
            Status = request.Status,
            AbsenceReason = request.AbsenceReason?.Trim(),
            MentorNote = request.MentorNote?.Trim(),
            MarkedByMentorId = mentor.Id, // ✅ Используем mentor.Id, не mentorUserId!
            MarkedAt = DateTime.UtcNow
        };

        await unitOfWork.Attendances.CreateAsync(attendance, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(AttendanceCachePrefix);

        logger.LogInformation(
            "Attendance marked: Lesson {LessonId} Student {StudentId} Status {Status} by Mentor {MentorId}",
            request.LessonId, request.StudentId, request.Status, mentor.Id);

        var created = await unitOfWork.Attendances.GetByIdAsync(attendance.Id, cancellationToken);
        return Result<AttendanceResponse>.Ok(MapToResponse(created!));
    }

    public async Task<Result<List<AttendanceResponse>>> BulkCreateAsync(
        BulkCreateAttendanceRequest request,
        int mentorUserId, // ✅ UserId из токена
        CancellationToken cancellationToken = default)
    {
        // проверяем lesson
        var lesson = await unitOfWork.Lessons.GetByIdAsync(request.LessonId, cancellationToken);
        if (lesson is null)
            return Result<List<AttendanceResponse>>.Fail("Lesson not found");

        // ✅ Ищем Mentor по UserId
        var mentor = await unitOfWork.Mentors.GetByUserIdAsync(mentorUserId, cancellationToken);
        if (mentor is null)
        {
            logger.LogWarning("BulkCreateAttendance failed - mentor not found for UserId: {UserId}", mentorUserId);
            return Result<List<AttendanceResponse>>.Fail("Mentor not found");
        }

        var results = new List<Attendance>();

        foreach (var item in request.Students)
        {
            // пропускаем если уже отмечен
            var exists = await unitOfWork.Attendances
                .ExistsAsync(request.LessonId, item.StudentId, cancellationToken);
            if (exists) continue;

            var attendance = new Attendance
            {
                LessonId = request.LessonId,
                StudentId = item.StudentId,
                Status = item.Status,
                AbsenceReason = item.AbsenceReason?.Trim(),
                MentorNote = item.MentorNote?.Trim(),
                MarkedByMentorId = mentor.Id, // ✅ Используем mentor.Id
                MarkedAt = DateTime.UtcNow
            };

            await unitOfWork.Attendances.CreateAsync(attendance, cancellationToken);
            results.Add(attendance);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        await cache.RemoveByPrefixAsync(AttendanceCachePrefix);

        logger.LogInformation(
            "Bulk attendance marked: Lesson {LessonId} Count {Count} by Mentor {MentorId}",
            request.LessonId, results.Count, mentor.Id);

        var response = new List<AttendanceResponse>();
        foreach (var a in results)
        {
            var created = await unitOfWork.Attendances.GetByIdAsync(a.Id, cancellationToken);
            if (created is not null)
                response.Add(MapToResponse(created));
        }

        return Result<List<AttendanceResponse>>.Ok(response);
    }

    public async Task<Result<AttendanceResponse>> UpdateAsync(
        int id,
        UpdateAttendanceRequest request,
        CancellationToken cancellationToken = default)
    {
        var attendance = await unitOfWork.Attendances.GetByIdAsync(id, cancellationToken);
        if (attendance is null)
        {
            logger.LogWarning("UpdateAttendance failed - not found: {Id}", id);
            return Result<AttendanceResponse>.Fail("Attendance not found");
        }

        attendance.Status = request.Status;
        attendance.AbsenceReason = request.AbsenceReason?.Trim();
        attendance.MentorNote = request.MentorNote?.Trim();

        await unitOfWork.Attendances.UpdateAsync(attendance, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(AttendanceCachePrefix);

        logger.LogInformation("Attendance updated: {Id} Status: {Status}", id, request.Status);

        var updated = await unitOfWork.Attendances.GetByIdAsync(id, cancellationToken);
        return Result<AttendanceResponse>.Ok(MapToResponse(updated!));
    }

    public async Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var attendance = await unitOfWork.Attendances.GetByIdAsync(id, cancellationToken);
        if (attendance is null)
        {
            logger.LogWarning("DeleteAttendance failed - not found: {Id}", id);
            return Result<bool>.Fail("Attendance not found");
        }

        await unitOfWork.Attendances.DeleteAsync(id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(AttendanceCachePrefix);

        logger.LogInformation("Attendance deleted: {Id}", id);

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
            StudentId = a.StudentId,
            StudentFullName = a.Student?.User?.FullName ?? string.Empty,
            Status = a.Status.ToString(),
            MarkedAt = a.MarkedAt
        };
    }
}