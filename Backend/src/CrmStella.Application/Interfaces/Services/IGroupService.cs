using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Group.Request;
using CrmStella.Application.DTOs.Group.Response;

namespace CrmStella.Application.Interfaces.Services;

public interface IGroupService
{
    public Task<Result<PagedResult<GroupListItemResponse>>> GetAllAsync(
        GroupQueryRequest query);

    Task<Result<GroupResponse>> GetByIdAsync(int id);
    Task<Result<GroupResponse>> CreateAsync(CreateGroupRequest request);
    Task<Result<GroupResponse>> UpdateAsync(int id, UpdateGroupRequest request);
    Task<Result<bool>> SetStatusAsync(int id, SetGroupStatusRequest request);
}