using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Mentor.Request;
using EduCrm.Application.DTOs.Mentor.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Constants;
using EduCrm.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class MentorService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<MentorService> logger,
    IAuditLogService auditLogService) : IMentorService
{
    private const string MentorCachePrefix = "mentors:";
    private const string MentorListCacheKey = "mentors:list";

    public async Task<Result<List<MentorListItemResponse>>> GetAllAsync()
    {
        var cached = await cache.GetAsync<List<MentorListItemResponse>>(MentorListCacheKey);
        if (cached is not null)
            return Result<List<MentorListItemResponse>>.Ok(cached);

        var mentors = await unitOfWork.Mentors.GetAllAsync();

        var result = mentors.Select(m => new MentorListItemResponse
        {
            Id = m.Id,
            UserId = m.UserId,
            FullName = m.User.FullName,
            Email = m.User.Email,
            Specialization = m.Specialization,
            ExperienceYears = m.ExperienceYears,
            IsActive = m.IsActive
        }).ToList();

        await cache.SetAsync(MentorListCacheKey, result, TimeSpan.FromMinutes(30));

        return Result<List<MentorListItemResponse>>.Ok(result);
    }

    public async Task<Result<MentorResponse>> GetByIdAsync(int id)
    {
        var cacheKey = $"{MentorCachePrefix}{id}";

        var cached = await cache.GetAsync<MentorResponse>(cacheKey);
        if (cached is not null)
            return Result<MentorResponse>.Ok(cached);

        var mentor = await unitOfWork.Mentors.GetByIdAsync(id);
        if (mentor is null)
        {
            logger.LogWarning("Mentor not found: {MentorId}", id);
            return Result<MentorResponse>.Fail("Mentor not found");
        }

        var response = MapToResponse(mentor);

        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));

        return Result<MentorResponse>.Ok(response);
    }

    public async Task<Result<MentorResponse>> UpdateAsync(int id, UpdateMentorRequest request)
    {
        var mentor = await unitOfWork.Mentors.GetByIdAsync(id);
        if (mentor is null)
        {
            logger.LogWarning("Update failed - mentor not found: {MentorId}", id);
            return Result<MentorResponse>.Fail("Mentor not found");
        }

        var oldValues = new
        {
            mentor.Specialization,
            mentor.ExperienceYears,
            mentor.HireDate
        };

        if (request.Specialization is not null)
            mentor.Specialization = request.Specialization.Trim();

        if (request.ExperienceYears is not null)
            mentor.ExperienceYears = request.ExperienceYears.Value;

        if (request.HireDate is not null)
            mentor.HireDate = request.HireDate.Value;

        await unitOfWork.Mentors.UpdateAsync(mentor);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(MentorCachePrefix);

        await auditLogService.LogAsync(
            null,
            AuditActions.UpdateMentor,
            nameof(Mentor),
            mentor.Id,
            oldValues,
            request
        );

        logger.LogInformation("Mentor updated: {MentorId}", id);

        return Result<MentorResponse>.Ok(MapToResponse(mentor));
    }

    public async Task<Result<bool>> SetStatusAsync(int id, SetMentorStatusRequest request)
    {
        var mentor = await unitOfWork.Mentors.GetByIdAsync(id);
        if (mentor is null)
        {
            logger.LogWarning("SetStatus failed - mentor not found: {MentorId}", id);
            return Result<bool>.Fail("Mentor not found");
        }

        var oldValues = new { mentor.IsActive };

        mentor.IsActive = request.IsActive;

        await unitOfWork.Mentors.UpdateAsync(mentor);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(MentorCachePrefix);

        await auditLogService.LogAsync(
            null,
            AuditActions.UpdateMentor,
            nameof(Mentor),
            mentor.Id,
            oldValues,
            new { request.IsActive }
        );

        logger.LogInformation(
            "Mentor status changed: {MentorId} IsActive: {IsActive}",
            id, request.IsActive);

        return Result<bool>.Ok(true);
    }

    private static MentorResponse MapToResponse(Mentor m)
    {
        return new MentorResponse
        {
            Id = m.Id,
            UserId = m.UserId,
            FullName = m.User.FullName,
            Email = m.User.Email,
            PhoneNumber = m.User.PhoneNumber,
            AvatarUrl = m.User.Profile?.AvatarUrl,
            Specialization = m.Specialization,
            ExperienceYears = m.ExperienceYears,
            HireDate = m.HireDate,
            IsActive = m.IsActive,
            GroupsCount = m.Groups?.Count ?? 0
        };
    }
}