using EduCrm.Application.Common;
using EduCrm.Application.DTOs.HomeworkSubmission.Request;
using EduCrm.Application.DTOs.HomeworkSubmission.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class HomeworkSubmissionService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<HomeworkSubmissionService> logger) : IHomeworkSubmissionService
{
    private const string SubmissionCachePrefix = "submissions:";
    private const string SubmissionListCacheKey = "submissions:list";

    public async Task<Result<List<HomeworkSubmissionResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var cached = await cache.GetAsync<List<HomeworkSubmissionResponse>>(SubmissionListCacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Submissions list served from cache");
            return Result<List<HomeworkSubmissionResponse>>.Ok(cached);
        }

        var submissions = await unitOfWork.HomeworkSubmissions.GetAllAsync(cancellationToken);
        var result = submissions.Select(MapToResponse).ToList();

        await cache.SetAsync(SubmissionListCacheKey, result, TimeSpan.FromMinutes(30));
        return Result<List<HomeworkSubmissionResponse>>.Ok(result);
    }

    public async Task<Result<HomeworkSubmissionResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{SubmissionCachePrefix}{id}";
        var cached = await cache.GetAsync<HomeworkSubmissionResponse>(cacheKey);
        if (cached is not null)
        {
            return Result<HomeworkSubmissionResponse>.Ok(cached);
        }

        var submission = await unitOfWork.HomeworkSubmissions.GetByIdAsync(id, cancellationToken);
        if (submission is null)
        {
            logger.LogWarning("Submission not found: {SubmissionId}", id);
            return Result<HomeworkSubmissionResponse>.Fail("Submission not found");
        }

        var response = MapToResponse(submission);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));
        return Result<HomeworkSubmissionResponse>.Ok(response);
    }

    public async Task<Result<List<HomeworkSubmissionResponse>>> GetByHomeworkIdAsync(int homeworkId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{SubmissionCachePrefix}homework:{homeworkId}";
        var cached = await cache.GetAsync<List<HomeworkSubmissionResponse>>(cacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Submissions for homework {HomeworkId} served from cache", homeworkId);
            return Result<List<HomeworkSubmissionResponse>>.Ok(cached);
        }

        var homework = await unitOfWork.Homeworks.GetByIdAsync(homeworkId, cancellationToken);
        if (homework is null)
        {
            return Result<List<HomeworkSubmissionResponse>>.Fail("Homework not found", ErrorType.BadRequest);
        }

        var submissions = await unitOfWork.HomeworkSubmissions.GetByHomeworkIdAsync(homeworkId, cancellationToken);
        var result = submissions.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(30));
        return Result<List<HomeworkSubmissionResponse>>.Ok(result);
    }

    public async Task<Result<List<HomeworkSubmissionResponse>>> GetByStudentIdAsync(int studentId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{SubmissionCachePrefix}student:{studentId}";
        var cached = await cache.GetAsync<List<HomeworkSubmissionResponse>>(cacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Submissions for student {StudentId} served from cache", studentId);
            return Result<List<HomeworkSubmissionResponse>>.Ok(cached);
        }

        var student = await unitOfWork.Students.GetByIdAsync(studentId, cancellationToken);
        if (student is null)
        {
            return Result<List<HomeworkSubmissionResponse>>.Fail("Student not found", ErrorType.BadRequest);
        }

        var submissions = await unitOfWork.HomeworkSubmissions.GetByStudentIdAsync(studentId, cancellationToken);
        var result = submissions.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(30));
        return Result<List<HomeworkSubmissionResponse>>.Ok(result);
    }

    public async Task<Result<HomeworkSubmissionResponse>> CreateAsync(CreateHomeworkSubmissionRequest request, CancellationToken cancellationToken = default)
    {
        var homework = await unitOfWork.Homeworks.GetByIdAsync(request.HomeworkId, cancellationToken);
        if (homework is null)
        {
            logger.LogWarning("Create failed - homework not found: {HomeworkId}", request.HomeworkId);
            return Result<HomeworkSubmissionResponse>.Fail("Homework not found", ErrorType.BadRequest);
        }

        var student = await unitOfWork.Students.GetByIdAsync(request.StudentId, cancellationToken);
        if (student is null)
        {
            logger.LogWarning("Create failed - student not found: {StudentId}", request.StudentId);
            return Result<HomeworkSubmissionResponse>.Fail("Student not found", ErrorType.BadRequest);
        }

        var hasSubmitted = await unitOfWork.HomeworkSubmissions.HasSubmittedAsync(request.HomeworkId, request.StudentId, cancellationToken);
        if (hasSubmitted)
        {
            return Result<HomeworkSubmissionResponse>.Fail("Student has already submitted this homework", ErrorType.Conflict);
        }

        var isLate = DateTime.UtcNow > homework.Deadline;

        var submission = new HomeworkSubmission
        {
            HomeworkId = request.HomeworkId,
            StudentId = request.StudentId,
            TextAnswer = request.TextAnswer,
            FileUrl = request.FileUrl,
            SubmittedAt = DateTime.UtcNow,
            IsLate = isLate
        };

        await unitOfWork.HomeworkSubmissions.CreateAsync(submission, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(SubmissionCachePrefix);

        logger.LogInformation("Submission created: {SubmissionId} for homework {HomeworkId} by student {StudentId}", 
            submission.Id, submission.HomeworkId, submission.StudentId);

        var response = MapToResponse(submission);
        return Result<HomeworkSubmissionResponse>.Ok(response);
    }

    public async Task<Result<HomeworkSubmissionResponse>> UpdateAsync(UpdateHomeworkSubmissionRequest request, CancellationToken cancellationToken = default)
    {
        var submission = await unitOfWork.HomeworkSubmissions.GetByIdAsync(request.Id, cancellationToken);
        if (submission is null)
        {
            logger.LogWarning("Update failed - submission not found: {SubmissionId}", request.Id);
            return Result<HomeworkSubmissionResponse>.Fail("Submission not found");
        }

        submission.TextAnswer = request.TextAnswer ?? submission.TextAnswer;
        submission.FileUrl = request.FileUrl ?? submission.FileUrl;
        

        await unitOfWork.HomeworkSubmissions.UpdateAsync(submission, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(SubmissionCachePrefix);

        logger.LogInformation("Submission updated: {SubmissionId}", submission.Id);

        var response = MapToResponse(submission);
        return Result<HomeworkSubmissionResponse>.Ok(response);
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var submission = await unitOfWork.HomeworkSubmissions.GetByIdAsync(id, cancellationToken);
        if (submission is null)
        {
            logger.LogWarning("Delete failed - submission not found: {SubmissionId}", id);
            return Result<bool>.Fail("Submission not found");
        }

        await unitOfWork.HomeworkSubmissions.DeleteAsync(id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(SubmissionCachePrefix);

        logger.LogInformation("Submission deleted: {SubmissionId}", id);
        return Result<bool>.Ok(true);
    }

    public async Task<Result<HomeworkSubmissionResponse>> GradeAsync(GradeHomeworkRequest request, CancellationToken cancellationToken = default)
    {
        var submission = await unitOfWork.HomeworkSubmissions.GetByIdAsync(request.Id, cancellationToken);
        if (submission is null)
        {
            logger.LogWarning("Grade failed - submission not found: {SubmissionId}", request.Id);
            return Result<HomeworkSubmissionResponse>.Fail("Submission not found");
        }

        var homework = await unitOfWork.Homeworks.GetByIdAsync(submission.HomeworkId, cancellationToken);
        if (homework is null)
        {
            return Result<HomeworkSubmissionResponse>.Fail("Homework not found", ErrorType.BadRequest);
        }

        var lessonScore = new LessonScore
        {
            StudentId = submission.StudentId,
            LessonId = homework.LessonId,
            HomeworkSubmissionId = submission.Id,
            Score = request.Score,
            MentorFeedback = request.Feedback,
            ScoredAt = DateTime.UtcNow
        };

        await unitOfWork.LessonScores.CreateAsync(lessonScore, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(SubmissionCachePrefix);

        logger.LogInformation("Submission graded: {SubmissionId} with score {Score}", submission.Id, request.Score);

        var response = MapToResponse(submission);
        response.Score = lessonScore.Score;
        response.Feedback = lessonScore.MentorFeedback;
        
        return Result<HomeworkSubmissionResponse>.Ok(response);
    }

    private static HomeworkSubmissionResponse MapToResponse(HomeworkSubmission s)
    {
        return new HomeworkSubmissionResponse
        {
            Id = s.Id,
            HomeworkId = s.HomeworkId,
            HomeworkTitle = s.Homework?.Title ?? string.Empty,
            StudentId = s.StudentId,
            StudentName = s.Student?.User?.FullName ?? string.Empty,
            TextAnswer = s.TextAnswer,
            FileUrl = s.FileUrl,
            SubmittedAt = s.SubmittedAt,
            IsLate = s.IsLate,
            Score = s.LessonScore?.Score,
            Feedback = s.LessonScore?.MentorFeedback
        };
    }
}