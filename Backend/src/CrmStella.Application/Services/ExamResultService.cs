using CrmStella.Application.Common;
using CrmStella.Application.DTOs.ExamResult.Request;
using CrmStella.Application.DTOs.ExamResult.Response;
using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Application.Interfaces.Services;
using CrmStella.Domain.Constants;
using CrmStella.Domain.Entities;
using CrmStella.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CrmStella.Application.Services;

public class ExamResultService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<ExamResultService> logger,
    IAuditLogService auditLogService) : IExamResultService
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
            return Result<ExamResultResponse>.Fail("Exam result not found");
        }

        var response = MapToResponse(result);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(15));

        return Result<ExamResultResponse>.Ok(response);
    }

    public async Task<Result<ExamResultResponse>> CreateAsync(
        CreateExamResultRequest request,
        int mentorUserId)
    {
        var exam = await unitOfWork.Exams.GetByIdAsync(request.ExamId);
        if (exam is null)
            return Result<ExamResultResponse>.Fail("Exam not found");

        var student = await unitOfWork.Students.GetByIdAsync(request.StudentId);
        if (student is null)
            return Result<ExamResultResponse>.Fail("Student not found");

        if (request.Score > exam.MaxScore)
            return Result<ExamResultResponse>.Fail(
                $"Score cannot exceed exam max score ({exam.MaxScore})",
                ErrorType.BadRequest);

        var existing = await unitOfWork.ExamResults
            .GetByExamAndStudentAsync(request.ExamId, request.StudentId);

        if (existing is not null)
            return Result<ExamResultResponse>.Fail(
                "This student already has a result for this exam",
                ErrorType.Conflict);

        var mentor = await unitOfWork.Mentors.GetByUserIdAsync(mentorUserId);

        var examResult = new ExamResult
        {
            ExamId = request.ExamId,
            StudentId = request.StudentId,
            Score = request.Score,
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

        await auditLogService.LogAsync(
            mentorUserId,
            AuditActions.CreateExamResult,
            "ExamResult",
            examResult.Id,
            newValues: new
            {
                examResult.ExamId,
                examResult.StudentId,
                examResult.Score,
                examResult.Status,
                examResult.Comment,
                examResult.ScoredByMentorId
            });

        var created = await unitOfWork.ExamResults.GetByIdAsync(examResult.Id);
        return Result<ExamResultResponse>.Ok(MapToResponse(created!));
    }

    public async Task<Result<ExamResultResponse>> UpdateAsync(
        int id,
        UpdateExamResultRequest request,
        int mentorUserId)
    {
        var examResult = await unitOfWork.ExamResults.GetByIdAsync(id);
        if (examResult is null)
        {
            logger.LogWarning("Update failed - exam result not found: {ResultId}", id);
            return Result<ExamResultResponse>.Fail("Exam result not found");
        }

        var oldValues = new
        {
            examResult.Score,
            examResult.Status,
            examResult.Comment
        };

        if (request.Score is not null)
        {
            if (request.Score.Value > examResult.Exam.MaxScore)
                return Result<ExamResultResponse>.Fail(
                    $"Score cannot exceed exam max score ({examResult.Exam.MaxScore})",
                    ErrorType.BadRequest);

            examResult.Score = request.Score.Value;
            examResult.Status = request.Score.Value >= examResult.Exam.PassScore
                ? ExamResultStatus.Passed
                : ExamResultStatus.Failed;
        }

        if (request.Comment is not null)
            examResult.Comment = request.Comment.Trim();

        var mentor = await unitOfWork.Mentors.GetByUserIdAsync(mentorUserId);
        if (mentor is not null)
            examResult.ScoredByMentorId = mentor.Id;

        examResult.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.ExamResults.UpdateAsync(examResult);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(ExamResultCachePrefix);

        await auditLogService.LogAsync(
            mentorUserId,
            AuditActions.UpdateExamResult,
            "ExamResult",
            examResult.Id,
            oldValues,
            new
            {
                examResult.Score,
                examResult.Status,
                examResult.Comment
            });

        return Result<ExamResultResponse>.Ok(MapToResponse(examResult));
    }

    private static ExamResultResponse MapToResponse(ExamResult r)
    {
        return new ExamResultResponse
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
}