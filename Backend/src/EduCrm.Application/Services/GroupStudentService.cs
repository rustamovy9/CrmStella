using EduCrm.Application.Common;
using EduCrm.Application.DTOs.GroupStudent.Request;
using EduCrm.Application.DTOs.GroupStudent.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Constants;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class GroupStudentService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<GroupStudentService> logger,
    IAuditLogService auditLogService) : IGroupStudentService
{
    private const string GroupStudentCachePrefix = "groupstudents:";

    public async Task<Result<List<GroupStudentResponse>>> GetByGroupAsync(int groupId)
    {
        var cacheKey = $"{GroupStudentCachePrefix}group:{groupId}";

        var cached = await cache.GetAsync<List<GroupStudentResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<GroupStudentResponse>>.Ok(cached);

        var items = await unitOfWork.GroupStudents.GetByGroupAsync(groupId);

        var result = items.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(15));

        return Result<List<GroupStudentResponse>>.Ok(result);
    }

    public async Task<Result<GroupStudentResponse>> EnrollAsync(EnrollStudentRequest request)
    {
        var student = await unitOfWork.Students.GetByIdAsync(request.StudentId);
        if (student is null)
        {
            logger.LogWarning("Enroll failed - student not found: {StudentId}", request.StudentId);
            return Result<GroupStudentResponse>.Fail("Student not found");
        }

        var group = await unitOfWork.Groups.GetByIdAsync(request.GroupId);
        if (group is null)
        {
            logger.LogWarning("Enroll failed - group not found: {GroupId}", request.GroupId);
            return Result<GroupStudentResponse>.Fail("Group not found");
        }

        var already = await unitOfWork.GroupStudents
            .IsActiveEnrollmentAsync(request.GroupId, request.StudentId);
        if (already)
            return Result<GroupStudentResponse>.Fail(
                "Student is already enrolled in this group", ErrorType.Conflict);

        var activeCount = await unitOfWork.GroupStudents
            .CountActiveInGroupAsync(request.GroupId);
        if (activeCount >= group.MaxStudents)
            return Result<GroupStudentResponse>.Fail("Group is full", ErrorType.BadRequest);

        var enrollment = new GroupStudent
        {
            GroupId = request.GroupId,
            StudentId = request.StudentId,
            JoinedAt = DateTime.UtcNow,
            IsActive = true
        };

        await unitOfWork.GroupStudents.CreateAsync(enrollment);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(GroupStudentCachePrefix);

        await auditLogService.LogAsync(
            userId: null,
            action: AuditActions.EnrollStudent,
            entityName: "GroupStudent",
            entityId: enrollment.Id,
            newValues: new
            {
                enrollment.GroupId,
                enrollment.StudentId,
                enrollment.IsActive,
                enrollment.JoinedAt
            });

        logger.LogInformation(
            "Student {StudentId} enrolled in group {GroupId}",
            request.StudentId, request.GroupId);

        var created = await unitOfWork.GroupStudents.GetByIdAsync(enrollment.Id);
        return Result<GroupStudentResponse>.Ok(MapToResponse(created!));
    }

    public async Task<Result<bool>> RemoveAsync(RemoveStudentRequest request)
    {
        var enrollment = await unitOfWork.GroupStudents.GetByIdAsync(request.GroupStudentId);
        if (enrollment is null)
        {
            logger.LogWarning("Remove failed - enrollment not found: {Id}", request.GroupStudentId);
            return Result<bool>.Fail("Enrollment not found");
        }

        if (!enrollment.IsActive)
            return Result<bool>.Fail("Student already removed from group", ErrorType.BadRequest);

        var oldValues = new
        {
            enrollment.IsActive,
            enrollment.LeftAt,
            enrollment.RemoveReason
        };

        enrollment.IsActive = false;
        enrollment.LeftAt = DateTime.UtcNow;
        enrollment.RemoveReason = request.RemoveReason;

        await unitOfWork.GroupStudents.UpdateAsync(enrollment);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(GroupStudentCachePrefix);

        await auditLogService.LogAsync(
            userId: null,
            action: AuditActions.RemoveStudentFromGroup,
            entityName: "GroupStudent",
            entityId: enrollment.Id,
            oldValues: oldValues,
            newValues: new
            {
                enrollment.IsActive,
                enrollment.LeftAt,
                enrollment.RemoveReason
            });

        logger.LogInformation(
            "Student {StudentId} removed from group {GroupId}. Reason: {Reason}",
            enrollment.StudentId, enrollment.GroupId, request.RemoveReason);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<GroupStudentResponse>> TransferAsync(TransferStudentRequest request)
    {
        var current = await unitOfWork.GroupStudents.GetByIdAsync(request.GroupStudentId);
        if (current is null)
            return Result<GroupStudentResponse>.Fail("Enrollment not found");

        if (!current.IsActive)
            return Result<GroupStudentResponse>.Fail(
                "Cannot transfer an inactive enrollment", ErrorType.BadRequest);

        var targetGroup = await unitOfWork.Groups.GetByIdAsync(request.TargetGroupId);
        if (targetGroup is null)
            return Result<GroupStudentResponse>.Fail("Target group not found");

        if (current.GroupId == request.TargetGroupId)
            return Result<GroupStudentResponse>.Fail(
                "Student is already in this group", ErrorType.BadRequest);

        var alreadyInTarget = await unitOfWork.GroupStudents
            .IsActiveEnrollmentAsync(request.TargetGroupId, current.StudentId);
        if (alreadyInTarget)
            return Result<GroupStudentResponse>.Fail(
                "Student is already enrolled in target group", ErrorType.Conflict);

        var activeCount = await unitOfWork.GroupStudents
            .CountActiveInGroupAsync(request.TargetGroupId);
        if (activeCount >= targetGroup.MaxStudents)
            return Result<GroupStudentResponse>.Fail("Target group is full", ErrorType.BadRequest);

        var oldGroupId = current.GroupId;

        var newEnrollment = new GroupStudent
        {
            GroupId = request.TargetGroupId,
            StudentId = current.StudentId,
            JoinedAt = DateTime.UtcNow,
            IsActive = true,
            TransferredFrom = current
        };

        current.IsActive = false;
        current.LeftAt = DateTime.UtcNow;
        current.RemoveReason = request.Reason ?? $"Transferred to group {request.TargetGroupId}";
        current.TransferredTo = newEnrollment;

        await unitOfWork.GroupStudents.CreateAsync(newEnrollment);
        await unitOfWork.GroupStudents.UpdateAsync(current);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(GroupStudentCachePrefix);

        await auditLogService.LogAsync(
            userId: null,
            action: AuditActions.TransferStudent,
            entityName: "GroupStudent",
            entityId: newEnrollment.Id,
            oldValues: new
            {
                FromGroupId = oldGroupId,
                current.StudentId
            },
            newValues: new
            {
                ToGroupId = request.TargetGroupId,
                current.StudentId
            });

        logger.LogInformation(
            "Student {StudentId} transferred from group {From} to group {To}",
            current.StudentId, oldGroupId, request.TargetGroupId);

        var created = await unitOfWork.GroupStudents.GetByIdAsync(newEnrollment.Id);
        return Result<GroupStudentResponse>.Ok(MapToResponse(created!));
    }

    private static GroupStudentResponse MapToResponse(GroupStudent gs)
    {
        return new GroupStudentResponse
        {
            Id = gs.Id,
            GroupId = gs.GroupId,
            GroupName = gs.Group.Name,
            StudentId = gs.StudentId,
            StudentName = gs.Student.User.FullName,
            StudentEmail = gs.Student.User.Email,
            JoinedAt = gs.JoinedAt,
            LeftAt = gs.LeftAt,
            IsActive = gs.IsActive,
            RemoveReason = gs.RemoveReason
        };
    }
}