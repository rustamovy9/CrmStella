using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class FileStorageRepository(AppDbContext context) : IFileStorageRepository
{
    public async Task<FileStorage?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
        => await context.FileStorages
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<FileStorage?> GetByOwnerAsync(
        FileOwnerType ownerType,
        int ownerId,
        CancellationToken cancellationToken = default)
        => await context.FileStorages
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.OwnerType == ownerType && x.OwnerId == ownerId,
                cancellationToken);

    public async Task<FileStorage> CreateAsync(
        FileStorage fileStorage,
        CancellationToken cancellationToken = default)
    {
        await context.FileStorages.AddAsync(fileStorage, cancellationToken);
        return fileStorage;
    }

    public async Task DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var file = await context.FileStorages.FindAsync([id], cancellationToken);
        if (file is null) return;
        context.FileStorages.Remove(file);
    }
}