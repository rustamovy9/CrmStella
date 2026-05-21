using EduCrm.Application.Common;
using EduCrm.Application.DTOs.HomeworkSubmission.Request;
using EduCrm.Application.DTOs.HomeworkSubmission.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Constants;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class HomeworkSubmissionService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IFileStorageService fileStorage,
    ILogger<HomeworkSubmissionService> logger,
    IAuditLogService auditLogService)
    : IHomeworkSubmissionService
{
    private const string SubmissionCachePrefix = "submissions:";

    public async Task<Result<HomeworkSubmissionResponse>> SubmitAsync(
        SubmitHomeworkRequest request,
        int studentUserId)
    {
        var homework = await unitOfWork.Homeworks.GetByIdAsync(request.HomeworkId);
        if (homework is null)
            return Result<HomeworkSubmissionResponse>.Fail("Homework not found");

        if (!homework.IsActive)
            return Result<HomeworkSubmissionResponse>.Fail("Homework is closed", ErrorType.BadRequest);

        var student = await unitOfWork.Students.GetByUserIdAsync(studentUserId);
        if (student is null)
            return Result<HomeworkSubmissionResponse>.Fail("Student not found");

        var exists = await unitOfWork.HomeworkSubmissions
            .GetByHomeworkAndStudentAsync(request.HomeworkId, student.Id);

        if (exists is not null)
            return Result<HomeworkSubmissionResponse>.Fail("Already submitted", ErrorType.Conflict);

        var now = DateTime.UtcNow;

        var submission = new HomeworkSubmission
        {
            HomeworkId = request.HomeworkId,
            StudentId = student.Id,
            TextAnswer = request.TextAnswer?.Trim(),
            SubmittedAt = now,
            IsLate = now > homework.Deadline
        };

        await unitOfWork.HomeworkSubmissions.CreateAsync(submission);
        await unitOfWork.SaveChangesAsync();

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

        await auditLogService.LogAsync(
            studentUserId,
            AuditActions.SubmitHomework,
            "HomeworkSubmission",
            submission.Id,
            newValues: new
            {
                submission.HomeworkId,
                submission.StudentId,
                submission.IsLate,
                submission.FileUrl
            });

        var created = await unitOfWork.HomeworkSubmissions.GetByIdAsync(submission.Id);

        return Result<HomeworkSubmissionResponse>.Ok(MapToResponse(created!));
    }

    public async Task<Result<HomeworkSubmissionResponse>> GradeAsync(
        GradeHomeworkRequest request,
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var submission = await unitOfWork.HomeworkSubmissions.GetByIdAsync(request.Id, cancellationToken);
        if (submission is null)
            return Result<HomeworkSubmissionResponse>.Fail("Submission not found");

        var homework = await unitOfWork.Homeworks.GetByIdAsync(submission.HomeworkId, cancellationToken);
        if (homework is null)
            return Result<HomeworkSubmissionResponse>.Fail("Homework not found");

        int? mentorId = null;

        if (!isAdmin)
        {
            var mentor = await unitOfWork.Mentors.GetByUserIdAsync(userId, cancellationToken);
            if (mentor is null)
                return Result<HomeworkSubmissionResponse>.Fail("Mentor not found", ErrorType.Unauthorized);

            mentorId = mentor.Id;
        }

        var oldScore = submission.LessonScore?.Score;

        var score = new LessonScore
        {
            StudentId = submission.StudentId,
            LessonId = homework.LessonId,
            HomeworkSubmissionId = submission.Id,
            Score = request.Score,
            MentorFeedback = request.Feedback,
            ScoredByMentorId = mentorId,
            ScoredAt = DateTime.UtcNow
        };

        await unitOfWork.LessonScores.CreateAsync(score, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        submission.LessonScore = score;
        await unitOfWork.HomeworkSubmissions.UpdateAsync(submission, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(SubmissionCachePrefix);

        await auditLogService.LogAsync(
            userId,
            AuditActions.GradeHomework,
            "HomeworkSubmission",
            submission.Id,
            new { OldScore = oldScore },
            new
            {
                request.Score,
                request.Feedback,
                submission.StudentId,
                submission.HomeworkId
            });

        var updated = await unitOfWork.HomeworkSubmissions.GetByIdAsync(submission.Id, cancellationToken);
        return Result<HomeworkSubmissionResponse>.Ok(MapToResponse(updated!));
    }

    public async Task<Result<List<HomeworkSubmissionResponse>>> GetByHomeworkAsync(int homeworkId)
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
            return Result<HomeworkSubmissionResponse>.Fail("Not found");

        var result = MapToResponse(submission);

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(15));

        return Result<HomeworkSubmissionResponse>.Ok(result);
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
            IsLate = s.IsLate
        };
    }
}