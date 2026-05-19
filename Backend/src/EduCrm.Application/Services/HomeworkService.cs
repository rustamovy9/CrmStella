using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Homework.Request;
using EduCrm.Application.DTOs.Homework.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class HomeworkService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<HomeworkService> logger) : IHomeworkService
{
    private const string HomeworkCachePrefix = "homeworks:";
    private const string HomeworkListCacheKey = "homeworks:list";

    public async Task<Result<List<HomeworkListItemResponse>>> GetAllAsync()
    {
        var cached = await cache.GetAsync<List<HomeworkListItemResponse>>(HomeworkListCacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Homeworks list served from cache");
            return Result<List<HomeworkListItemResponse>>.Ok(cached);
        }

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

        var homeworks = await unitOfWork.Homeworks.GetByLessonAsync(lessonId);

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
            return Result<HomeworkResponse>.Fail("Homework not found", ErrorType.NotFound);
        }

        var response = MapToResponse(homework);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(15));

        return Result<HomeworkResponse>.Ok(response);
    }

    public async Task<Result<HomeworkResponse>> CreateAsync(CreateHomeworkRequest request)
    {
        // урок существует?
        var lesson = await unitOfWork.Lessons.GetByIdAsync(request.LessonId);
        if (lesson is null)
        {
            logger.LogWarning("Create failed - lesson not found: {LessonId}", request.LessonId);
            return Result<HomeworkResponse>.Fail("Lesson not found", ErrorType.BadRequest);
        }

        // дедлайн в прошлом?
        if (request.Deadline <= DateTime.UtcNow)
            return Result<HomeworkResponse>.Fail(
                "Deadline must be in the future", ErrorType.BadRequest);

        var homework = new Domain.Entities.Homework
        {
            LessonId = request.LessonId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Deadline = request.Deadline,
            MaxScore = request.MaxScore,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await unitOfWork.Homeworks.CreateAsync(homework);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(HomeworkCachePrefix);

        logger.LogInformation(
            "Homework created: {HomeworkId} for lesson {LessonId}",
            homework.Id, homework.LessonId);

        var created = await unitOfWork.Homeworks.GetByIdAsync(homework.Id);
        return Result<HomeworkResponse>.Ok(MapToResponse(created!));
    }

    public async Task<Result<HomeworkResponse>> UpdateAsync(int id, UpdateHomeworkRequest request)
    {
        var homework = await unitOfWork.Homeworks.GetByIdAsync(id);
        if (homework is null)
        {
            logger.LogWarning("Update failed - homework not found: {HomeworkId}", id);
            return Result<HomeworkResponse>.Fail("Homework not found", ErrorType.NotFound);
        }

        if (request.Title is not null)
            homework.Title = request.Title.Trim();

        if (request.Description is not null)
            homework.Description = request.Description.Trim();

        if (request.Deadline is not null)
        {
            if (request.Deadline <= DateTime.UtcNow)
                return Result<HomeworkResponse>.Fail(
                    "Deadline must be in the future", ErrorType.BadRequest);
            homework.Deadline = request.Deadline.Value;
        }

        if (request.MaxScore is not null)
            homework.MaxScore = request.MaxScore.Value;

        await unitOfWork.Homeworks.UpdateAsync(homework);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(HomeworkCachePrefix);

        logger.LogInformation("Homework updated: {HomeworkId}", id);

        return Result<HomeworkResponse>.Ok(MapToResponse(homework));
    }

    public async Task<Result<bool>> SetStatusAsync(int id, SetHomeworkStatusRequest request)
    {
        var homework = await unitOfWork.Homeworks.GetByIdAsync(id);
        if (homework is null)
        {
            logger.LogWarning("SetStatus failed - homework not found: {HomeworkId}", id);
            return Result<bool>.Fail("Homework not found", ErrorType.NotFound);
        }

        homework.IsActive = request.IsActive;

        await unitOfWork.Homeworks.UpdateAsync(homework);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(HomeworkCachePrefix);

        logger.LogInformation(
            "Homework status changed: {HomeworkId} IsActive: {IsActive}", id, request.IsActive);

        return Result<bool>.Ok(true);
    }

    private static HomeworkResponse MapToResponse(Domain.Entities.Homework h) => new()
    {
        Id = h.Id,
        LessonId = h.LessonId,
        LessonTitle = h.Lesson?.Title ?? string.Empty,
        Title = h.Title,
        Description = h.Description,
        Deadline = h.Deadline,
        MaxScore = h.MaxScore,
        IsActive = h.IsActive,
        IsOverdue = h.Deadline < DateTime.UtcNow,
        CreatedAt = h.CreatedAt
    };

    private static HomeworkListItemResponse MapToListItem(Domain.Entities.Homework h) => new()
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