using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Group.Request;
using CrmStella.Domain.Entities;

namespace CrmStella.Application.Interfaces.Repositories;

public interface IGroupRepository
{
    Task<PagedResult<Group>> GetAllAsync(
        GroupQueryRequest query,
        CancellationToken cancellationToken = default);

    Task<Group?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<Group>> GetByMentorAsync(int mentorId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByNameAsync(string name, CancellationToken cancellationToken = default);

    Task CreateAsync(Group group, CancellationToken cancellationToken = default);
    Task UpdateAsync(Group group, CancellationToken cancellationToken = default);
}