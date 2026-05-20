using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Exam.Request;
using EduCrm.Application.DTOs.Exam.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Constants;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class ExamService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<ExamService> logger,
    IAuditLogService auditLogService) : IExamService
{
    private const string ExamCachePrefix = "exams:";
    private const string ExamListCacheKey = "exams:list";

    public async Task<Result<List<ExamListItemResponse>>> GetAllAsync()
    {
        var cached = await cache.GetAsync<List<ExamListItemResponse>>(ExamListCacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Exams list served from cache");
            return Result<List<ExamListItemResponse>>.Ok(cached);
        }

        var exams = await unitOfWork.Exams.GetAllAsync();

        var result = exams.Select(MapToListItem).ToList();

        await cache.SetAsync(ExamListCacheKey, result, TimeSpan.FromMinutes(15));

        return Result<List<ExamListItemResponse>>.Ok(result);
    }

    public async Task<Result<List<ExamListItemResponse>>> GetByGroupAsync(int groupId)
    {
        var cacheKey = $"{ExamCachePrefix}group:{groupId}";

        var cached = await cache.GetAsync<List<ExamListItemResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<ExamListItemResponse>>.Ok(cached);

        var exams = await unitOfWork.Exams.GetByGroupAsync(groupId);

        var result = exams.Select(MapToListItem).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(15));

        return Result<List<ExamListItemResponse>>.Ok(result);
    }

    public async Task<Result<ExamResponse>> GetByIdAsync(int id)
    {
        var cacheKey = $"{ExamCachePrefix}{id}";

        var cached = await cache.GetAsync<ExamResponse>(cacheKey);
        if (cached is not null)
            return Result<ExamResponse>.Ok(cached);

        var exam = await unitOfWork.Exams.GetByIdAsync(id);
        if (exam is null)
        {
            logger.LogWarning("Exam not found: {ExamId}", id);
            return Result<ExamResponse>.Fail("Exam not found", ErrorType.NotFound);
        }

        var response = MapToResponse(exam);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(15));

        return Result<ExamResponse>.Ok(response);
    }

  
    public async Task<Result<ExamResponse>> CreateAsync(CreateExamRequest request)
    {
        var group = await unitOfWork.Groups.GetByIdAsync(request.GroupId);
        if (group is null)
        {
            logger.LogWarning("Create failed - group not found: {GroupId}", request.GroupId);
            return Result<ExamResponse>.Fail("Group not found", ErrorType.BadRequest);
        }

        if (request.PassScore > request.MaxScore)
            return Result<ExamResponse>.Fail(
                "PassScore cannot be greater than MaxScore", ErrorType.BadRequest);

        if (request.ExamDate <= DateTime.UtcNow)
            return Result<ExamResponse>.Fail(
                "ExamDate must be in the future", ErrorType.BadRequest);

        var exam = new Domain.Entities.Exam
        {
            GroupId = request.GroupId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            ExamDate = request.ExamDate,
            MaxScore = request.MaxScore,
            PassScore = request.PassScore,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await unitOfWork.Exams.CreateAsync(exam);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(ExamCachePrefix);

        await auditLogService.LogAsync(
            userId: null,
            action: AuditActions.CreateExam,
            entityName: "Exam",
            entityId: exam.Id,
            newValues: new
            {
                exam.GroupId,
                exam.Title,
                exam.ExamDate,
                exam.MaxScore,
                exam.PassScore,
                exam.IsActive
            });

        logger.LogInformation(
            "Exam created: {ExamId} for group {GroupId}", exam.Id, exam.GroupId);

        var created = await unitOfWork.Exams.GetByIdAsync(exam.Id);
        return Result<ExamResponse>.Ok(MapToResponse(created!));
    }

    
    public async Task<Result<ExamResponse>> UpdateAsync(int id, UpdateExamRequest request)
    {
        var exam = await unitOfWork.Exams.GetByIdAsync(id);
        if (exam is null)
        {
            logger.LogWarning("Update failed - exam not found: {ExamId}", id);
            return Result<ExamResponse>.Fail("Exam not found", ErrorType.NotFound);
        }

        var oldValues = new
        {
            exam.Title,
            exam.Description,
            exam.ExamDate,
            exam.MaxScore,
            exam.PassScore
        };

        if (request.Title is not null)
            exam.Title = request.Title.Trim();

        if (request.Description is not null)
            exam.Description = request.Description.Trim();

        if (request.ExamDate is not null)
        {
            if (request.ExamDate <= DateTime.UtcNow)
                return Result<ExamResponse>.Fail(
                    "ExamDate must be in the future", ErrorType.BadRequest);

            exam.ExamDate = request.ExamDate.Value;
        }

        if (request.MaxScore is not null)
            exam.MaxScore = request.MaxScore.Value;

        if (request.PassScore is not null)
            exam.PassScore = request.PassScore.Value;

        if (exam.PassScore > exam.MaxScore)
            return Result<ExamResponse>.Fail(
                "PassScore cannot be greater than MaxScore", ErrorType.BadRequest);

        await unitOfWork.Exams.UpdateAsync(exam);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(ExamCachePrefix);

        await auditLogService.LogAsync(
            userId: null,
            action: AuditActions.UpdateExam,
            entityName: "Exam",
            entityId: exam.Id,
            oldValues: oldValues,
            newValues: new
            {
                exam.Title,
                exam.Description,
                exam.ExamDate,
                exam.MaxScore,
                exam.PassScore
            });

        logger.LogInformation("Exam updated: {ExamId}", id);

        return Result<ExamResponse>.Ok(MapToResponse(exam));
    }

    
    public async Task<Result<bool>> SetStatusAsync(int id, SetExamStatusRequest request)
    {
        var exam = await unitOfWork.Exams.GetByIdAsync(id);
        if (exam is null)
        {
            logger.LogWarning("SetStatus failed - exam not found: {ExamId}", id);
            return Result<bool>.Fail("Exam not found", ErrorType.NotFound);
        }

        var oldStatus = exam.IsActive;

        exam.IsActive = request.IsActive;

        await unitOfWork.Exams.UpdateAsync(exam);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(ExamCachePrefix);

        await auditLogService.LogAsync(
            userId: null,
            action: AuditActions.SetExamStatus,
            entityName: "Exam",
            entityId: exam.Id,
            oldValues: new { IsActive = oldStatus },
            newValues: new { exam.IsActive });

        logger.LogInformation(
            "Exam status changed: {ExamId} IsActive: {IsActive}", id, request.IsActive);

        return Result<bool>.Ok(true);
    }
    
    
    private static ExamResponse MapToResponse(Domain.Entities.Exam e) => new()
    {
        Id = e.Id,
        GroupId = e.GroupId,
        GroupName = e.Group?.Name ?? string.Empty,
        Title = e.Title,
        Description = e.Description,
        ExamDate = e.ExamDate,
        MaxScore = e.MaxScore,
        PassScore = e.PassScore,
        IsActive = e.IsActive,
        IsFinished = e.ExamDate < DateTime.UtcNow,
        CreatedAt = e.CreatedAt
    };

    private static ExamListItemResponse MapToListItem(Domain.Entities.Exam e) => new()
    {
        Id = e.Id,
        GroupId = e.GroupId,
        GroupName = e.Group?.Name ?? string.Empty,
        Title = e.Title,
        ExamDate = e.ExamDate,
        PassScore = e.PassScore,
        IsActive = e.IsActive,
        IsFinished = e.ExamDate < DateTime.UtcNow
    };
}