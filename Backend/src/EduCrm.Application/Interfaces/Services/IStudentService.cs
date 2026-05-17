using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Students.Request;
using EduCrm.Application.DTOs.Students.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IStudentService
{
    Task<Result<List<StudentListItemResponse>>> GetAllAsync();
    Task<Result<StudentResponse>> GetByIdAsync(int id);
    Task<Result<StudentResponse>> UpdateAsync(int id, UpdateStudentRequest request);
    Task<Result<bool>> SetStatusAsync(int id, SetStudentStatusRequest request);
}