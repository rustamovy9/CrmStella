using EduCrm.Application.Common;
using EduCrm.Application.DTOs.ExamResult.Request;
using EduCrm.Application.DTOs.ExamResult.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class ExamResultService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<ExamResultService> logger) : IExamResultService
{
    private const string ExamResultCachePrefix = "examresults:";

    public async Task<Result<List<ExamResultResponse>>> GetByExamAsync(int examId)
    {
        var cacheKey = $"{ExamResultCachePrefix}exam:{examId}";

        var cached = await cache.GetAsync<List<ExamResultResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<ExamResultResponse>>.Ok(cached);

        var results = await unitOfWork.ExamResults.GetByExamAsync(examId);

        var mapped = results.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, mapped, TimeSpan.FromMinutes(15));

        return Result<List<ExamResultResponse>>.Ok(mapped);
    }

    public async Task<Result<ExamResultResponse>> GetByIdAsync(int id)
    {
        var cacheKey = $"{ExamResultCachePrefix}{id}";

        var cached = await cache.GetAsync<ExamResultResponse>(cacheKey);
        if (cached is not null)
            return Result<ExamResultResponse>.Ok(cached);

        var result = await unitOfWork.ExamResults.GetByIdAsync(id);
        if (result is null)
        {
            logger.LogWarning("ExamResult not found: {ResultId}", id);
            return Result<ExamResultResponse>.Fail("Exam result not found", ErrorType.NotFound);
        }

        var response = MapToResponse(result);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(15));

        return Result<ExamResultResponse>.Ok(response);
    }

    public async Task<Result<ExamResultResponse>> CreateAsync(
        CreateExamResultRequest request, int mentorUserId)
    {
        // 1. экзамен существует?
        var exam = await unitOfWork.Exams.GetByIdAsync(request.ExamId);
        if (exam is null)
        {
            logger.LogWarning("Create failed - exam not found: {ExamId}", request.ExamId);
            return Result<ExamResultResponse>.Fail("Exam not found", ErrorType.NotFound);
        }

        // 2. студент существует?
        var student = await unitOfWork.Students.GetByIdAsync(request.StudentId);
        if (student is null)
            return Result<ExamResultResponse>.Fail("Student not found", ErrorType.NotFound);

        // 3. балл не превышает максимум экзамена?
        if (request.Score > exam.MaxScore)
            return Result<ExamResultResponse>.Fail(
                $"Score cannot exceed exam max score ({exam.MaxScore})", ErrorType.BadRequest);

        // 4. уже выставлена оценка этому студенту за этот экзамен?
        var existing = await unitOfWork.ExamResults
            .GetByExamAndStudentAsync(request.ExamId, request.StudentId);
        if (existing is not null)
            return Result<ExamResultResponse>.Fail(
                "This student already has a result for this exam", ErrorType.Conflict);

        // 5. кто выставляет — находим ментора по userId из токена
        var mentor = await unitOfWork.Mentors.GetByUserIdAsync(mentorUserId);

        var examResult = new Domain.Entities.ExamResult
        {
            ExamId = request.ExamId,
            StudentId = request.StudentId,
            Score = request.Score,
            // СТАТУС ВЫЧИСЛЯЕТСЯ, не вводится: сдал, если балл >= проходного
            Status = request.Score >= exam.PassScore
                ? ExamResultStatus.Passed
                : ExamResultStatus.Failed,
            Comment = request.Comment?.Trim(),
            ScoredByMentorId = mentor?.Id,
            ScoredAt = DateTime.UtcNow
        };

        await unitOfWork.ExamResults.CreateAsync(examResult);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(ExamResultCachePrefix);

        logger.LogInformation(
            "ExamResult created: student {StudentId} exam {ExamId} score {Score} -> {Status}",
            request.StudentId, request.ExamId, request.Score, examResult.Status);

        var created = await unitOfWork.ExamResults.GetByIdAsync(examResult.Id);
        return Result<ExamResultResponse>.Ok(MapToResponse(created!));
    }

    public async Task<Result<ExamResultResponse>> UpdateAsync(
        int id, UpdateExamResultRequest request, int mentorUserId)
    {
        var examResult = await unitOfWork.ExamResults.GetByIdAsync(id);
        if (examResult is null)
        {
            logger.LogWarning("Update failed - exam result not found: {ResultId}", id);
            return Result<ExamResultResponse>.Fail("Exam result not found", ErrorType.NotFound);
        }

        if (request.Score is not null)
        {
            // балл не превышает максимум экзамена?
            if (request.Score.Value > examResult.Exam.MaxScore)
                return Result<ExamResultResponse>.Fail(
                    $"Score cannot exceed exam max score ({examResult.Exam.MaxScore})",
                    ErrorType.BadRequest);

            examResult.Score = request.Score.Value;
            // ПЕРЕСЧИТЫВАЕМ статус при изменении балла
            examResult.Status = request.Score.Value >= examResult.Exam.PassScore
                ? ExamResultStatus.Passed
                : ExamResultStatus.Failed;
        }

        if (request.Comment is not null)
            examResult.Comment = request.Comment.Trim();

        // кто изменил оценку
        var mentor = await unitOfWork.Mentors.GetByUserIdAsync(mentorUserId);
        if (mentor is not null)
            examResult.ScoredByMentorId = mentor.Id;

        examResult.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.ExamResults.UpdateAsync(examResult);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(ExamResultCachePrefix);

        logger.LogInformation(
            "ExamResult updated: {ResultId} score {Score} -> {Status}",
            id, examResult.Score, examResult.Status);

        return Result<ExamResultResponse>.Ok(MapToResponse(examResult));
    }

    private static ExamResultResponse MapToResponse(Domain.Entities.ExamResult r) => new()
    {
        Id = r.Id,
        ExamId = r.ExamId,
        ExamTitle = r.Exam?.Title ?? string.Empty,
        StudentId = r.StudentId,
        StudentName = r.Student?.User.FullName ?? string.Empty,
        Score = r.Score,
        Status = r.Status.ToString(),
        Comment = r.Comment,
        ScoredByMentorId = r.ScoredByMentorId,
        ScoredByMentorName = r.ScoredByMentor?.User.FullName,
        ScoredAt = r.ScoredAt,
        UpdatedAt = r.UpdatedAt
    };
}