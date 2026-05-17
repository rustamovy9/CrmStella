using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Files.Response;
using EduCrm.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace EduCrm.Application.Interfaces.Services;

public interface IFileStorageService
{
    Task<Result<FileUploadResponse>> UploadAsync(
        IFormFile file,
        FileOwnerType ownerType,
        int ownerId,
        int uploadedByUserId);
}