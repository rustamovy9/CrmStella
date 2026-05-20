using EduCrm.Application.Common;
using EduCrm.Application.DTOs.LessonScore.Request;
using EduCrm.Application.DTOs.LessonScore.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using EduCrm.Domain.Constants;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class LessonScoreService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IAuditLogService auditLogService,
    ILogger<LessonScoreService> logger) : ILessonScoreService
{
    private const string ScoreCachePrefix = "scores:";
    private const string ScoreListCacheKey = "scores:list";

    public async Task<Result<List<LessonScoreResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var cached = await cache.GetAsync<List<LessonScoreResponse>>(ScoreListCacheKey);
        if (cached is not null)
            return Result<List<LessonScoreResponse>>.Ok(cached);

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
            return Result<LessonScoreResponse>.Ok(cached);

        var score = await unitOfWork.LessonScores.GetByIdAsync(id, cancellationToken);
        if (score is null)
            return Result<LessonScoreResponse>.Fail("Score not found");

        var response = MapToResponse(score);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));

        return Result<LessonScoreResponse>.Ok(response);
    }

    public async Task<Result<List<LessonScoreResponse>>> GetByLessonIdAsync(int lessonId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{ScoreCachePrefix}lesson:{lessonId}";
        var cached = await cache.GetAsync<List<LessonScoreResponse>>(cacheKey);

        if (cached is not null)
            return Result<List<LessonScoreResponse>>.Ok(cached);

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
            return Result<List<LessonScoreResponse>>.Ok(cached);

        var scores = await unitOfWork.LessonScores.GetByStudentIdAsync(studentId, cancellationToken);
        var result = scores.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(30));

        return Result<List<LessonScoreResponse>>.Ok(result);
    }

    public async Task<Result<LessonScoreResponse>> CreateAsync(
        CreateLessonScoreRequest request,
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var lesson = await unitOfWork.Lessons.GetByIdAsync(request.LessonId, cancellationToken);
        if (lesson is null)
            return Result<LessonScoreResponse>.Fail("Lesson not found");

        var student = await unitOfWork.Students.GetByIdAsync(request.StudentId, cancellationToken);
        if (student is null)
            return Result<LessonScoreResponse>.Fail("Student not found");

        int? mentorId = null;

        if (!isAdmin)
        {
            var mentor = await unitOfWork.Mentors.GetByUserIdAsync(userId, cancellationToken);
            if (mentor is null)
                return Result<LessonScoreResponse>.Fail("Mentor profile not found");

            mentorId = mentor.Id;
        }

        var exists = await unitOfWork.LessonScores
            .ExistsByLessonAndStudentAsync(request.LessonId, request.StudentId, cancellationToken);

        if (exists)
            return Result<LessonScoreResponse>.Fail("Score already exists");

        var lessonScore = new LessonScore
        {
            LessonId = request.LessonId,
            StudentId = request.StudentId,
            HomeworkSubmissionId = request.HomeworkSubmissionId,
            Score = request.Score,
            MentorFeedback = request.MentorFeedback,
            ScoredByMentorId = mentorId,
            ScoredAt = DateTime.UtcNow
        };

        await unitOfWork.LessonScores.CreateAsync(lessonScore, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(ScoreCachePrefix);

        await auditLogService.LogAsync(
            userId,
            AuditActions.CreateLessonScore,
            "LessonScore",
            lessonScore.Id,
            new { lessonScore.LessonId, lessonScore.StudentId, lessonScore.Score }
        );

        return Result<LessonScoreResponse>.Ok(MapToResponse(lessonScore));
    }

    public async Task<Result<LessonScoreResponse>> UpdateAsync(
        UpdateLessonScoreRequest request,
        CancellationToken cancellationToken = default)
    {
        var score = await unitOfWork.LessonScores.GetByIdAsync(request.Id, cancellationToken);
        if (score is null)
            return Result<LessonScoreResponse>.Fail("Score not found");

        var oldValues = new
        {
            score.Score,
            score.MentorFeedback
        };

        if (request.Score.HasValue)
            score.Score = request.Score.Value;

        if (request.MentorFeedback is not null)
            score.MentorFeedback = request.MentorFeedback;

        score.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.LessonScores.UpdateAsync(score, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(ScoreCachePrefix);

        await auditLogService.LogAsync(
            userId: null,
            action: AuditActions.UpdateLessonScore,
            entityName: "LessonScore",
            entityId: score.Id,
            oldValues: oldValues,
            newValues: new
            {
                score.Score,
                score.MentorFeedback
            });

        return Result<LessonScoreResponse>.Ok(MapToResponse(score));
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var score = await unitOfWork.LessonScores.GetByIdAsync(id, cancellationToken);
        if (score is null)
            return Result<bool>.Fail("Score not found");

        await unitOfWork.LessonScores.DeleteAsync(id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(ScoreCachePrefix);

        await auditLogService.LogAsync(
            userId: null,
            action: AuditActions.DeleteLessonScore,
            entityName: "LessonScore",
            entityId: id,
            oldValues: new { score.LessonId, score.StudentId, score.Score }
        );

        return Result<bool>.Ok(true);
    }

    private static LessonScoreResponse MapToResponse(LessonScore ls)
    {
        return new LessonScoreResponse
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