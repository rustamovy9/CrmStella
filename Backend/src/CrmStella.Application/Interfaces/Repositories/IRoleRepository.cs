using CrmStella.Domain.Entities;

namespace CrmStella.Application.Interfaces.Repositories;

public interface IRoleRepository
{
    Task<Role?> GetByNameAsync(string name, CancellationToken ct = default);
}