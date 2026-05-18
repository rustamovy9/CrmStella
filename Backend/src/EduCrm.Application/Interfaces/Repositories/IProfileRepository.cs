using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IProfileRepository
{
    Task<Profile?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Profile?> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task CreateAsync(Profile profile, CancellationToken cancellationToken = default);
    Task UpdateAsync(Profile profile, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}