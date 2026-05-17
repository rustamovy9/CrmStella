using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Course.Request;
using EduCrm.Application.DTOs.Course.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class CourseService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IFileStorageService fileStorage,
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

    public async Task<Result<CourseResponse>> CreateAsync(CreateCourseRequest request, int uploadedByUserId)
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

        // Загружаем иконку если она есть
        if (request.Icon is not null && request.Icon.Length > 0)
        {
            try
            {
                var fileRecord = await fileStorage.UploadAsync(
                    request.Icon,
                    FileOwnerType.Course,
                    course.Id,
                    uploadedByUserId);

                course.IconUrl = fileRecord.Url;
                await unitOfWork.Courses.UpdateAsync(course);
                await unitOfWork.SaveChangesAsync();

                logger.LogInformation("Course icon uploaded: {CourseId}", course.Id);
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning(ex, "Failed to upload course icon: {CourseId}", course.Id);
                // Не критично - курс создан, иконка не загружена
            }
        }

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

    public async Task<Result<CourseResponse>> SetCourseIconAsync(
        int courseId, 
        IFormFile iconFile, 
        int uploadedByUserId)
    {
        // 1. Проверяем, существует ли курс
        var course = await unitOfWork.Courses.GetByIdAsync(courseId);
        if (course is null)
        {
            logger.LogWarning("SetCourseIcon failed - course not found: {CourseId}", courseId);
            return Result<CourseResponse>.Fail("Course not found", ErrorType.NotFound);
        }

        try
        {
            // 2. Удаляем старую иконку если она есть
            if (!string.IsNullOrEmpty(course.IconUrl))
            {
                var oldFile = await unitOfWork.Files.GetByOwnerAsync(
                    FileOwnerType.Course,
                    courseId);

                if (oldFile is not null)
                {
                    try
                    {
                        await fileStorage.DeleteAsync(oldFile.Id);
                        logger.LogInformation(
                            "Old course icon deleted: {CourseId}", courseId);
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(
                            ex,
                            "Failed to delete old icon: {CourseId}",
                            courseId);
                        // Не критично - продолжаем
                    }
                }
            }

            // 3. Загружаем новую иконку
            var newFileRecord = await fileStorage.UploadAsync(
                iconFile,
                FileOwnerType.Course,
                courseId,
                uploadedByUserId);

            // 4. Обновляем курс с новым URL
            course.IconUrl = newFileRecord.Url;

            await unitOfWork.Courses.UpdateAsync(course);
            await unitOfWork.SaveChangesAsync();

            // 5. Инвалидируем кэш
            await cache.RemoveByPrefixAsync(CourseCachePrefix);

            logger.LogInformation(
                "Course icon set: {CourseId} - {Url}",
                courseId, newFileRecord.Url);

            return Result<CourseResponse>.Ok(MapToResponse(course));
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "SetCourseIcon validation failed: {CourseId}", courseId);
            return Result<CourseResponse>.Fail(ex.Message, ErrorType.BadRequest);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SetCourseIcon error: {CourseId}", courseId);
            return Result<CourseResponse>.Fail(
                "Could not set course icon",
                ErrorType.Unknown);
        }
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