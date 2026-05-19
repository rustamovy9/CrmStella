using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Homework.Request;
using EduCrm.Application.DTOs.Homework.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Entities;
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

    public async Task<Result<List<HomeworkResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var cached = await cache.GetAsync<List<HomeworkResponse>>(HomeworkListCacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Homeworks list served from cache");
            return Result<List<HomeworkResponse>>.Ok(cached);
        }

        var homeworks = await unitOfWork.Homeworks.GetAllAsync(cancellationToken);
        var result = homeworks.Select(MapToResponse).ToList();

        await cache.SetAsync(HomeworkListCacheKey, result, TimeSpan.FromMinutes(30));
        return Result<List<HomeworkResponse>>.Ok(result);
    }

    public async Task<Result<HomeworkResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{HomeworkCachePrefix}{id}";
        var cached = await cache.GetAsync<HomeworkResponse>(cacheKey);
        if (cached is not null)
        {
            return Result<HomeworkResponse>.Ok(cached);
        }

        var homework = await unitOfWork.Homeworks.GetByIdAsync(id, cancellationToken);
        if (homework is null)
        {
            logger.LogWarning("Homework not found: {HomeworkId}", id);
            return Result<HomeworkResponse>.Fail("Homework not found");
        }

        var response = MapToResponse(homework);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));
        return Result<HomeworkResponse>.Ok(response);
    }

    public async Task<Result<List<HomeworkResponse>>> GetByLessonIdAsync(int lessonId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{HomeworkCachePrefix}lesson:{lessonId}";
        var cached = await cache.GetAsync<List<HomeworkResponse>>(cacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Homeworks for lesson {LessonId} served from cache", lessonId);
            return Result<List<HomeworkResponse>>.Ok(cached);
        }

        var lesson = await unitOfWork.Lessons.GetByIdAsync(lessonId, cancellationToken);
        if (lesson is null)
        {
            return Result<List<HomeworkResponse>>.Fail("Lesson not found", ErrorType.BadRequest);
        }

        var homeworks = await unitOfWork.Homeworks.GetByLessonIdAsync(lessonId, cancellationToken);
        var result = homeworks.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(30));
        return Result<List<HomeworkResponse>>.Ok(result);
    }

    public async Task<Result<HomeworkResponse>> CreateAsync(CreateHomeworkRequest request, CancellationToken cancellationToken = default)
    {
        var lesson = await unitOfWork.Lessons.GetByIdAsync(request.LessonId, cancellationToken);
        if (lesson is null)
        {
            logger.LogWarning("Create failed - lesson not found: {LessonId}", request.LessonId);
            return Result<HomeworkResponse>.Fail("Lesson not found", ErrorType.BadRequest);
        }

        if (request.Deadline <= DateTime.UtcNow)
        {
            return Result<HomeworkResponse>.Fail("Deadline must be in the future", ErrorType.BadRequest);
        }

        if (await unitOfWork.Homeworks.ExistsByTitleInLessonAsync(request.LessonId, request.Title, cancellationToken))
        {
            logger.LogWarning("Create failed - homework with title {Title} already exists in lesson {LessonId}", request.Title, request.LessonId);
            return Result<HomeworkResponse>.Fail("Homework with this title already exists in the lesson", ErrorType.Conflict);
        }

        var homework = new Homework
        {
            LessonId = request.LessonId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            FileUrl = request.FileUrl,
            Deadline = request.Deadline,
            MaxScore = request.MaxScore,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        await unitOfWork.Homeworks.CreateAsync(homework, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(HomeworkCachePrefix);

        logger.LogInformation("Homework created: {HomeworkId} {Title} for lesson {LessonId}", homework.Id, homework.Title, homework.LessonId);

        var response = MapToResponse(homework);
        return Result<HomeworkResponse>.Ok(response);
    }

    public async Task<Result<HomeworkResponse>> UpdateAsync(HomeworkUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var homework = await unitOfWork.Homeworks.GetByIdAsync(request.Id, cancellationToken);
        if (homework is null)
        {
            logger.LogWarning("Update failed - homework not found: {HomeworkId}", request.Id);
            return Result<HomeworkResponse>.Fail("Homework not found");
        }

        if (request.Deadline <= DateTime.UtcNow)
        {
            return Result<HomeworkResponse>.Fail("Deadline must be in the future", ErrorType.BadRequest);
        }

        if (request.LessonId != homework.LessonId)
        {
            var newLesson = await unitOfWork.Lessons.GetByIdAsync(request.LessonId, cancellationToken);
            if (newLesson is null)
            {
                return Result<HomeworkResponse>.Fail("Lesson not found", ErrorType.BadRequest);
            }
        }

        if (await unitOfWork.Homeworks.ExistsByTitleInLessonAsync(request.LessonId, request.Title, cancellationToken) && 
            homework.Title != request.Title)
        {
            return Result<HomeworkResponse>.Fail("Homework with this title already exists in the lesson", ErrorType.Conflict);
        }

        homework.LessonId = request.LessonId;
        homework.Title = request.Title.Trim();
        homework.Description = request.Description.Trim();
        homework.FileUrl = request.FileUrl;
        homework.Deadline = request.Deadline;
        homework.MaxScore = request.MaxScore;
        homework.IsActive = request.IsActive;
        homework.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.Homeworks.UpdateAsync(homework, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(HomeworkCachePrefix);

        logger.LogInformation("Homework updated: {HomeworkId}", homework.Id);

        var response = MapToResponse(homework);
        return Result<HomeworkResponse>.Ok(response);
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var homework = await unitOfWork.Homeworks.GetByIdAsync(id, cancellationToken);
        if (homework is null)
        {
            logger.LogWarning("Delete failed - homework not found: {HomeworkId}", id);
            return Result<bool>.Fail("Homework not found");
        }

        await unitOfWork.Homeworks.DeleteAsync(id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(HomeworkCachePrefix);

        logger.LogInformation("Homework deleted: {HomeworkId}", id);
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
            CreatedAt = h.CreatedAt,
            UpdatedAt = h.UpdatedAt,
            SubmissionsCount = h.Submissions?.Count ?? 0
        };
    }
}