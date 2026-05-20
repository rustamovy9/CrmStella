using EduCrm.Application.Common;
using EduCrm.Application.DTOs.LessonScore.Request;
using EduCrm.Application.DTOs.LessonScore.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class LessonScoreService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<LessonScoreService> logger) : ILessonScoreService
{
    private const string ScoreCachePrefix = "scores:";
    private const string ScoreListCacheKey = "scores:list";

    public async Task<Result<List<LessonScoreResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var cached = await cache.GetAsync<List<LessonScoreResponse>>(ScoreListCacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Scores list served from cache");
            return Result<List<LessonScoreResponse>>.Ok(cached);
        }

        var scores = await unitOfWork.LessonScores.GetAllAsync(cancellationToken);
        var result = scores.Select(MapToResponse).ToList();

        await cache.SetAsync(ScoreListCacheKey, result, TimeSpan.FromMinutes(30));
        return Result<List<LessonScoreResponse>>.Ok(result);
    }

    public async Task<Result<LessonScoreResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{ScoreCachePrefix}{id}";
        var cached = await cache.GetAsync<LessonScoreResponse>(cacheKey);
        if (cached is not null)
        {
            return Result<LessonScoreResponse>.Ok(cached);
        }

        var score = await unitOfWork.LessonScores.GetByIdAsync(id, cancellationToken);
        if (score is null)
        {
            logger.LogWarning("Score not found: {ScoreId}", id);
            return Result<LessonScoreResponse>.Fail("Score not found");
        }

        var response = MapToResponse(score);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));
        return Result<LessonScoreResponse>.Ok(response);
    }

    public async Task<Result<List<LessonScoreResponse>>> GetByLessonIdAsync(int lessonId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{ScoreCachePrefix}lesson:{lessonId}";
        var cached = await cache.GetAsync<List<LessonScoreResponse>>(cacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Scores for lesson {LessonId} served from cache", lessonId);
            return Result<List<LessonScoreResponse>>.Ok(cached);
        }

        var lesson = await unitOfWork.Lessons.GetByIdAsync(lessonId, cancellationToken);
        if (lesson is null)
        {
            return Result<List<LessonScoreResponse>>.Fail("Lesson not found", ErrorType.BadRequest);
        }

        var scores = await unitOfWork.LessonScores.GetByLessonIdAsync(lessonId, cancellationToken);
        var result = scores.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(30));
        return Result<List<LessonScoreResponse>>.Ok(result);
    }

    public async Task<Result<List<LessonScoreResponse>>> GetByStudentIdAsync(int studentId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{ScoreCachePrefix}student:{studentId}";
        var cached = await cache.GetAsync<List<LessonScoreResponse>>(cacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Scores for student {StudentId} served from cache", studentId);
            return Result<List<LessonScoreResponse>>.Ok(cached);
        }

        var student = await unitOfWork.Students.GetByIdAsync(studentId, cancellationToken);
        if (student is null)
        {
            return Result<List<LessonScoreResponse>>.Fail("Student not found", ErrorType.BadRequest);
        }

        var scores = await unitOfWork.LessonScores.GetByStudentIdAsync(studentId, cancellationToken);
        var result = scores.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(30));
        return Result<List<LessonScoreResponse>>.Ok(result);
    }

    public async Task<Result<LessonScoreResponse>> CreateAsync(
        CreateLessonScoreRequest request,
        int userId,
        bool isAdmin, // Принимаем флаг
        CancellationToken cancellationToken = default)
    {
        var lesson = await unitOfWork.Lessons.GetByIdAsync(request.LessonId, cancellationToken);
        if (lesson is null)
            return Result<LessonScoreResponse>.Fail("Lesson not found", ErrorType.NotFound);

        var student = await unitOfWork.Students.GetByIdAsync(request.StudentId, cancellationToken);
        if (student is null)
            return Result<LessonScoreResponse>.Fail("Student not found", ErrorType.NotFound);

        int? mentorId = null;

        // Если это НЕ админ, то проверяем профиль ментора
        if (!isAdmin)
        {
            var mentor = await unitOfWork.Mentors.GetByUserIdAsync(userId, cancellationToken);
            if (mentor is null)
                return Result<LessonScoreResponse>.Fail("Mentor profile not found", ErrorType.Unauthorized);
                
            mentorId = mentor.Id;
        }

        var exists = await unitOfWork.LessonScores
            .ExistsByLessonAndStudentAsync(request.LessonId, request.StudentId, cancellationToken);

        if (exists)
            return Result<LessonScoreResponse>.Fail(
                "Score already exists for this lesson and student",
                ErrorType.Conflict);

        var lessonScore = new LessonScore
        {
            LessonId = request.LessonId,
            StudentId = request.StudentId,
            HomeworkSubmissionId = request.HomeworkSubmissionId,
            Score = request.Score,
            MentorFeedback = request.MentorFeedback,
            ScoredByMentorId = mentorId, // Тут будет null, если ставит Админ
            ScoredAt = DateTime.UtcNow
        };

        await unitOfWork.LessonScores.CreateAsync(lessonScore, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(ScoreCachePrefix);

        logger.LogInformation(
            "Score created: {ScoreId} for lesson {LessonId} student {StudentId}",
            lessonScore.Id,
            lessonScore.LessonId,
            lessonScore.StudentId);

        return Result<LessonScoreResponse>.Ok(MapToResponse(lessonScore));
    }

    public async Task<Result<LessonScoreResponse>> UpdateAsync(UpdateLessonScoreRequest request, CancellationToken cancellationToken = default)
    {
        var score = await unitOfWork.LessonScores.GetByIdAsync(request.Id, cancellationToken);
        if (score is null)
        {
            logger.LogWarning("Update failed - score not found: {ScoreId}", request.Id);
            return Result<LessonScoreResponse>.Fail("Score not found");
        }

        if (request.Score.HasValue)
            score.Score = request.Score.Value;

        if (request.MentorFeedback is not null)
            score.MentorFeedback = request.MentorFeedback;

        score.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.LessonScores.UpdateAsync(score, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(ScoreCachePrefix);

        logger.LogInformation("Score updated: {ScoreId}", score.Id);

        var response = MapToResponse(score);
        return Result<LessonScoreResponse>.Ok(response);
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var score = await unitOfWork.LessonScores.GetByIdAsync(id, cancellationToken);
        if (score is null)
        {
            logger.LogWarning("Delete failed - score not found: {ScoreId}", id);
            return Result<bool>.Fail("Score not found");
        }

        await unitOfWork.LessonScores.DeleteAsync(id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(ScoreCachePrefix);

        logger.LogInformation("Score deleted: {ScoreId}", id);
        return Result<bool>.Ok(true);
    }

    private static LessonScoreResponse MapToResponse(LessonScore ls)
    {
        return new LessonScoreResponse()
        {
            Id = ls.Id,
            LessonId = ls.LessonId,
            LessonTitle = ls.Lesson?.Title ?? string.Empty,
            StudentId = ls.StudentId,
            StudentName = ls.Student?.User?.FullName ?? string.Empty,
            HomeworkSubmissionId = ls.HomeworkSubmissionId,
            Score = ls.Score,
            MentorFeedback = ls.MentorFeedback,
            ScoredByMentorId = ls.ScoredByMentorId,
            ScoredByMentorName = ls.ScoredByMentor?.User?.FullName ?? string.Empty,
            ScoredAt = ls.ScoredAt,
            UpdatedAt = ls.UpdatedAt
        };
    }
}