using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Group.Response;
using CrmStella.Application.DTOs.GroupStudent.Request;
using CrmStella.Application.DTOs.GroupStudent.Response;
using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Application.Interfaces.Services;
using CrmStella.Domain.Constants;
using CrmStella.Domain.Entities;
using CrmStella.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CrmStella.Application.Services;

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

        // ✅ Инвалидируем все связанные кэши
        await cache.RemoveByPrefixAsync(GroupStudentCachePrefix);
        await cache.RemoveByPrefixAsync("groups:");
        await cache.RemoveByPrefixAsync("students:");
        await cache.RemoveByPrefixAsync("courses:");

        await auditLogService.LogAsync(
            null,
            AuditActions.EnrollStudent,
            "GroupStudent",
            enrollment.Id,
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

        // ✅ Инвалидируем все связанные кэши
        await cache.RemoveByPrefixAsync(GroupStudentCachePrefix);
        await cache.RemoveByPrefixAsync("groups:");
        await cache.RemoveByPrefixAsync("students:");
        await cache.RemoveByPrefixAsync("courses:");

        await auditLogService.LogAsync(
            null,
            AuditActions.RemoveStudentFromGroup,
            "GroupStudent",
            enrollment.Id,
            oldValues,
            new
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

        // ✅ Инвалидируем все связанные кэши
        await cache.RemoveByPrefixAsync(GroupStudentCachePrefix);
        await cache.RemoveByPrefixAsync("groups:");
        await cache.RemoveByPrefixAsync("students:");
        await cache.RemoveByPrefixAsync("courses:");

        await auditLogService.LogAsync(
            null,
            AuditActions.TransferStudent,
            "GroupStudent",
            newEnrollment.Id,
            new
            {
                FromGroupId = oldGroupId,
                current.StudentId
            },
            new
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
            IsTransferred = gs.TransferredTo is not null,
            RemoveReason = gs.RemoveReason,
            LastBilledAt = gs.LastBilledAt,
            NextBillingDate = gs.NextBillingDate
        };
    }

    public async Task<Result<List<GroupListItemResponse>>> GetMyGroupsAsync(int userId)
    {
        var student = await unitOfWork.Students.GetByUserIdAsync(userId);

        if (student is null)
        {
            return Result<List<GroupListItemResponse>>.Fail("Student not found");
        }

        var enrollments = await unitOfWork.GroupStudents.GetByStudentAsync(student.Id);

        var result = enrollments.Select(gs =>
        {
            var g = gs.Group;

            var activeCount =
                g.GroupStudents?.Count(x => x.IsActive) ?? 0;

            return new GroupListItemResponse
            {
                Id = g.Id,
                Name = g.Name,
                CourseId = g.CourseId,
                CourseName = g.Course.Name,
                MentorUserId = g.Mentor.UserId,
                MentorId = g.Mentor.Id,
                MentorName = g.Mentor.User.FullName,
                StartDate = g.StartDate,
                EndDate = g.EndDate,
                MaxStudents = g.MaxStudents,
                ActiveStudentsCount = activeCount,
                FreeSlots = g.MaxStudents - activeCount,
                Status = g.Status.ToString(),
                CreatedAt = g.CreatedAt,
            };
        }).ToList();

        return Result<List<GroupListItemResponse>>.Ok(result);
    }

    public async Task<Result<GroupResponse>> GetMyGroupAsync(int userId, int groupId)
    {
        var student = await unitOfWork.Students.GetByUserIdAsync(userId);

        if (student == null)
        {
            return Result<GroupResponse>.Fail("Student not found");
        }

        var enrollment = await unitOfWork.GroupStudents.GetByGroupAndStudentAsync(groupId, student.Id);

        if (enrollment is null || !enrollment.IsActive)
        {
            return Result<GroupResponse>.Fail("Access denied", ErrorType.Forbidden);
        }

        var group = await unitOfWork.Groups.GetByIdAsync(groupId);

        if (group is null)
        {
            return Result<GroupResponse>.Fail("Group not found");
        }

        return Result<GroupResponse>.Ok(
            new GroupResponse
            {
                Id = group.Id,
                Name = group.Name,
                CourseId = group.CourseId,
                CourseName = group.Course.Name,
                MentorId = group.MentorId,
                MentorUserId = group.Mentor.UserId,
                MentorName = group.Mentor.User.FullName,
                StartDate = group.StartDate,
                EndDate = group.EndDate,
                MaxStudents = group.MaxStudents,
                ActiveStudentsCount =
                group.GroupStudents.Count(x => x.IsActive),
                Status = group.Status.ToString(),
                CreatedAt = group.CreatedAt
            });
    }
}