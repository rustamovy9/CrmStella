using EduCrm.Application.Common;
using EduCrm.Application.DTOs.StudentProgress.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class StudentProgressService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<StudentProgressService> logger) : IStudentProgressService
{
    private const string ProgressCachePrefix = "progress:";

    public async Task<Result<StudentProgressResponse>> GetByStudentAndGroupAsync(
        int studentId, int groupId)
    {
        var cacheKey = $"{ProgressCachePrefix}{studentId}:{groupId}";

        var cached = await cache.GetAsync<StudentProgressResponse>(cacheKey);
        if (cached is not null)
            return Result<StudentProgressResponse>.Ok(cached);

        var progress = await unitOfWork.StudentProgress
            .GetByStudentAndGroupAsync(studentId, groupId);

        if (progress is null)
        {
            logger.LogWarning(
                "Progress not found for student {StudentId} group {GroupId}",
                studentId, groupId);

            return Result<StudentProgressResponse>.Fail(
                "Progress not found. Recalculate first.",
                ErrorType.NotFound);
        }

        var response = MapToResponse(progress);

        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(15));

        return Result<StudentProgressResponse>.Ok(response);
    }

    public async Task<Result<List<StudentProgressResponse>>> GetByGroupAsync(int groupId)
    {
        var cacheKey = $"{ProgressCachePrefix}group:{groupId}";

        var cached = await cache.GetAsync<List<StudentProgressResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<StudentProgressResponse>>.Ok(cached);

        var list = await unitOfWork.StudentProgress.GetByGroupAsync(groupId);

        var result = list.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(15));

        return Result<List<StudentProgressResponse>>.Ok(result);
    }

    public async Task<Result<StudentProgressResponse>> RecalculateAsync(
        int studentId, int groupId)
    {
        var student = await unitOfWork.Students.GetByIdAsync(studentId);
        if (student is null)
            return Result<StudentProgressResponse>.Fail("Student not found", ErrorType.NotFound);

        var group = await unitOfWork.Groups.GetByIdAsync(groupId);
        if (group is null)
            return Result<StudentProgressResponse>.Fail("Group not found", ErrorType.NotFound);

        var progress = await unitOfWork.StudentProgress
            .GetByStudentAndGroupAsync(studentId, groupId);

        var isNew = progress is null;

        progress ??= new Domain.Entities.StudentProgress
        {
            StudentId = studentId,
            GroupId = groupId
        };

        var totalLessons = group.Lessons?.Count ?? 0;

        var attendedLessons = student.Attendances?
            .Count(a => a.Lesson.GroupId == groupId
                        && a.Status == AttendanceStatus.Present) ?? 0;

        progress.TotalLessons = totalLessons;
        progress.AttendedLessons = attendedLessons;

        progress.AttendanceRate = totalLessons == 0
            ? 0
            : Math.Round((decimal)attendedLessons / totalLessons * 100, 2);

        var lessonScores = student.LessonScores?
            .Where(ls => ls.Lesson.GroupId == groupId)
            .Select(ls => ls.Score)
            .ToList() ?? new List<decimal>();

        progress.AverageLessonScore = lessonScores.Count == 0
            ? 0
            : Math.Round(lessonScores.Average(), 2);

        var examResults = student.ExamResults?
            .Where(er => er.Exam.GroupId == groupId)
            .ToList() ?? new();

        progress.ExamsPassed = examResults.Count(er => er.Status == ExamResultStatus.Passed);
        progress.ExamsFailed = examResults.Count(er => er.Status == ExamResultStatus.Failed);

        progress.OverallProgressPercent = Math.Round(
            (progress.AttendanceRate * 0.4m) +
            (progress.AverageLessonScore * 0.6m), 2);

        progress.IsRecommendedForCertificate =
            progress.OverallProgressPercent >= 70 &&
            progress.ExamsFailed == 0;

        progress.UpdatedAt = DateTime.UtcNow;

        if (isNew)
            await unitOfWork.StudentProgress.CreateAsync(progress);
        else
            await unitOfWork.StudentProgress.UpdateAsync(progress);

        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(ProgressCachePrefix);

        var saved = await unitOfWork.StudentProgress
            .GetByStudentAndGroupAsync(studentId, groupId);

        return Result<StudentProgressResponse>.Ok(MapToResponse(saved!));
    }

    private static StudentProgressResponse MapToResponse(Domain.Entities.StudentProgress p) => new()
    {
        Id = p.Id,
        StudentId = p.StudentId,
        StudentName = p.Student?.User.FullName ?? string.Empty,
        GroupId = p.GroupId,
        GroupName = p.Group?.Name ?? string.Empty,
        TotalLessons = p.TotalLessons,
        AttendedLessons = p.AttendedLessons,
        AttendanceRate = p.AttendanceRate,
        AverageLessonScore = p.AverageLessonScore,
        AverageHomeworkScore = p.AverageHomeworkScore,
        TotalBonusScore = p.TotalBonusScore,
        ExamsPassed = p.ExamsPassed,
        ExamsFailed = p.ExamsFailed,
        OverallProgressPercent = p.OverallProgressPercent,
        IsRecommendedForCertificate = p.IsRecommendedForCertificate,
        UpdatedAt = p.UpdatedAt
    };
}