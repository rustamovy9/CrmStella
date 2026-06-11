using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Course.Request;
using CrmStella.Application.DTOs.Course.Response;
using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Application.Interfaces.Services;
using CrmStella.Domain.Constants;
using CrmStella.Domain.Entities;
using CrmStella.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace CrmStella.Application.Services;

public class CourseService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IFileStorageService fileStorage,
    IAuditLogService auditLogService,
    ILogger<CourseService> logger) : ICourseService
{
    private const string CourseCachePrefix = "courses:";
    private const string CourseListCacheKey = "courses:list";

    public async Task<Result<PagedResult<CourseListItemResponse>>> GetAllAsync(
        CourseQueryRequest query)
    {
        var cacheKey = $"{CourseCachePrefix}list:{query.Page}:{query.PageSize}:{query.Search}:{query.IsActive}";

        var cached = await cache.GetAsync<PagedResult<CourseListItemResponse>>(cacheKey);
        if (cached is not null)
            return Result<PagedResult<CourseListItemResponse>>.Ok(cached);

        var pagedCourses = await unitOfWork.Courses.GetAllAsync(query);

        var result = new PagedResult<CourseListItemResponse>
        {
            Items = pagedCourses.Items.Select(c => new CourseListItemResponse
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
            }).ToList(),
            TotalCount = pagedCourses.TotalCount,
            Page = pagedCourses.Page,
            PageSize = pagedCourses.PageSize
        };

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(30));

        return Result<PagedResult<CourseListItemResponse>>.Ok(result);
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
            return Result<CourseResponse>.Fail("Course not found");
        }

        var response = MapToResponse(course);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));

        return Result<CourseResponse>.Ok(response);
    }

    public async Task<Result<CourseResponse>> CreateAsync(CreateCourseRequest request, int userId)
    {
        if (await unitOfWork.Courses.ExistsByNameAsync(request.Name))
            return Result<CourseResponse>.Fail(
                "Course with this name already exists",
                ErrorType.Conflict);

        var course = new Course
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

        if (request.Icon is not null)
            try
            {
                var file = await fileStorage.UploadAsync(
                    request.Icon,
                    FileOwnerType.Course,
                    course.Id,
                    userId);

                course.IconUrl = file.Url;

                await unitOfWork.Courses.UpdateAsync(course);
                await unitOfWork.SaveChangesAsync();
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning(ex, "Icon upload failed for course {CourseId}", course.Id);
            }

        await auditLogService.LogAsync(
            userId,
            AuditActions.CreateCourse,
            "Course",
            course.Id,
            newValues: new
            {
                course.Name,
                course.Price,
                course.DurationWeeks
            });

        await cache.RemoveByPrefixAsync(CourseCachePrefix);

        return Result<CourseResponse>.Ok(MapToResponse(course));
    }

    public async Task<Result<CourseResponse>> UpdateAsync(int id, UpdateCourseRequest request)
    {
        var course = await unitOfWork.Courses.GetByIdAsync(id);
        if (course is null)
            return Result<CourseResponse>.Fail("Course not found");

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

        await auditLogService.LogAsync(
            null,
            AuditActions.UpdateCourse,
            "Course",
            course.Id,
            newValues: new
            {
                course.Name,
                course.Price,
                course.DurationWeeks
            });

        await cache.RemoveByPrefixAsync(CourseCachePrefix);

        return Result<CourseResponse>.Ok(MapToResponse(course));
    }

    public async Task<Result<bool>> SetStatusAsync(int id, SetCourseStatusRequest request)
    {
        var course = await unitOfWork.Courses.GetByIdAsync(id);
        if (course is null)
            return Result<bool>.Fail("Course not found");

        course.IsActive = request.IsActive;

        await unitOfWork.Courses.UpdateAsync(course);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(
            null,
            AuditActions.SetCourseStatus,
            "Course",
            course.Id,
            newValues: new { course.IsActive });

        await cache.RemoveByPrefixAsync(CourseCachePrefix);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<CourseResponse>> SetCourseIconAsync(
        int courseId,
        IFormFile iconFile,
        int userId)
    {
        var course = await unitOfWork.Courses.GetByIdAsync(courseId);
        if (course is null)
            return Result<CourseResponse>.Fail("Course not found");

        try
        {
            if (!string.IsNullOrEmpty(course.IconUrl))
            {
                var oldFile = await unitOfWork.Files.GetByOwnerAsync(
                    FileOwnerType.Course,
                    courseId);

                if (oldFile is not null)
                    await fileStorage.DeleteAsync(oldFile.Id);
            }

            var file = await fileStorage.UploadAsync(
                iconFile,
                FileOwnerType.Course,
                courseId,
                userId);

            course.IconUrl = file.Url;

            await unitOfWork.Courses.UpdateAsync(course);
            await unitOfWork.SaveChangesAsync();

            await auditLogService.LogAsync(
                userId,
                AuditActions.UploadFile,
                "Course",
                courseId,
                newValues: new { course.IconUrl });

            await cache.RemoveByPrefixAsync(CourseCachePrefix);

            return Result<CourseResponse>.Ok(MapToResponse(course));
        }
        catch (ArgumentException ex)
        {
            return Result<CourseResponse>.Fail(ex.Message, ErrorType.BadRequest);
        }
        catch (Exception)
        {
            return Result<CourseResponse>.Fail("Could not set course icon", ErrorType.Unknown);
        }
    }

    private static CourseResponse MapToResponse(Course c)
    {
        return new CourseResponse
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
}