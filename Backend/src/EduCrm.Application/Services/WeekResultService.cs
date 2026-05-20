using EduCrm.Application.Common;
using EduCrm.Application.DTOs.WeekResult.Request;
using EduCrm.Application.DTOs.WeekResult.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class WeekResultService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
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
                "Week result not found. Recalculate first.", ErrorType.NotFound);

        return Result<WeekResultResponse>.Ok(MapToResponse(weekResult));
    }

    public async Task<Result<WeekResultResponse>> RecalculateAsync(RecalculateWeekRequest request)
    {
        // 1. студент существует?
        var student = await unitOfWork.Students.GetByIdAsync(request.StudentId);
        if (student is null)
            return Result<WeekResultResponse>.Fail("Student not found", ErrorType.NotFound);

        // 2. группа существует?
        var group = await unitOfWork.Groups.GetByIdAsync(request.GroupId);
        if (group is null)
            return Result<WeekResultResponse>.Fail("Group not found", ErrorType.NotFound);

        // 3. студент реально в этой группе?
        // (защита от пересчёта «не его» недели)
        var enrollment = student.GroupStudents?
            .FirstOrDefault(gs => gs.GroupId == request.GroupId && gs.IsActive);
        if (enrollment is null)
            return Result<WeekResultResponse>.Fail(
                "Student is not enrolled in this group", ErrorType.BadRequest);

        // 4. берём существующую запись недели или создаём новую (upsert)
        var weekResult = await unitOfWork.WeekResults
            .GetByKeyAsync(request.StudentId, request.GroupId, request.WeekNumber);

        var isNew = weekResult is null;
        var existingComment = weekResult?.MentorComment;   // сохраним комментарий при пересчёте

        weekResult ??= new Domain.Entities.WeekResult
        {
            StudentId = request.StudentId,
            GroupId = request.GroupId,
            WeekNumber = request.WeekNumber,
            CreatedAt = DateTime.UtcNow
        };

        // 5. ВЫЧИСЛЯЕМ агрегаты ЗА КОНКРЕТНУЮ НЕДЕЛЮ
        // ВАЖНО: эти формулы — КАРКАС. Они опираются на Attendance/LessonScore/ExamResult
        // (модули Жвохира). Когда они будут готовы, имена полей могут отличаться —
        // подгонишь под реальные сущности. Принцип одинаковый.

        // оценки за уроки этой недели
        var lessonScores = student.LessonScores?
            .Where(ls => ls.Lesson.GroupId == request.GroupId
                      && ls.Lesson.WeekNumber == request.WeekNumber)
            .Select(ls => ls.Score)
            .ToList() ?? new();
        weekResult.LessonAverageScore = lessonScores.Count == 0
            ? 0
            : Math.Round(lessonScores.Average(), 2);

        // оценки за домашки этой недели (если LessonScore покрывает и домашки —
        // надо разделить по флагу, или брать из HomeworkSubmission через LessonScore)
        // оставляю заглушкой — Жвохир уточнит схему
        weekResult.HomeworkAverageScore = 0;

        // посещаемость этой недели в процентах
        var weekAttendances = student.Attendances?
            .Where(a => a.Lesson.GroupId == request.GroupId
                     && a.Lesson.WeekNumber == request.WeekNumber)
            .ToList() ?? new();
        var totalLessonsInWeek = weekAttendances.Count;
        var attendedInWeek = weekAttendances.Count(a => a.Status == AttendanceStatus.Present);
        weekResult.AttendanceScore = totalLessonsInWeek == 0
            ? 0
            : Math.Round((decimal)attendedInWeek / totalLessonsInWeek * 100, 2);

        // экзамен на этой неделе (если был)
        var examScores = student.ExamResults?
            .Where(er => er.Exam.GroupId == request.GroupId
                      /* && er.Exam.WeekNumber == request.WeekNumber */)
            .Select(er => er.Score)
            .ToList() ?? new();
        weekResult.ExamScore = examScores.Count == 0
            ? 0
            : Math.Round(examScores.Average(), 2);

        // бонусы — пока 0, добавишь когда появится механика бонусов
        weekResult.BonusScore = 0;

        // итоговый балл — взвешенная сумма (формулу согласуйте командой)
        weekResult.TotalScore = Math.Round(
            (weekResult.LessonAverageScore * 0.3m) +
            (weekResult.HomeworkAverageScore * 0.2m) +
            (weekResult.AttendanceScore * 0.2m) +
            (weekResult.ExamScore * 0.25m) +
            (weekResult.BonusScore * 0.05m), 2);

        // комментарий ментора сохраняем — пересчёт баллов не должен его стирать
        weekResult.MentorComment = existingComment;

        weekResult.UpdatedAt = DateTime.UtcNow;

        // 6. сохраняем
        if (isNew)
            await unitOfWork.WeekResults.CreateAsync(weekResult);
        else
            await unitOfWork.WeekResults.UpdateAsync(weekResult);

        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(WeekResultCachePrefix);

        logger.LogInformation(
            "WeekResult recalculated: student {StudentId} group {GroupId} week {Week} = {Total}",
            request.StudentId, request.GroupId, request.WeekNumber, weekResult.TotalScore);

        var saved = await unitOfWork.WeekResults
            .GetByKeyAsync(request.StudentId, request.GroupId, request.WeekNumber);
        return Result<WeekResultResponse>.Ok(MapToResponse(saved!));
    }

    public async Task<Result<WeekResultResponse>> SetMentorCommentAsync(
        int weekResultId, SetMentorCommentRequest request)
    {
        var weekResult = await unitOfWork.WeekResults.GetByIdAsync(weekResultId);
        if (weekResult is null)
            return Result<WeekResultResponse>.Fail("Week result not found", ErrorType.NotFound);

        weekResult.MentorComment = request.Comment?.Trim();
        weekResult.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.WeekResults.UpdateAsync(weekResult);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(WeekResultCachePrefix);

        logger.LogInformation(
            "WeekResult comment set: {WeekResultId}", weekResultId);

        return Result<WeekResultResponse>.Ok(MapToResponse(weekResult));
    }

    private static WeekResultResponse MapToResponse(Domain.Entities.WeekResult w) => new()
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