using EduCrm.Application.Common;
using EduCrm.Application.DTOs.WeekResult.Request;
using EduCrm.Application.DTOs.WeekResult.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Constants;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class WeekResultService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IAuditLogService auditLogService,
    ILogger<WeekResultService> logger) : IWeekResultService
{
    private const string WeekResultCachePrefix = "weekresults:";

    public async Task<Result<List<WeekResultResponse>>> GetByStudentAndGroupAsync(
        int studentId, int groupId)
    {
        var cacheKey = $"{WeekResultCachePrefix}student:{studentId}:group:{groupId}";

        var cached = await cache.GetAsync<List<WeekResultResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<WeekResultResponse>>.Ok(cached);

        var list = await unitOfWork.WeekResults.GetByStudentAndGroupAsync(studentId, groupId);

        var result = list.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(15));

        return Result<List<WeekResultResponse>>.Ok(result);
    }

    public async Task<Result<List<WeekResultResponse>>> GetByGroupAndWeekAsync(
        int groupId, int weekNumber)
    {
        var cacheKey = $"{WeekResultCachePrefix}group:{groupId}:week:{weekNumber}";

        var cached = await cache.GetAsync<List<WeekResultResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<WeekResultResponse>>.Ok(cached);

        var list = await unitOfWork.WeekResults.GetByGroupAndWeekAsync(groupId, weekNumber);

        var result = list.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(15));

        return Result<List<WeekResultResponse>>.Ok(result);
    }

    public async Task<Result<WeekResultResponse>> GetByKeyAsync(
        int studentId, int groupId, int weekNumber)
    {
        var weekResult = await unitOfWork.WeekResults
            .GetByKeyAsync(studentId, groupId, weekNumber);

        if (weekResult is null)
            return Result<WeekResultResponse>.Fail(
                "Week result not found. Recalculate first.");

        return Result<WeekResultResponse>.Ok(MapToResponse(weekResult));
    }

    public async Task<Result<WeekResultResponse>> RecalculateAsync(RecalculateWeekRequest request)
    {
        var student = await unitOfWork.Students.GetByIdAsync(request.StudentId);
        if (student is null)
            return Result<WeekResultResponse>.Fail("Student not found");

        var group = await unitOfWork.Groups.GetByIdAsync(request.GroupId);
        if (group is null)
            return Result<WeekResultResponse>.Fail("Group not found");

        var enrollment = student.GroupStudents?
            .FirstOrDefault(gs => gs.GroupId == request.GroupId && gs.IsActive);

        if (enrollment is null)
            return Result<WeekResultResponse>.Fail(
                "Student is not enrolled in this group",
                ErrorType.BadRequest);

        var weekResult = await unitOfWork.WeekResults
            .GetByKeyAsync(request.StudentId, request.GroupId, request.WeekNumber);

        var isNew = weekResult is null;

        var existingBonus = weekResult?.BonusScore ?? 0;
        var existingExam = weekResult?.ExamScore ?? 0;
        var existingComment = weekResult?.MentorComment;

        weekResult ??= new WeekResult
        {
            StudentId = request.StudentId,
            GroupId = request.GroupId,
            WeekNumber = request.WeekNumber,
            CreatedAt = DateTime.UtcNow
        };

        var weekLessons = await unitOfWork.Lessons
            .GetByGroupAndWeekAsync(request.GroupId, request.WeekNumber);

        var weekLessonIds = weekLessons.Select(l => l.Id).ToList();

        var lessonScores = await unitOfWork.LessonScores
            .GetByStudentAndLessonsAsync(request.StudentId, weekLessonIds);

        var lessonScoresSum = lessonScores.Sum(ls => ls.Score);

        weekResult.LessonAverageScore = lessonScores.Count == 0
            ? 0
            : Math.Round(lessonScores.Average(ls => ls.Score), 2);

        weekResult.HomeworkAverageScore = 0;

        var attendances = await unitOfWork.Attendances
            .GetByStudentAndLessonsAsync(request.StudentId, weekLessonIds);

        var totalLessonsInWeek = weekLessons.Count;
        var attendedInWeek = attendances.Count(a => a.Status == AttendanceStatus.Present);

        weekResult.AttendanceScore = totalLessonsInWeek == 0
            ? 0
            : Math.Round((decimal)attendedInWeek / totalLessonsInWeek * 100, 2);

        weekResult.BonusScore = existingBonus;
        weekResult.ExamScore = existingExam;
        weekResult.MentorComment = existingComment;

        weekResult.TotalScore = Math.Round(
            lessonScoresSum + // сумма оценок (0-5 за каждый урок)
            attendedInWeek + // +1 за каждое посещение
            weekResult.ExamScore + // макс 70
            weekResult.BonusScore, // бонус
            2);

        weekResult.UpdatedAt = DateTime.UtcNow;

        if (isNew)
            await unitOfWork.WeekResults.CreateAsync(weekResult);
        else
            await unitOfWork.WeekResults.UpdateAsync(weekResult);

        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(WeekResultCachePrefix);

        await auditLogService.LogAsync(
            null,
            AuditActions.RecalculateWeekResult,
            "WeekResult",
            weekResult.Id,
            newValues: new
            {
                weekResult.StudentId,
                weekResult.GroupId,
                weekResult.WeekNumber,
                weekResult.TotalScore
            });

        logger.LogInformation(
            "WeekResult recalculated: student {StudentId} group {GroupId} week {Week} = {Total} (lessons={L}, att={A}, exam={E}, bonus={B})",
            request.StudentId,
            request.GroupId,
            request.WeekNumber,
            weekResult.TotalScore,
            lessonScoresSum, attendedInWeek, weekResult.ExamScore, weekResult.BonusScore);

        var saved = await unitOfWork.WeekResults
            .GetByKeyAsync(request.StudentId, request.GroupId, request.WeekNumber);

        return Result<WeekResultResponse>.Ok(MapToResponse(saved!));
    }

    public async Task<Result<WeekResultResponse>> UpdateAsync(
        int studentId,
        int groupId,
        int weekNumber,
        UpdateWeekResultRequest request)
    {
        var weekResult = await unitOfWork.WeekResults
            .GetByKeyAsync(studentId, groupId, weekNumber);

        if (weekResult is null)
        {
            logger.LogWarning(
                "UpdateWeekResult failed - not found: student {StudentId} group {GroupId} week {Week}",
                studentId, groupId, weekNumber);
            return Result<WeekResultResponse>.Fail("WeekResult not found");
        }

        var oldValues = new
        {
            weekResult.BonusScore,
            weekResult.ExamScore,
            weekResult.MentorComment
        };

        if (request.BonusScore is not null)
            weekResult.BonusScore = request.BonusScore.Value;

        if (request.ExamScore is not null)
            weekResult.ExamScore = request.ExamScore.Value;

        if (request.MentorComment is not null)
            weekResult.MentorComment = request.MentorComment.Trim();

        weekResult.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.WeekResults.UpdateAsync(weekResult);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(
            null,
            AuditActions.RecalculateWeekResult,
            "WeekResult",
            weekResult.Id,
            oldValues,
            new
            {
                weekResult.BonusScore,
                weekResult.ExamScore,
                weekResult.MentorComment
            });

        logger.LogInformation(
            "WeekResult manual fields updated: student {StudentId} group {GroupId} week {Week}",
            studentId, groupId, weekNumber);


        return await RecalculateAsync(new RecalculateWeekRequest
        {
            StudentId = studentId,
            GroupId = groupId,
            WeekNumber = weekNumber
        });
    }

    public async Task<Result<WeekResultResponse>> SetMentorCommentAsync(
        int weekResultId,
        SetMentorCommentRequest request)
    {
        var weekResult = await unitOfWork.WeekResults.GetByIdAsync(weekResultId);

        if (weekResult is null)
            return Result<WeekResultResponse>.Fail("Week result not found");

        var oldComment = weekResult.MentorComment;

        weekResult.MentorComment = request.Comment?.Trim();
        weekResult.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.WeekResults.UpdateAsync(weekResult);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(WeekResultCachePrefix);

        await auditLogService.LogAsync(
            null,
            AuditActions.UpdateWeekResultComment,
            "WeekResult",
            weekResult.Id,
            new
            {
                MentorComment = oldComment
            },
            new
            {
                weekResult.MentorComment
            });

        logger.LogInformation(
            "WeekResult comment updated: {WeekResultId}",
            weekResultId);

        return Result<WeekResultResponse>.Ok(MapToResponse(weekResult));
    }

    private static WeekResultResponse MapToResponse(WeekResult w)
    {
        return new WeekResultResponse
        {
            Id = w.Id,
            StudentId = w.StudentId,
            StudentName = w.Student?.User.FullName ?? string.Empty,
            GroupId = w.GroupId,
            GroupName = w.Group?.Name ?? string.Empty,
            WeekNumber = w.WeekNumber,
            LessonAverageScore = w.LessonAverageScore,
            HomeworkAverageScore = w.HomeworkAverageScore,
            AttendanceScore = w.AttendanceScore,
            BonusScore = w.BonusScore,
            ExamScore = w.ExamScore,
            TotalScore = w.TotalScore,
            MentorComment = w.MentorComment,
            CreatedAt = w.CreatedAt,
            UpdatedAt = w.UpdatedAt
        };
    }
}