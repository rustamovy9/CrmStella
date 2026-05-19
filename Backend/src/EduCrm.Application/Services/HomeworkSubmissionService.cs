using EduCrm.Application.Common;
using EduCrm.Application.DTOs.HomeworkSubmission.Request;
using EduCrm.Application.DTOs.HomeworkSubmission.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class HomeworkSubmissionService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IFileStorageService fileStorage,
    ILogger<HomeworkSubmissionService> logger)
    : IHomeworkSubmissionService
{
    private const string SubmissionCachePrefix = "submissions:";

    // =========================
    // STUDENT FLOW (mobile API)
    // =========================
    public async Task<Result<HomeworkSubmissionResponse>> SubmitAsync(
        SubmitHomeworkRequest request,
        int studentUserId)
    {
        var homework = await unitOfWork.Homeworks.GetByIdAsync(request.HomeworkId);
        if (homework is null)
            return Result<HomeworkSubmissionResponse>.Fail("Homework not found", ErrorType.NotFound);

        if (!homework.IsActive)
            return Result<HomeworkSubmissionResponse>.Fail("Homework is closed", ErrorType.BadRequest);

        var student = await unitOfWork.Students.GetByUserIdAsync(studentUserId);
        if (student is null)
            return Result<HomeworkSubmissionResponse>.Fail("Student not found", ErrorType.NotFound);

        var exists = await unitOfWork.HomeworkSubmissions
            .GetByHomeworkAndStudentAsync(request.HomeworkId, student.Id);

        if (exists is not null)
            return Result<HomeworkSubmissionResponse>.Fail("Already submitted", ErrorType.Conflict);

        var now = DateTime.UtcNow;

        var submission = new Domain.Entities.HomeworkSubmission
        {
            HomeworkId = request.HomeworkId,
            StudentId = student.Id,
            TextAnswer = request.TextAnswer?.Trim(),
            SubmittedAt = now,
            IsLate = now > homework.Deadline
        };

        await unitOfWork.HomeworkSubmissions.CreateAsync(submission);
        await unitOfWork.SaveChangesAsync();

        // file upload
        if (request.File is not null)
        {
            var file = await fileStorage.UploadAsync(
                request.File,
                FileOwnerType.HomeworkSubmission,
                submission.Id,
                studentUserId);

            submission.FileUrl = file.Url;
            await unitOfWork.HomeworkSubmissions.UpdateAsync(submission);
            await unitOfWork.SaveChangesAsync();
        }

        await cache.RemoveByPrefixAsync(SubmissionCachePrefix);

        var created = await unitOfWork.HomeworkSubmissions.GetByIdAsync(submission.Id);

        return Result<HomeworkSubmissionResponse>.Ok(MapToResponse(created!));
    }

    // =========================
    // ADMIN / MENTOR FLOW
    // =========================
    public async Task<Result<List<HomeworkSubmissionResponse>>> GetByHomeworkIdAsync(int homeworkId)
    {
        var cacheKey = $"{SubmissionCachePrefix}homework:{homeworkId}";

        var cached = await cache.GetAsync<List<HomeworkSubmissionResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<HomeworkSubmissionResponse>>.Ok(cached);

        var submissions = await unitOfWork.HomeworkSubmissions.GetByHomeworkIdAsync(homeworkId);

        var result = submissions.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(15));

        return Result<List<HomeworkSubmissionResponse>>.Ok(result);
    }

    public async Task<Result<HomeworkSubmissionResponse>> GetByIdAsync(int id)
    {
        var cacheKey = $"{SubmissionCachePrefix}{id}";

        var cached = await cache.GetAsync<HomeworkSubmissionResponse>(cacheKey);
        if (cached is not null)
            return Result<HomeworkSubmissionResponse>.Ok(cached);

        var submission = await unitOfWork.HomeworkSubmissions.GetByIdAsync(id);

        if (submission is null)
            return Result<HomeworkSubmissionResponse>.Fail("Not found", ErrorType.NotFound);

        return Result<HomeworkSubmissionResponse>.Ok(MapToResponse(submission));
    }

    // =========================
    // GRADING SYSTEM
    // =========================
    public async Task<Result<HomeworkSubmissionResponse>> GradeAsync(
        GradeHomeworkRequest request)
    {
        var submission = await unitOfWork.HomeworkSubmissions.GetByIdAsync(request.Id);
        if (submission is null)
            return Result<HomeworkSubmissionResponse>.Fail("Not found", ErrorType.NotFound);

        var homework = await unitOfWork.Homeworks.GetByIdAsync(submission.HomeworkId);
        if (homework is null)
            return Result<HomeworkSubmissionResponse>.Fail("Homework not found", ErrorType.NotFound);

        var score = new Domain.Entities.LessonScore
        {
            StudentId = submission.StudentId,
            LessonId = homework.LessonId,
            HomeworkSubmissionId = submission.Id,
            Score = request.Score,
            MentorFeedback = request.Feedback,
            ScoredAt = DateTime.UtcNow
        };

        await unitOfWork.LessonScores.CreateAsync(score);
        await unitOfWork.SaveChangesAsync();

        submission.Score = score.Score;
        submission.Feedback = score.MentorFeedback;

        await cache.RemoveByPrefixAsync(SubmissionCachePrefix);

        return Result<HomeworkSubmissionResponse>.Ok(MapToResponse(submission));
    }

    // =========================
    // MAPPER
    // =========================
    private static HomeworkSubmissionResponse MapToResponse(Domain.Entities.HomeworkSubmission s) => new()
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