using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Group.Request;
using EduCrm.Application.DTOs.Group.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class GroupService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<GroupService> logger) : IGroupService
{
    private const string GroupCachePrefix = "groups:";
    private const string GroupListCacheKey = "groups:list";

    public async Task<Result<List<GroupListItemResponse>>> GetAllAsync()
    {
        var cached = await cache.GetAsync<List<GroupListItemResponse>>(GroupListCacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Groups list served from cache");
            return Result<List<GroupListItemResponse>>.Ok(cached);
        }

        var groups = await unitOfWork.Groups.GetAllAsync();

        var result = groups.Select(g =>
        {
            var activeCount = g.GroupStudents?.Count(gs => gs.IsActive) ?? 0;
            return new GroupListItemResponse
            {
                Id = g.Id,
                Name = g.Name,
                CourseId = g.CourseId,
                CourseName = g.Course.Name,
                MentorId = g.MentorId,
                MentorName = g.Mentor.User.FullName,
                StartDate = g.StartDate,
                EndDate = g.EndDate,
                MaxStudents = g.MaxStudents,
                ActiveStudentsCount = activeCount,
                FreeSlots = g.MaxStudents - activeCount,
                Status = g.Status.ToString(),
                CreatedAt = g.CreatedAt
            };
        }).ToList();

        await cache.SetAsync(GroupListCacheKey, result, TimeSpan.FromMinutes(30));

        return Result<List<GroupListItemResponse>>.Ok(result);
    }

    public async Task<Result<GroupResponse>> GetByIdAsync(int id)
    {
        var cacheKey = $"{GroupCachePrefix}{id}";

        var cached = await cache.GetAsync<GroupResponse>(cacheKey);
        if (cached is not null)
            return Result<GroupResponse>.Ok(cached);

        var group = await unitOfWork.Groups.GetByIdAsync(id);
        if (group is null)
        {
            logger.LogWarning("Group not found: {GroupId}", id);
            return Result<GroupResponse>.Fail("Group not found");
        }

        var response = MapToResponse(group);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));

        return Result<GroupResponse>.Ok(response);
    }

    public async Task<Result<GroupResponse>> CreateAsync(CreateGroupRequest request)
    {
        if (await unitOfWork.Groups.ExistsByNameAsync(request.Name))
        {
            logger.LogWarning("Create failed - group name exists: {Name}", request.Name);
            return Result<GroupResponse>.Fail("Group with this name already exists", ErrorType.Conflict);
        }

        // курс существует?
        var course = await unitOfWork.Courses.GetByIdAsync(request.CourseId);
        if (course is null)
            return Result<GroupResponse>.Fail("Course not found", ErrorType.BadRequest);

        // ментор существует?
        var mentor = await unitOfWork.Mentors.GetByIdAsync(request.MentorId);
        if (mentor is null)
            return Result<GroupResponse>.Fail("Mentor not found", ErrorType.BadRequest);

        // даты логичны?
        if (request.EndDate is not null && request.EndDate <= request.StartDate)
            return Result<GroupResponse>.Fail(
                "EndDate must be after StartDate", ErrorType.BadRequest);

        var group = new Group
        {
            Name = request.Name.Trim(),
            CourseId = request.CourseId,
            MentorId = request.MentorId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            MaxStudents = request.MaxStudents,
            Status = GroupStatus.Active,
            CreatedAt = DateTime.UtcNow // <-- ВОТ ФИКС: явно ставим UTC-время создания
        };

        await unitOfWork.Groups.CreateAsync(group);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(GroupCachePrefix);

        logger.LogInformation("Group created: {GroupId} {Name}", group.Id, group.Name);

        var created = await unitOfWork.Groups.GetByIdAsync(group.Id);
        return Result<GroupResponse>.Ok(MapToResponse(created!));
    }

    public async Task<Result<GroupResponse>> UpdateAsync(int id, UpdateGroupRequest request)
    {
        var group = await unitOfWork.Groups.GetByIdAsync(id);
        if (group is null)
        {
            logger.LogWarning("Update failed - group not found: {GroupId}", id);
            return Result<GroupResponse>.Fail("Group not found");
        }

        if (request.MentorId is not null)
        {
            var mentor = await unitOfWork.Mentors.GetByIdAsync(request.MentorId.Value);
            if (mentor is null)
                return Result<GroupResponse>.Fail("Mentor not found", ErrorType.BadRequest);
            group.MentorId = request.MentorId.Value;
        }

        if (request.Name is not null)
            group.Name = request.Name.Trim();

        if (request.StartDate is not null)
            group.StartDate = request.StartDate.Value;

        if (request.EndDate is not null)
            group.EndDate = request.EndDate;

        if (request.MaxStudents is not null)
            group.MaxStudents = request.MaxStudents.Value;

        // финальная проверка дат после применения изменений
        if (group.EndDate is not null && group.EndDate <= group.StartDate)
            return Result<GroupResponse>.Fail(
                "EndDate must be after StartDate", ErrorType.BadRequest);

        await unitOfWork.Groups.UpdateAsync(group);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(GroupCachePrefix);

        logger.LogInformation("Group updated: {GroupId}", id);

        return Result<GroupResponse>.Ok(MapToResponse(group));
    }

    public async Task<Result<bool>> SetStatusAsync(int id, SetGroupStatusRequest request)
    {
        var group = await unitOfWork.Groups.GetByIdAsync(id);
        if (group is null)
        {
            logger.LogWarning("SetStatus failed - group not found: {GroupId}", id);
            return Result<bool>.Fail("Group not found");
        }

        group.Status = (GroupStatus)request.Status;

        await unitOfWork.Groups.UpdateAsync(group);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(GroupCachePrefix);

        logger.LogInformation(
            "Group status changed: {GroupId} Status: {Status}", id, group.Status);

        return Result<bool>.Ok(true);
    }

    private static GroupResponse MapToResponse(Group g)
    {
        return new GroupResponse
        {
            Id = g.Id,
            Name = g.Name,
            CourseId = g.CourseId,
            CourseName = g.Course.Name,
            MentorId = g.MentorId,
            MentorName = g.Mentor.User.FullName,
            StartDate = g.StartDate,
            EndDate = g.EndDate,
            MaxStudents = g.MaxStudents,
            ActiveStudentsCount = g.GroupStudents?.Count(gs => gs.IsActive) ?? 0,
            Status = g.Status.ToString()
        };
    }
}