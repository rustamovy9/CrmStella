using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Group.Request;
using EduCrm.Application.DTOs.Group.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IGroupService
{
    Task<Result<List<GroupListItemResponse>>> GetAllAsync();
    Task<Result<GroupResponse>> GetByIdAsync(int id);
    Task<Result<GroupResponse>> CreateAsync(CreateGroupRequest request);
    Task<Result<GroupResponse>> UpdateAsync(int id, UpdateGroupRequest request);
    Task<Result<bool>> SetStatusAsync(int id, SetGroupStatusRequest request);
}