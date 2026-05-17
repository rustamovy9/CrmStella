using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace EduCrm.Application.Interfaces.Services;

public interface IFileStorageService
{
    Task<FileStorage> UploadAsync(
        IFormFile file,
        FileOwnerType ownerType,
        int ownerId,
        int? uploadedByUserId = null,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        int fileId,
        CancellationToken cancellationToken = default);

    Task<FileStorage?> GetByOwnerAsync(
        FileOwnerType ownerType,
        int ownerId,
        CancellationToken cancellationToken = default);
}