using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Group.Response;
using CrmStella.Application.DTOs.Mentor.Request;
using CrmStella.Application.DTOs.Mentor.Response;
using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Application.Interfaces.Services;
using CrmStella.Domain.Constants;
using CrmStella.Domain.Entities;
using CrmStella.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CrmStella.Application.Services;

public class MentorService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<MentorService> logger,
    IAuditLogService auditLogService) : IMentorService
{
    private const string MentorCachePrefix = "mentors:";
    private const string MentorListCacheKey = "mentors:list";

    // MentorService.cs
    public async Task<Result<PagedResult<MentorListItemResponse>>> GetAllAsync(
        MentorQueryRequest query,
        CancellationToken cancellationToken = default)
    {
        var cacheKey =
            $"{MentorCachePrefix}list:{query.Page}:{query.PageSize}:{query.Search}:{query.IsActive}:{query.Specialization}";

        var cached = await cache.GetAsync<PagedResult<MentorListItemResponse>>(cacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Mentors list served from cache");
            return Result<PagedResult<MentorListItemResponse>>.Ok(cached);
        }

        var pagedMentors = await unitOfWork.Mentors.GetAllAsync(query, cancellationToken);

        var result = new PagedResult<MentorListItemResponse>
        {
            Items = pagedMentors.Items.Select(m => new MentorListItemResponse
            {
                Id = m.Id,
                UserId = m.UserId,
                FullName = m.User.FullName,
                Email = m.User.Email,
                Specialization = m.Specialization,
                ExperienceYears = m.ExperienceYears,
                IsActive = m.IsActive,
                AvatarUrl = m.User.Profile?.AvatarUrl
            }).ToList(),
            TotalCount = pagedMentors.TotalCount,
            Page = pagedMentors.Page,
            PageSize = pagedMentors.PageSize
        };

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(10));

        return Result<PagedResult<MentorListItemResponse>>.Ok(result);
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
        await cache.RemoveByPrefixAsync("users:");

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

    public async Task<Result<MentorDashboardResponse>> GetDashboardAsync(int id)
    {
        var mentor = await unitOfWork.Mentors.GetByUserIdAsync(id);

        if (mentor is null)
        {
            return Result<MentorDashboardResponse>.Fail("Mentor not found");
        }

        var groups = await unitOfWork.Groups.GetByMentorAsync(mentor.Id);

        var activeGroups =
        groups.Count(g =>
            g.Status == GroupStatus.Active);

        var totalStudents =
            groups
                .SelectMany(g =>
                    g.GroupStudents
                        .Where(gs => gs.IsActive))
                .Select(gs => gs.StudentId)
                .Distinct()
                .Count();

        var today = DateTime.UtcNow.Date;

        var lessonsToday = groups.Sum(g => g.Lessons?.Count(l => l.LessonDate.Date == today.Date) ?? 0);


        foreach (var group in groups)
        {
            foreach (var lesson in group.Lessons ?? [])
            {
                logger.LogInformation(
                    "Lesson: {Date}",
                    lesson.LessonDate);
            }
        }

        logger.LogInformation(
            "Today: {Today}",
            today);

        var response =
            new MentorDashboardResponse
            {
                ActiveGroups = activeGroups,
                TotalStudents = totalStudents,
                LessonsToday = lessonsToday,
                Groups = groups
                    .Select(g =>
                {
                    var activeCount =
                        g.GroupStudents?
                            .Count(x =>
                                x.IsActive)
                        ?? 0;

                    return new GroupListItemResponse
                    {
                        Id = g.Id,
                        Name = g.Name,
                        CourseId = g.CourseId,
                        CourseName = g.Course.Name,
                        MentorUserId = g.Mentor.UserId,
                        MentorId = g.MentorId,
                        MentorName =
                            g.Mentor.User.FullName,
                        StartDate = g.StartDate,
                        EndDate = g.EndDate,
                        MaxStudents = g.MaxStudents,
                        ActiveStudentsCount =
                            activeCount,
                        FreeSlots =
                            g.MaxStudents -
                            activeCount,
                        Status =
                            g.Status.ToString(),
                        CreatedAt =
                            g.CreatedAt
                    };
                })
                .ToList()
            };

        return Result<MentorDashboardResponse>.Ok(response);
    }
}