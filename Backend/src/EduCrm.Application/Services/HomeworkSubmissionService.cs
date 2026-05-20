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
    IFileStorageService fileStorage,
    ILogger<HomeworkSubmissionService> logger)
    : IHomeworkSubmissionService
{
    private const string SubmissionCachePrefix = "submissions:";
    
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
            return Result<HomeworkSubmissionResponse>.Fail("Not found", ErrorType.NotFound);

        var result = MapToResponse(submission);

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(15));

        return Result<HomeworkSubmissionResponse>.Ok(result);
    }
    
    public async Task<Result<HomeworkSubmissionResponse>> GradeAsync(
        GradeHomeworkRequest request,
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        // 1. Проверяем существование посылки (сабмита)
        var submission = await unitOfWork.HomeworkSubmissions.GetByIdAsync(request.Id, cancellationToken);
        if (submission is null)
        {
            logger.LogWarning("Submission not found: {SubmissionId}", request.Id);
            return Result<HomeworkSubmissionResponse>.Fail("Submission not found");
        }

        // 2. Проверяем существование домашней работы
        var homework = await unitOfWork.Homeworks.GetByIdAsync(submission.HomeworkId, cancellationToken);
        if (homework is null)
        {
            logger.LogWarning("Homework not found: {HomeworkId}", submission.HomeworkId);
            return Result<HomeworkSubmissionResponse>.Fail("Homework not found");
        }

        int? mentorId = null;

        // 3. Логика проверки роли: если НЕ админ, то ищем ментора
        if (!isAdmin)
        {
            var mentor = await unitOfWork.Mentors.GetByUserIdAsync(userId, cancellationToken);
            if (mentor is null)
            {
                logger.LogWarning("Mentor not found for user: {UserId}", userId);
                return Result<HomeworkSubmissionResponse>.Fail("Mentor not found", ErrorType.Unauthorized);
            }
            mentorId = mentor.Id;
        }

        // 4. Создаем оценку
        var score = new LessonScore
        {
            StudentId = submission.StudentId,
            LessonId = homework.LessonId,
            HomeworkSubmissionId = submission.Id,
            Score = request.Score,
            MentorFeedback = request.Feedback,
            ScoredByMentorId = mentorId, // null, если проверил Админ
            ScoredAt = DateTime.UtcNow
        };

        await unitOfWork.LessonScores.CreateAsync(score, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        // 5. Привязываем оценку к работе и обновляем
        submission.LessonScore = score;
        await unitOfWork.HomeworkSubmissions.UpdateAsync(submission, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        // 6. Сбрасываем кэш
        await cache.RemoveByPrefixAsync(SubmissionCachePrefix);

        // 7. Получаем свежие данные и возвращаем ответ
        var updated = await unitOfWork.HomeworkSubmissions.GetByIdAsync(submission.Id, cancellationToken);
        return Result<HomeworkSubmissionResponse>.Ok(MapToResponse(updated!));
    }
    
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
        IsLate = s.IsLate
    };
}