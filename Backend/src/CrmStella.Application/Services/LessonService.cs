using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Lesson.Request;
using CrmStella.Application.DTOs.Lesson.Response;
using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Application.Interfaces.Services;
using CrmStella.Domain.Constants;
using CrmStella.Domain.Entities;
using CrmStella.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CrmStella.Application.Services;

public class LessonService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IAuditLogService auditLogService,
    ILogger<LessonService> logger)
    : ILessonService
{
    private const string LessonCachePrefix = "lessons:";
    private const string LessonListCacheKey = "lessons:list";

    public async Task<Result<List<LessonResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var cached = await cache.GetAsync<List<LessonResponse>>(LessonListCacheKey);
        if (cached is not null)
            return Result<List<LessonResponse>>.Ok(cached);

        var lessons = await unitOfWork.Lessons.GetAllAsync(cancellationToken);
        var result = lessons.Select(MapToResponse).ToList();

        await cache.SetAsync(LessonListCacheKey, result, TimeSpan.FromMinutes(30));
        return Result<List<LessonResponse>>.Ok(result);
    }

    public async Task<Result<LessonResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{LessonCachePrefix}{id}";
        var cached = await cache.GetAsync<LessonResponse>(cacheKey);

        if (cached is not null)
            return Result<LessonResponse>.Ok(cached);

        var lesson = await unitOfWork.Lessons.GetByIdAsync(id, cancellationToken);
        if (lesson is null)
        {
            logger.LogWarning("Lesson not found: {LessonId}", id);
            return Result<LessonResponse>.Fail("Lesson not found");
        }

        var response = MapToResponse(lesson);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));

        return Result<LessonResponse>.Ok(response);
    }

    public async Task<Result<List<LessonResponse>>> GetByGroupIdAsync(int groupId,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{LessonCachePrefix}group:{groupId}";
        var cached = await cache.GetAsync<List<LessonResponse>>(cacheKey);

        if (cached is not null)
            return Result<List<LessonResponse>>.Ok(cached);

        var group = await unitOfWork.Groups.GetByIdAsync(groupId, cancellationToken);
        if (group is null)
            return Result<List<LessonResponse>>.Fail("Group not found");

        var lessons = await unitOfWork.Lessons.GetByGroupIdAsync(groupId, cancellationToken);
        var result = lessons.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(30));

        return Result<List<LessonResponse>>.Ok(result);
    }

    public async Task<Result<LessonResponse>> CreateAsync(
        CreateLessonRequest request,
        CancellationToken cancellationToken = default)
    {
        var group = await unitOfWork.Groups.GetByIdAsync(request.GroupId, cancellationToken);
        if (group is null)
            return Result<LessonResponse>.Fail("Group not found");

        if (request.EndTime <= request.StartTime)
            return Result<LessonResponse>.Fail("EndTime must be after StartTime", ErrorType.BadRequest);

        if (request.LessonDate < DateTime.UtcNow.Date)
            return Result<LessonResponse>.Fail("LessonDate cannot be in the past", ErrorType.BadRequest);

        var existing = await unitOfWork.Lessons.GetByGroupIdAsync(request.GroupId, cancellationToken);
        if (existing.Any(x => x.WeekNumber == request.WeekNumber && x.OrderIndex == request.OrderIndex))
            return Result<LessonResponse>.Fail("Lesson already exists", ErrorType.Conflict);

        var lesson = new Lesson
        {
            GroupId = request.GroupId,
            WeekNumber = request.WeekNumber,
            OrderIndex = request.OrderIndex,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            LessonDate = request.LessonDate,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        };

        await unitOfWork.Lessons.CreateAsync(lesson, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(LessonCachePrefix);

        await auditLogService.LogAsync(
            null,
            AuditActions.CreateLesson,
            "Lesson",
            lesson.Id,
            newValues: new
            {
                lesson.GroupId,
                lesson.Title,
                lesson.LessonDate
            });

        return Result<LessonResponse>.Ok(MapToResponse(lesson));
    }

    public async Task<Result<LessonResponse>> UpdateAsync(
        UpdateLessonRequest request,
        CancellationToken cancellationToken = default)
    {
        var lesson = await unitOfWork.Lessons.GetByIdAsync(request.Id, cancellationToken);
        if (lesson is null)
            return Result<LessonResponse>.Fail("Lesson not found");

        if (request.EndTime <= request.StartTime)
            return Result<LessonResponse>.Fail("EndTime must be after StartTime", ErrorType.BadRequest);

        lesson.GroupId = request.GroupId;
        lesson.WeekNumber = request.WeekNumber;
        lesson.OrderIndex = request.OrderIndex;
        lesson.Title = request.Title.Trim();
        lesson.Description = request.Description?.Trim();
        lesson.LessonDate = request.LessonDate;
        lesson.StartTime = request.StartTime;
        lesson.EndTime = request.EndTime;
        lesson.IsCompleted = request.IsCompleted;
        lesson.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.Lessons.UpdateAsync(lesson, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(LessonCachePrefix);

        await auditLogService.LogAsync(
            null,
            AuditActions.UpdateLesson,
            "Lesson",
            lesson.Id,
            newValues: new
            {
                lesson.Title,
                lesson.IsCompleted
            });

        return Result<LessonResponse>.Ok(MapToResponse(lesson));
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var lesson = await unitOfWork.Lessons.GetByIdAsync(id, cancellationToken);
        if (lesson is null)
            return Result<bool>.Fail("Lesson not found");

        await unitOfWork.Lessons.DeleteAsync(id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(LessonCachePrefix);

        await auditLogService.LogAsync(
            null,
            AuditActions.DeleteLesson,
            "Lesson",
            id);

        return Result<bool>.Ok(true);
    }

    private static LessonResponse MapToResponse(Lesson l)
    {
        return new LessonResponse
        {
            Id = l.Id,
            GroupId = l.GroupId,
            GroupName = l.Group?.Name ?? string.Empty,
            WeekNumber = l.WeekNumber,
            OrderIndex = l.OrderIndex,
            Title = l.Title,
            Description = l.Description,
            LessonDate = l.LessonDate,
            StartTime = l.StartTime,
            EndTime = l.EndTime,
            IsCompleted = l.IsCompleted,
            CreatedAt = l.CreatedAt,
            UpdatedAt = l.UpdatedAt
        };
    }
}