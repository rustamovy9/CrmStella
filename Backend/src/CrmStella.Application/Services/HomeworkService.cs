using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Homework.Request;
using CrmStella.Application.DTOs.Homework.Response;
using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Application.Interfaces.Services;
using CrmStella.Domain.Constants;
using CrmStella.Domain.Entities;
using CrmStella.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CrmStella.Application.Services;

public class HomeworkService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<HomeworkService> logger,
    IAuditLogService auditLogService) : IHomeworkService
{
    private const string HomeworkCachePrefix = "homeworks:";
    private const string HomeworkListCacheKey = "homeworks:list";

    public async Task<Result<List<HomeworkListItemResponse>>> GetAllAsync()
    {
        var cached = await cache.GetAsync<List<HomeworkListItemResponse>>(HomeworkListCacheKey);
        if (cached is not null)
            return Result<List<HomeworkListItemResponse>>.Ok(cached);

        var homeworks = await unitOfWork.Homeworks.GetAllAsync();

        var result = homeworks.Select(MapToListItem).ToList();

        await cache.SetAsync(HomeworkListCacheKey, result, TimeSpan.FromMinutes(15));

        return Result<List<HomeworkListItemResponse>>.Ok(result);
    }

    public async Task<Result<List<HomeworkListItemResponse>>> GetByLessonAsync(int lessonId)
    {
        var cacheKey = $"{HomeworkCachePrefix}lesson:{lessonId}";

        var cached = await cache.GetAsync<List<HomeworkListItemResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<HomeworkListItemResponse>>.Ok(cached);

        var lesson = await unitOfWork.Lessons.GetByIdAsync(lessonId);
        if (lesson is null)
            return Result<List<HomeworkListItemResponse>>.Fail("Lesson not found");

        var homeworks = await unitOfWork.Homeworks.GetByLessonIdAsync(lessonId);

        var result = homeworks.Select(MapToListItem).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(15));

        return Result<List<HomeworkListItemResponse>>.Ok(result);
    }

    public async Task<Result<HomeworkResponse>> GetByIdAsync(int id)
    {
        var cacheKey = $"{HomeworkCachePrefix}{id}";

        var cached = await cache.GetAsync<HomeworkResponse>(cacheKey);
        if (cached is not null)
            return Result<HomeworkResponse>.Ok(cached);

        var homework = await unitOfWork.Homeworks.GetByIdAsync(id);
        if (homework is null)
        {
            logger.LogWarning("Homework not found: {HomeworkId}", id);
            return Result<HomeworkResponse>.Fail("Homework not found");
        }

        var response = MapToResponse(homework);

        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(15));

        return Result<HomeworkResponse>.Ok(response);
    }

    public async Task<Result<HomeworkResponse>> CreateAsync(CreateHomeworkRequest request)
    {
        var lesson = await unitOfWork.Lessons.GetByIdAsync(request.LessonId);
        if (lesson is null)
            return Result<HomeworkResponse>.Fail("Lesson not found", ErrorType.BadRequest);

        if (request.Deadline <= DateTime.UtcNow)
            return Result<HomeworkResponse>.Fail("Deadline must be in the future", ErrorType.BadRequest);

        var exists = await unitOfWork.Homeworks
            .ExistsByTitleInLessonAsync(request.LessonId, request.Title);

        if (exists)
            return Result<HomeworkResponse>.Fail(
                "Homework with this title already exists",
                ErrorType.Conflict);

        var homework = new Homework
        {
            LessonId = request.LessonId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            FileUrl = request.FileUrl,
            Deadline = request.Deadline,
            MaxScore = request.MaxScore,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        await unitOfWork.Homeworks.CreateAsync(homework);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(HomeworkCachePrefix);

        await auditLogService.LogAsync(
            null,
            AuditActions.CreateHomework,
            "Homework",
            homework.Id,
            newValues: new
            {
                homework.LessonId,
                homework.Title,
                homework.Deadline,
                homework.MaxScore,
                homework.IsActive
            });

        return Result<HomeworkResponse>.Ok(MapToResponse(homework));
    }

    public async Task<Result<HomeworkResponse>> UpdateAsync(int id, UpdateHomeworkRequest request)
    {
        var homework = await unitOfWork.Homeworks.GetByIdAsync(id);
        if (homework is null)
            return Result<HomeworkResponse>.Fail("Homework not found");

        var oldValues = new
        {
            homework.Title,
            homework.Description,
            homework.Deadline,
            homework.MaxScore,
            homework.IsActive
        };

        if (request.Title is not null)
            homework.Title = request.Title.Trim();

        if (request.Description is not null)
            homework.Description = request.Description.Trim();

        if (request.Deadline is not null)
        {
            if (request.Deadline <= DateTime.UtcNow)
                return Result<HomeworkResponse>.Fail("Deadline must be in future", ErrorType.BadRequest);

            homework.Deadline = request.Deadline.Value;
        }

        if (request.MaxScore is not null)
            homework.MaxScore = request.MaxScore.Value;

        await unitOfWork.Homeworks.UpdateAsync(homework);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(HomeworkCachePrefix);

        await auditLogService.LogAsync(
            null,
            AuditActions.UpdateHomework,
            "Homework",
            homework.Id,
            oldValues,
            new
            {
                homework.Title,
                homework.Description,
                homework.Deadline,
                homework.MaxScore,
                homework.IsActive
            });

        return Result<HomeworkResponse>.Ok(MapToResponse(homework));
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var homework = await unitOfWork.Homeworks.GetByIdAsync(id);
        if (homework is null)
            return Result<bool>.Fail("Homework not found");

        await unitOfWork.Homeworks.DeleteAsync(id);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(HomeworkCachePrefix);

        await auditLogService.LogAsync(
            null,
            AuditActions.DeleteHomework,
            "Homework",
            id,
            new
            {
                homework.Title,
                homework.LessonId
            });

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> SetStatusAsync(int id, SetHomeworkStatusRequest request)
    {
        var homework = await unitOfWork.Homeworks.GetByIdAsync(id);
        if (homework is null)
            return Result<bool>.Fail("Homework not found");

        var oldStatus = homework.IsActive;

        homework.IsActive = request.IsActive;

        await unitOfWork.Homeworks.UpdateAsync(homework);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(HomeworkCachePrefix);

        await auditLogService.LogAsync(
            null,
            AuditActions.SetHomeworkStatus,
            "Homework",
            homework.Id,
            new { IsActive = oldStatus },
            new { homework.IsActive });

        return Result<bool>.Ok(true);
    }

    private static HomeworkResponse MapToResponse(Homework h)
    {
        return new HomeworkResponse
        {
            Id = h.Id,
            LessonId = h.LessonId,
            LessonTitle = h.Lesson?.Title ?? string.Empty,
            Title = h.Title,
            Description = h.Description,
            FileUrl = h.FileUrl,
            Deadline = h.Deadline,
            MaxScore = h.MaxScore,
            IsActive = h.IsActive,
            IsOverdue = h.Deadline < DateTime.UtcNow,
            CreatedAt = h.CreatedAt,
            UpdatedAt = h.UpdatedAt,
            SubmissionsCount = h.Submissions?.Count ?? 0
        };
    }

    private static HomeworkListItemResponse MapToListItem(Homework h)
    {
        return new HomeworkListItemResponse
        {
            Id = h.Id,
            LessonId = h.LessonId,
            LessonTitle = h.Lesson?.Title ?? string.Empty,
            Title = h.Title,
            Deadline = h.Deadline,
            MaxScore = h.MaxScore,
            IsActive = h.IsActive,
            IsOverdue = h.Deadline < DateTime.UtcNow
        };
    }
}