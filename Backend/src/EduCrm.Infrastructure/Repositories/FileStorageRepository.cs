using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class FileStorageRepository(AppDbContext context) : IFileStorageRepository
{
    public async Task<FileStorage?> GetByIdAsync(
        int id, CancellationToken cancellationToken = default)
        => await context.FileStorages
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);

    public async Task CreateAsync(
        FileStorage file, CancellationToken cancellationToken = default)
        => await context.FileStorages.AddAsync(file, cancellationToken);
}