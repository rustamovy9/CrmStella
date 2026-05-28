using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Group.Request;
using EduCrm.Application.DTOs.Group.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IGroupService
{
    public Task<Result<PagedResult<GroupListItemResponse>>> GetAllAsync(
        GroupQueryRequest query);

    Task<Result<GroupResponse>> GetByIdAsync(int id);
    Task<Result<GroupResponse>> CreateAsync(CreateGroupRequest request);
    Task<Result<GroupResponse>> UpdateAsync(int id, UpdateGroupRequest request);
    Task<Result<bool>> SetStatusAsync(int id, SetGroupStatusRequest request);
}