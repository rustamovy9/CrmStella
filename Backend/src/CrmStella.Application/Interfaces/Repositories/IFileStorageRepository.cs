using CrmStella.Domain.Entities;
using CrmStella.Domain.Enums;

namespace CrmStella.Application.Interfaces.Repositories;

public interface IFileStorageRepository
{
    Task<FileStorage?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<FileStorage?> GetByOwnerAsync(FileOwnerType ownerType, int ownerId,
        CancellationToken cancellationToken = default);

    Task<FileStorage> CreateAsync(FileStorage fileStorage, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}