using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Course.Request;
using EduCrm.Application.DTOs.Course.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface ICourseService
{
    Task<Result<List<CourseListItemResponse>>> GetAllAsync();
    Task<Result<CourseResponse>> GetByIdAsync(int id);
    Task<Result<CourseResponse>> CreateAsync(CreateCourseRequest request);
    Task<Result<CourseResponse>> UpdateAsync(int id, UpdateCourseRequest request);
    Task<Result<bool>> SetStatusAsync(int id, SetCourseStatusRequest request);
    Task<Result<CourseResponse>> SetIconAsync(int fileId);
}