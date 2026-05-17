using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IFileStorageRepository
{
    Task<FileStorage?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task CreateAsync(FileStorage file, CancellationToken cancellationToken = default);
}