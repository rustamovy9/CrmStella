using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Users.Request;
using EduCrm.Application.DTOs.Users.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IUserService
{
    Task<Result<List<UserResponse>>> GetAllAsync();
    Task<Result<List<UserResponse>>> GetByRoleAsync(int roleId);
    Task<Result<UserDetailResponse>> GetByIdAsync(int id);
    Task<Result<UserDetailResponse>> UpdateAsync(int id, UpdateUserRequest request);
    Task<Result<bool>> SetActiveAsync(int id, bool isActive);
    Task<Result<bool>> DeleteAsync(int id);
}