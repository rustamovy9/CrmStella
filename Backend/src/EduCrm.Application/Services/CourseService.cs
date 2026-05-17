using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Course.Request;
using EduCrm.Application.DTOs.Course.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class CourseService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<CourseService> logger) : ICourseService
{
    private const string CourseCachePrefix = "courses:";
    private const string CourseListCacheKey = "courses:list";

    public async Task<Result<List<CourseListItemResponse>>> GetAllAsync()
    {
        var cached = await cache.GetAsync<List<CourseListItemResponse>>(CourseListCacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Courses list served from cache");
            return Result<List<CourseListItemResponse>>.Ok(cached);
        }

        var courses = await unitOfWork.Courses.GetAllAsync();

        var result = courses.Select(c => new CourseListItemResponse
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            Price = c.Price,
            IconUrl = c.IconUrl,
            DurationWeeks = c.DurationWeeks,
            IsActive = c.IsActive,
            GroupsCount = c.Groups?.Count ?? 0,
            ActiveGroupsCount = c.Groups?.Count(g => g.Status == GroupStatus.Active) ?? 0,
            TotalStudentsCount = c.Groups?
                .SelectMany(g => g.GroupStudents)
                .Count(gs => gs.IsActive) ?? 0,
            CreatedAt = c.CreatedAt
        }).ToList();

        await cache.SetAsync(CourseListCacheKey, result, TimeSpan.FromMinutes(30));

        return Result<List<CourseListItemResponse>>.Ok(result);
    }

    public async Task<Result<CourseResponse>> GetByIdAsync(int id)
    {
        var cacheKey = $"{CourseCachePrefix}{id}";

        var cached = await cache.GetAsync<CourseResponse>(cacheKey);
        if (cached is not null)
            return Result<CourseResponse>.Ok(cached);

        var course = await unitOfWork.Courses.GetByIdAsync(id);
        if (course is null)
        {
            logger.LogWarning("Course not found: {CourseId}", id);
            return Result<CourseResponse>.Fail("Course not found", ErrorType.NotFound);
        }

        var response = MapToResponse(course);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));

        return Result<CourseResponse>.Ok(response);
    }

    public async Task<Result<CourseResponse>> CreateAsync(CreateCourseRequest request)
    {
        if (await unitOfWork.Courses.ExistsByNameAsync(request.Name))
        {
            logger.LogWarning("Create failed - course name exists: {Name}", request.Name);
            return Result<CourseResponse>.Fail(
                "Course with this name already exists", ErrorType.Conflict);
        }

        var course = new Domain.Entities.Course
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Price = request.Price,
            DurationWeeks = request.DurationWeeks,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await unitOfWork.Courses.CreateAsync(course);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(CourseCachePrefix);

        logger.LogInformation("Course created: {CourseId} {Name}", course.Id, course.Name);

        return Result<CourseResponse>.Ok(MapToResponse(course));
    }

    public async Task<Result<CourseResponse>> UpdateAsync(int id, UpdateCourseRequest request)
    {
        var course = await unitOfWork.Courses.GetByIdAsync(id);
        if (course is null)
        {
            logger.LogWarning("Update failed - course not found: {CourseId}", id);
            return Result<CourseResponse>.Fail("Course not found", ErrorType.NotFound);
        }

        if (request.Name is not null)
            course.Name = request.Name.Trim();

        if (request.Description is not null)
            course.Description = request.Description.Trim();

        if (request.Price is not null)
            course.Price = request.Price.Value;

        if (request.DurationWeeks is not null)
            course.DurationWeeks = request.DurationWeeks.Value;

        await unitOfWork.Courses.UpdateAsync(course);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(CourseCachePrefix);

        logger.LogInformation("Course updated: {CourseId}", id);

        return Result<CourseResponse>.Ok(MapToResponse(course));
    }

    public async Task<Result<bool>> SetStatusAsync(int id, SetCourseStatusRequest request)
    {
        var course = await unitOfWork.Courses.GetByIdAsync(id);
        if (course is null)
        {
            logger.LogWarning("SetStatus failed - course not found: {CourseId}", id);
            return Result<bool>.Fail("Course not found", ErrorType.NotFound);
        }

        course.IsActive = request.IsActive;

        await unitOfWork.Courses.UpdateAsync(course);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(CourseCachePrefix);

        logger.LogInformation(
            "Course status changed: {CourseId} IsActive: {IsActive}", id, request.IsActive);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<CourseResponse>> SetIconAsync(int fileId)
    {
        var file = await unitOfWork.Files.GetByIdAsync(fileId);
        if (file is null)
        {
            logger.LogWarning("SetIcon failed - file not found: {FileId}", fileId);
            return Result<CourseResponse>.Fail("File not found", ErrorType.NotFound);
        }

        if (file.OwnerType != FileOwnerType.Course)
            return Result<CourseResponse>.Fail(
                "File is not for a course", ErrorType.BadRequest);

        var course = await unitOfWork.Courses.GetByIdAsync(file.OwnerId);
        if (course is null)
        {
            logger.LogWarning("SetIcon failed - course not found: {CourseId}", file.OwnerId);
            return Result<CourseResponse>.Fail("Course not found", ErrorType.NotFound);
        }

        if (!string.IsNullOrEmpty(course.IconUrl))
            logger.LogInformation(
                "Course {CourseId} icon replaced. Old: {Old}, New: {New}",
                course.Id, course.IconUrl, file.Url);

        course.IconUrl = file.Url;

        await unitOfWork.Courses.UpdateAsync(course);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(CourseCachePrefix);

        logger.LogInformation("Course {CourseId} icon set to {Url}", course.Id, file.Url);

        return Result<CourseResponse>.Ok(MapToResponse(course));
    }

    private static CourseResponse MapToResponse(Domain.Entities.Course c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description,
        Price = c.Price,
        IconUrl = c.IconUrl,
        DurationWeeks = c.DurationWeeks,
        IsActive = c.IsActive,
        GroupsCount = c.Groups?.Count ?? 0,
        CreatedAt = c.CreatedAt
    };
}