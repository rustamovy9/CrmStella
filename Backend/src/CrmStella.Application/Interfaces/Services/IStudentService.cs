using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Student.Request;
using CrmStella.Application.DTOs.Student.Response;
using CrmStella.Application.DTOs.Students.Request;
using CrmStella.Application.DTOs.Users.Response;

namespace CrmStella.Application.Interfaces.Services;

public interface IStudentService
{
    public Task<Result<PagedResult<StudentListItemResponse>>> GetAllAsync(
        StudentQueryRequest query,
        CancellationToken cancellationToken = default);

    Task<Result<UserDetailResponse>> GetByIdAsync(int id);
    Task<Result<StudentDashboardResponse>> GetDashboardAsync(int userId);
    Task<Result<StudentResponse>> UpdateAsync(int id, UpdateStudentRequest request);
    Task<Result<bool>> SetStatusAsync(int id, SetStudentStatusRequest request);
}