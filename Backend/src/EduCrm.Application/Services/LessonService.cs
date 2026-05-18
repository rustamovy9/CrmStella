using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Lesson.Request;
using EduCrm.Application.DTOs.Lesson.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class LessonService(IUnitOfWork unitOfWork, ICacheService cache, ILogger<LessonService> logger)
    : ILessonService
{
    private const string LessonCachePrefix = "lessons:";
    private const string LessonListCacheKey = "lessons:list";

    public async Task<Result<List<LessonResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var cached = await cache.GetAsync<List<LessonResponse>>(LessonListCacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Lessons list served from cache");
            return Result<List<LessonResponse>>.Ok(cached);
        }

        var lessons = await unitOfWork.Lessons.GetAllAsync(cancellationToken);

        var result = lessons.Select(MapToResponse).ToList();

        await cache.SetAsync(LessonListCacheKey, result, TimeSpan.FromMinutes(30));

        return Result<List<LessonResponse>>.Ok(result);
    }

    public async Task<Result<LessonResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{LessonCachePrefix}{id}";

        var cached = await cache.GetAsync<LessonResponse>(cacheKey);
        if (cached is not null) return Result<LessonResponse>.Ok(cached);

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
        {
            logger.LogInformation("Lessons for group {GroupId} served from cache", groupId);
            return Result<List<LessonResponse>>.Ok(cached);
        }

        var group = await unitOfWork.Groups.GetByIdAsync(groupId, cancellationToken);
        if (group is null) return Result<List<LessonResponse>>.Fail("Group not found", ErrorType.BadRequest);

        var lessons = await unitOfWork.Lessons.GetByGroupIdAsync(groupId, cancellationToken);

        var result = lessons.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(30));

        return Result<List<LessonResponse>>.Ok(result);
    }

    public async Task<Result<LessonResponse>> CreateAsync(CreateLessonRequest request,
        CancellationToken cancellationToken = default)
    {
        var group = await unitOfWork.Groups.GetByIdAsync(request.GroupId, cancellationToken);
        if (group is null)
        {
            logger.LogWarning("Create failed - group not found: {GroupId}", request.GroupId);
            return Result<LessonResponse>.Fail("Group not found", ErrorType.BadRequest);
        }

        if (request.EndTime <= request.StartTime)
            return Result<LessonResponse>.Fail("EndTime must be after StartTime", ErrorType.BadRequest);

        if (request.LessonDate < DateTime.UtcNow.Date)
            return Result<LessonResponse>.Fail("LessonDate cannot be in the past", ErrorType.BadRequest);

        var existingLessons = await unitOfWork.Lessons.GetByGroupIdAsync(request.GroupId, cancellationToken);
        if (existingLessons.Any(l => l.WeekNumber == request.WeekNumber && l.OrderIndex == request.OrderIndex))
        {
            logger.LogWarning("Create failed - duplicate week number and order index in group {GroupId}",
                request.GroupId);
            return Result<LessonResponse>.Fail("Lesson with this WeekNumber and OrderIndex already exists in the group",
                ErrorType.Conflict);
        }

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

        logger.LogInformation("Lesson created: {LessonId} {Title} for group {GroupId}", lesson.Id, lesson.Title,
            lesson.GroupId);

        var response = MapToResponse(lesson);
        return Result<LessonResponse>.Ok(response);
    }

    public async Task<Result<LessonResponse>> UpdateAsync(UpdateLessonRequest request,
        CancellationToken cancellationToken = default)
    {
        var lesson = await unitOfWork.Lessons.GetByIdAsync(request.Id, cancellationToken);
        if (lesson is null)
        {
            logger.LogWarning("Update failed - lesson not found: {LessonId}", request.Id);
            return Result<LessonResponse>.Fail("Lesson not found");
        }

        if (request.EndTime <= request.StartTime)
            return Result<LessonResponse>.Fail("EndTime must be after StartTime", ErrorType.BadRequest);

        if (request.GroupId != lesson.GroupId)
        {
            var newGroup = await unitOfWork.Groups.GetByIdAsync(request.GroupId, cancellationToken);
            if (newGroup is null) return Result<LessonResponse>.Fail("Group not found", ErrorType.BadRequest);

            var existingInNewGroup = await unitOfWork.Lessons.GetByGroupIdAsync(request.GroupId, cancellationToken);
            if (existingInNewGroup.Any(l =>
                    l.WeekNumber == request.WeekNumber && l.OrderIndex == request.OrderIndex && l.Id != request.Id))
                return Result<LessonResponse>.Fail(
                    "Lesson with this WeekNumber and OrderIndex already exists in the target group",
                    ErrorType.Conflict);
        }
        else
        {
            var existingInSameGroup = await unitOfWork.Lessons.GetByGroupIdAsync(lesson.GroupId, cancellationToken);
            if (existingInSameGroup.Any(l =>
                    l.WeekNumber == request.WeekNumber && l.OrderIndex == request.OrderIndex && l.Id != request.Id))
                return Result<LessonResponse>.Fail(
                    "Lesson with this WeekNumber and OrderIndex already exists in the group", ErrorType.Conflict);
        }

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

        logger.LogInformation("Lesson updated: {LessonId}", lesson.Id);

        var response = MapToResponse(lesson);
        return Result<LessonResponse>.Ok(response);
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var lesson = await unitOfWork.Lessons.GetByIdAsync(id, cancellationToken);
        if (lesson is null)
        {
            logger.LogWarning("Delete failed - lesson not found: {LessonId}", id);
            return Result<bool>.Fail("Lesson not found");
        }

        await unitOfWork.Lessons.DeleteAsync(id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(LessonCachePrefix);

        logger.LogInformation("Lesson deleted: {LessonId}", id);

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