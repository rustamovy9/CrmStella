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
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

    private static readonly string[] AllowedImageTypes =
        ["image/jpeg", "image/png", "image/webp", "image/gif"];

    public async Task<FileStorage> UploadAsync(
        IFormFile file,
        FileOwnerType ownerType,
        int ownerId,
        int? uploadedByUserId = null,
        CancellationToken cancellationToken = default)
    {
        // валидация
        if (file.Length == 0)
            throw new ArgumentException("File is empty");

        if (file.Length > MaxFileSize)
            throw new ArgumentException("File size exceeds 5MB");

        if (!AllowedImageTypes.Contains(file.ContentType.ToLower()))
            throw new ArgumentException("Invalid file type. Only images are allowed");

        // определяем папку по типу
        var folder = ownerType switch
        {
            FileOwnerType.Course => "courses",
            FileOwnerType.Profile => "profiles",
            FileOwnerType.Homework => "homeworks",
            FileOwnerType.HomeworkSubmission => "submissions",
            FileOwnerType.PaymentReceipt => "payments",
            FileOwnerType.Lesson => "lessons",
            _ => "others"
        };

        // генерируем уникальное имя
        var extension = Path.GetExtension(file.FileName).ToLower();
        var storedFileName = $"{Guid.NewGuid()}{extension}";

        // путь для сохранения
        var uploadPath = Path.Combine("wwwroot", "uploads", folder);
        Directory.CreateDirectory(uploadPath);

        var filePath = Path.Combine(uploadPath, storedFileName);

        // сохраняем файл
        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream, cancellationToken);

        // создаём запись в БД
        var fileStorage = new FileStorage
        {
            OwnerType = ownerType,
            OwnerId = ownerId,
            UploadedByUserId = uploadedByUserId,
            OriginalFileName = file.FileName,
            StoredFileName = storedFileName,
            FilePath = filePath,
            Url = $"/uploads/{folder}/{storedFileName}",
            FileSize = file.Length,
            MimeType = file.ContentType,
            Extension = extension
        };

        await unitOfWork.Files.CreateAsync(fileStorage, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "File uploaded: {FileName} for {OwnerType} {OwnerId}",
            storedFileName, ownerType, ownerId);

        return fileStorage;
    }

    public async Task DeleteAsync(
        int fileId,
        CancellationToken cancellationToken = default)
    {
        var file = await unitOfWork.Files.GetByIdAsync(fileId, cancellationToken);
        if (file is null) return;

        // удаляем физический файл
        if (File.Exists(file.FilePath))
            File.Delete(file.FilePath);

        await unitOfWork.Files.DeleteAsync(fileId, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("File deleted: {FileName}", file.StoredFileName);
    }

    public async Task<FileStorage?> GetByOwnerAsync(
        FileOwnerType ownerType,
        int ownerId,
        CancellationToken cancellationToken = default)
    {
        return await unitOfWork.Files.GetByOwnerAsync(ownerType, ownerId, cancellationToken);
    }
}