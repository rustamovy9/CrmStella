using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Student.Request;
using EduCrm.Application.DTOs.Student.Response;
using EduCrm.Application.DTOs.Students.Request;

namespace EduCrm.Application.Interfaces.Services;

public interface IStudentService
{
    public Task<Result<PagedResult<StudentListItemResponse>>> GetAllAsync(
        StudentQueryRequest query,
        CancellationToken cancellationToken = default);

    Task<Result<StudentResponse>> GetByIdAsync(int id);
    Task<Result<StudentResponse>> UpdateAsync(int id, UpdateStudentRequest request);
    Task<Result<bool>> SetStatusAsync(int id, SetStudentStatusRequest request);
}