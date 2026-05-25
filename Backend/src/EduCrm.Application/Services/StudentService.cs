using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Student.Request;
using EduCrm.Application.DTOs.Student.Response;
using EduCrm.Application.DTOs.Students.Request;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Constants;
using EduCrm.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class StudentService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IAuditLogService auditLogService,
    ILogger<StudentService> logger) : IStudentService
{
    private const string StudentCachePrefix = "students:";
    private const string StudentListCacheKey = "students:list";

    public async Task<Result<PagedResult<StudentListItemResponse>>> GetAllAsync(
        StudentQueryRequest query,
        CancellationToken cancellationToken = default)
    {
        var cacheKey =
            $"{StudentCachePrefix}list:{query.Page}:{query.PageSize}:{query.Search}:{query.IsActive}:{query.GroupId}";

        var cached = await cache.GetAsync<PagedResult<StudentListItemResponse>>(cacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Students list served from cache");
            return Result<PagedResult<StudentListItemResponse>>.Ok(cached);
        }

        var pagedStudents = await unitOfWork.Students.GetAllAsync(query, cancellationToken);

        var result = new PagedResult<StudentListItemResponse>
        {
            Items = pagedStudents.Items.Select(s => new StudentListItemResponse
            {
                Id = s.Id,
                UserId = s.UserId,
                FullName = s.User.FullName,
                Email = s.User.Email,
                Balance = s.Balance,
                IsActive = s.IsActive,
                AvatarUrl = s.User.Profile?.AvatarUrl,  
                EnrolledAt = s.EnrolledAt
            }).ToList(),
            TotalCount = pagedStudents.TotalCount,
            Page = pagedStudents.Page,
            PageSize = pagedStudents.PageSize
        };

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(10));

        return Result<PagedResult<StudentListItemResponse>>.Ok(result);
    }

    public async Task<Result<StudentResponse>> GetByIdAsync(int id)
    {
        var cacheKey = $"{StudentCachePrefix}{id}";

        var cached = await cache.GetAsync<StudentResponse>(cacheKey);
        if (cached is not null)
            return Result<StudentResponse>.Ok(cached);

        var student = await unitOfWork.Students.GetByIdAsync(id);
        if (student is null)
        {
            logger.LogWarning("Student not found: {StudentId}", id);
            return Result<StudentResponse>.Fail("Student not found");
        }

        var response = MapToResponse(student);

        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));

        return Result<StudentResponse>.Ok(response);
    }

    public async Task<Result<StudentResponse>> UpdateAsync(int id, UpdateStudentRequest request)
    {
        var student = await unitOfWork.Students.GetByIdAsync(id);
        if (student is null)
        {
            logger.LogWarning("Update failed - student not found: {StudentId}", id);
            return Result<StudentResponse>.Fail("Student not found");
        }

        var oldValues = new
        {
            student.Balance,
            student.EnrolledAt,
            student.IsActive
        };

        if (request.Balance is not null)
            student.Balance = request.Balance.Value;

        if (request.EnrolledAt is not null)
            student.EnrolledAt = request.EnrolledAt.Value;

        await unitOfWork.Students.UpdateAsync(student);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(
            null,
            AuditActions.UpdateStudent,
            nameof(Student),
            student.Id,
            oldValues,
            request
        );

        await cache.RemoveByPrefixAsync(StudentCachePrefix);

        logger.LogInformation("Student updated: {StudentId}", id);

        return Result<StudentResponse>.Ok(MapToResponse(student));
    }

    public async Task<Result<bool>> SetStatusAsync(int id, SetStudentStatusRequest request)
    {
        var student = await unitOfWork.Students.GetByIdAsync(id);
        if (student is null)
        {
            logger.LogWarning("SetStatus failed - student not found: {StudentId}", id);
            return Result<bool>.Fail("Student not found");
        }

        var oldValues = new { student.IsActive };

        student.IsActive = request.IsActive;

        await unitOfWork.Students.UpdateAsync(student);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(
            null,
            request.IsActive ? AuditActions.ActivateUser : AuditActions.DeactivateUser,
            nameof(Student),
            student.Id,
            oldValues,
            new { request.IsActive }
        );

        await cache.RemoveByPrefixAsync(StudentCachePrefix);

        logger.LogInformation(
            "Student status changed: {StudentId} IsActive: {IsActive}",
            id, request.IsActive);

        return Result<bool>.Ok(true);
    }

    private static StudentResponse MapToResponse(Student s)
    {
        return new StudentResponse
        {
            Id = s.Id,
            UserId = s.UserId,
            FullName = s.User.FullName,
            Email = s.User.Email,
            PhoneNumber = s.User.PhoneNumber,
            AvatarUrl = s.User.Profile?.AvatarUrl,
            ImageUrl = s.User.Profile?.AvatarUrl,
            Balance = s.Balance,
            IsActive = s.IsActive,
            EnrolledAt = s.EnrolledAt,
            GroupsCount = s.GroupStudents?.Count ?? 0
        };
    }
}