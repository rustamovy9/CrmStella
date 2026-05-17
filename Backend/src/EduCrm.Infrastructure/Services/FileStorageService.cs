using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Files.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace EduCrm.Infrastructure.Services;

public class FileStorageService(
    IUnitOfWork unitOfWork,
    ILogger<FileStorageService> logger) : IFileStorageService
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    private static readonly string[] AllowedExtensions =
        { ".jpg", ".jpeg", ".png", ".webp", ".pdf", ".docx" };

    private const string UploadsRoot = "wwwroot/uploads";

    public async Task<Result<FileUploadResponse>> UploadAsync(
        IFormFile file,
        FileOwnerType ownerType,
        int ownerId,
        int uploadedByUserId)
    {
        // 1. файл вообще есть?
        if (file is null || file.Length == 0)
            return Result<FileUploadResponse>.Fail("File is empty", ErrorType.BadRequest);

        // 2. размер в пределах лимита?
        if (file.Length > MaxFileSizeBytes)
            return Result<FileUploadResponse>.Fail(
                "File is too large (max 10 MB)", ErrorType.BadRequest);

        // 3. расширение разрешено?
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            return Result<FileUploadResponse>.Fail(
                "File type is not allowed", ErrorType.BadRequest);

        // 4. генерируем БЕЗОПАСНОЕ имя (не доверяем имени от юзера)
        var storedFileName = $"{Guid.NewGuid()}{extension}";

        // 5. папка по типу владельца: wwwroot/uploads/Course/
        var folder = Path.Combine(UploadsRoot, ownerType.ToString());
        Directory.CreateDirectory(folder); // создаст, если нет

        var filePath = Path.Combine(folder, storedFileName);

        // 6. физически сохраняем файл на диск
        try
        {
            await using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to save file to disk: {Path}", filePath);
            return Result<FileUploadResponse>.Fail(
                "Could not save file", ErrorType.BadRequest);
        }

        // 7. публичный URL (относительный путь от wwwroot)
        var url = $"/uploads/{ownerType}/{storedFileName}";

        // 8. запись в реестр FileStorage
        var fileRecord = new FileStorage
        {
            OwnerType = ownerType,
            OwnerId = ownerId,
            UploadedByUserId = uploadedByUserId,
            OriginalFileName = file.FileName,
            StoredFileName = storedFileName,
            FilePath = filePath,
            Url = url,
            FileSize = file.Length,
            MimeType = file.ContentType,
            Extension = extension,
            UploadedAt = DateTime.UtcNow
        };

        await unitOfWork.Files.CreateAsync(fileRecord);
        await unitOfWork.SaveChangesAsync();

        logger.LogInformation(
            "File uploaded: {Original} -> {Stored} for {OwnerType}:{OwnerId}",
            file.FileName, storedFileName, ownerType, ownerId);

        return Result<FileUploadResponse>.Ok(new FileUploadResponse
        {
            Id = fileRecord.Id,
            OriginalFileName = fileRecord.OriginalFileName,
            Url = url,
            FileSize = fileRecord.FileSize,
            MimeType = fileRecord.MimeType
        });
    }
}