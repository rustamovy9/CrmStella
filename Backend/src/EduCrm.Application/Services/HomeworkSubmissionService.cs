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
    ILogger<HomeworkSubmissionService> logger) : IHomeworkSubmissionService
{
    private const string SubmissionCachePrefix = "submissions:";

    public async Task<Result<List<HomeworkSubmissionResponse>>> GetByHomeworkAsync(int homeworkId)
    {
        var cacheKey = $"{SubmissionCachePrefix}homework:{homeworkId}";

        var cached = await cache.GetAsync<List<HomeworkSubmissionResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<HomeworkSubmissionResponse>>.Ok(cached);

        var submissions = await unitOfWork.HomeworkSubmissions.GetByHomeworkAsync(homeworkId);

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
        {
            logger.LogWarning("Submission not found: {SubmissionId}", id);
            return Result<HomeworkSubmissionResponse>.Fail("Submission not found", ErrorType.NotFound);
        }

        var response = MapToResponse(submission);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(15));

        return Result<HomeworkSubmissionResponse>.Ok(response);
    }

   public async Task<Result<HomeworkSubmissionResponse>> SubmitAsync(
        SubmitHomeworkRequest request, int studentUserId)
    {
        // 1. задание существует?
        var homework = await unitOfWork.Homeworks.GetByIdAsync(request.HomeworkId);
        if (homework is null)
        {
            logger.LogWarning("Submit failed - homework not found: {HomeworkId}", request.HomeworkId);
            return Result<HomeworkSubmissionResponse>.Fail("Homework not found", ErrorType.NotFound);
        }

        // 2. задание ещё активно?
        if (!homework.IsActive)
            return Result<HomeworkSubmissionResponse>.Fail(
                "Homework is no longer active", ErrorType.BadRequest);

        // 3. находим студента по userId из токена
        var student = await unitOfWork.Students.GetByUserIdAsync(studentUserId);
        if (student is null)
            return Result<HomeworkSubmissionResponse>.Fail(
                "Student profile not found", ErrorType.NotFound);

        // 4. хоть что-то сдано? (текст или файл)
        if (string.IsNullOrWhiteSpace(request.TextAnswer) && request.File is null)
            return Result<HomeworkSubmissionResponse>.Fail(
                "Submission must contain a text answer or a file", ErrorType.BadRequest);

        // 5. уже сдавал это задание?
        var existing = await unitOfWork.HomeworkSubmissions
            .GetByHomeworkAndStudentAsync(request.HomeworkId, student.Id);
        if (existing is not null)
            return Result<HomeworkSubmissionResponse>.Fail(
                "You have already submitted this homework", ErrorType.Conflict);

        var now = DateTime.UtcNow;

        // 6. создаём сдачу. IsLate вычисляем ОДИН раз и СОХРАНЯЕМ в поле
        var submission = new Domain.Entities.HomeworkSubmission
        {
            HomeworkId = request.HomeworkId,
            StudentId = student.Id,
            TextAnswer = request.TextAnswer?.Trim(),
            SubmittedAt = now,
            IsLate = now > homework.Deadline      // <-- пишем в реальное поле БД
        };

        await unitOfWork.HomeworkSubmissions.CreateAsync(submission);
        await unitOfWork.SaveChangesAsync();   // submission.Id присваивается здесь

        // 7. если приложен файл — грузим, и пишем url в submission.FileUrl
        if (request.File is not null && request.File.Length > 0)
        {
            try
            {
                var fileRecord = await fileStorage.UploadAsync(
                    request.File,
                    FileOwnerType.HomeworkSubmission,
                    submission.Id,
                    studentUserId);

                submission.FileUrl = fileRecord.Url;          // <-- сохраняем url прямо в сущность
                await unitOfWork.HomeworkSubmissions.UpdateAsync(submission);
                await unitOfWork.SaveChangesAsync();

                logger.LogInformation(
                    "File attached to submission {SubmissionId}", submission.Id);
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning(ex,
                    "Submission {SubmissionId} created, file rejected", submission.Id);
            }
        }

        await cache.RemoveByPrefixAsync(SubmissionCachePrefix);

        logger.LogInformation(
            "Homework {HomeworkId} submitted by student {StudentId}",
            request.HomeworkId, student.Id);

        var created = await unitOfWork.HomeworkSubmissions.GetByIdAsync(submission.Id);
        return Result<HomeworkSubmissionResponse>.Ok(MapToResponse(created!));
    }

    private static HomeworkSubmissionResponse MapToResponse(Domain.Entities.HomeworkSubmission s) => new()
    {
        Id = s.Id,
        HomeworkId = s.HomeworkId,
        HomeworkTitle = s.Homework?.Title ?? string.Empty,
        StudentId = s.StudentId,
        StudentName = s.Student?.User.FullName ?? string.Empty,
        TextAnswer = s.TextAnswer,
        FileUrl = s.FileUrl,
        SubmittedAt = s.SubmittedAt,
        IsLate = s.IsLate
    };

    private string? GetFileUrl(int submissionId)
    {
        // файл подтягивается из FileStorage по владельцу
        var file = unitOfWork.Files
            .GetByOwnerAsync(FileOwnerType.HomeworkSubmission, submissionId)
            .GetAwaiter().GetResult();
        return file?.Url;
    }

   
}