using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Course.Request;
using CrmStella.Application.DTOs.Course.Response;
using Microsoft.AspNetCore.Http;

namespace CrmStella.Application.Interfaces.Services;

public interface ICourseService
{
    public Task<Result<PagedResult<CourseListItemResponse>>> GetAllAsync(
        CourseQueryRequest query);

    Task<Result<CourseResponse>> GetByIdAsync(int id);
    Task<Result<CourseResponse>> CreateAsync(CreateCourseRequest request, int uploadedByUserId);
    Task<Result<CourseResponse>> UpdateAsync(int id, UpdateCourseRequest request);
    Task<Result<bool>> SetStatusAsync(int id, SetCourseStatusRequest request);
    Task<Result<CourseResponse>> SetCourseIconAsync(int courseId, IFormFile iconFile, int uploadedByUserId);
}