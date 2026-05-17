using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Course.Request;
using EduCrm.Application.DTOs.Course.Response;
using Microsoft.AspNetCore.Http;

namespace EduCrm.Application.Interfaces.Services;

public interface ICourseService
{
    Task<Result<List<CourseListItemResponse>>> GetAllAsync();
    Task<Result<CourseResponse>> GetByIdAsync(int id);
    Task<Result<CourseResponse>> CreateAsync(CreateCourseRequest request, int uploadedByUserId);
    Task<Result<CourseResponse>> UpdateAsync(int id, UpdateCourseRequest request);
    Task<Result<bool>> SetStatusAsync(int id, SetCourseStatusRequest request);
    Task<Result<CourseResponse>> SetCourseIconAsync(int courseId, IFormFile iconFile, int uploadedByUserId);
}