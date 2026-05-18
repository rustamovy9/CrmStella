// Application/Services/ProfileService.cs
using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Profile.Request;
using EduCrm.Application.DTOs.Profile.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class ProfileService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IFileStorageService fileStorage,
    ILogger<ProfileService> logger) : IProfileService
{
    private const string ProfileCachePrefix = "profiles:";

    public async Task<Result<ProfileResponse>> GetByUserIdAsync(int userId)
    {
        var cacheKey = $"{ProfileCachePrefix}{userId}";

        var cached = await cache.GetAsync<ProfileResponse>(cacheKey);
        if (cached is not null)
            return Result<ProfileResponse>.Ok(cached);

        var profile = await unitOfWork.Profiles.GetByUserIdAsync(userId);
        if (profile is null)
        {
            logger.LogWarning("Profile not found for user: {UserId}", userId);
            return Result<ProfileResponse>.Fail("Profile not found", ErrorType.NotFound);
        }

        var response = MapToResponse(profile);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));

        return Result<ProfileResponse>.Ok(response);
    }

    public async Task<Result<ProfileResponse>> CreateAsync(
    int userId,
    CreateProfileRequest request)
{
    var user = await unitOfWork.Users.GetByIdAsync(userId);
    if (user is null)
    {
        logger.LogWarning("Create profile failed - user not found: {UserId}", userId);
        return Result<ProfileResponse>.Fail("User not found", ErrorType.NotFound);
    }

    var existingProfile = await unitOfWork.Profiles.GetByUserIdAsync(userId);
    if (existingProfile is not null)
    {
        logger.LogWarning("Create profile failed - profile already exists: {UserId}", userId);
        return Result<ProfileResponse>.Fail(
            "Profile already exists for this user",
            ErrorType.Conflict);
    }

    var profile = new Profile
    {
        UserId = userId,
        AboutMe = request.AboutMe?.Trim(),
        DateOfBirth = request.DateOfBirth,
        Address = request.Address?.Trim(),
        TelegramUsername = request.TelegramUsername?.Trim(),
        LinkedInUrl = request.LinkedInUrl?.Trim(),
        GithubUrl = request.GithubUrl?.Trim(),
        CreatedAt = DateTime.UtcNow
    };

    await unitOfWork.Profiles.CreateAsync(profile);
    await unitOfWork.SaveChangesAsync();

    await cache.RemoveByPrefixAsync(ProfileCachePrefix);

    logger.LogInformation("Profile created: {ProfileId} for UserId: {UserId}", profile.Id, userId);

    return Result<ProfileResponse>.Ok(MapToResponse(profile));
}

public async Task<Result<ProfileResponse>> UpdateAsync(
    int userId,
    UpdateProfileRequest request)
{
    var profile = await unitOfWork.Profiles.GetByUserIdAsync(userId);
    if (profile is null)
    {
        logger.LogWarning("Update profile failed - profile not found: {UserId}", userId);
        return Result<ProfileResponse>.Fail("Profile not found", ErrorType.NotFound);
    }

    // Обновляем ТОЛЬКО те поля, которые были отправлены
    if (request.AboutMe is not null)
        profile.AboutMe = request.AboutMe.Trim();

    if (request.DateOfBirth is not null)
        profile.DateOfBirth = request.DateOfBirth;

    if (request.Address is not null)
        profile.Address = request.Address.Trim();

    if (request.TelegramUsername is not null)
        profile.TelegramUsername = request.TelegramUsername.Trim();

    if (request.LinkedInUrl is not null)
        profile.LinkedInUrl = request.LinkedInUrl.Trim();

    if (request.GithubUrl is not null)
        profile.GithubUrl = request.GithubUrl.Trim();

    profile.UpdatedAt = DateTime.UtcNow;

    await unitOfWork.Profiles.UpdateAsync(profile);
    await unitOfWork.SaveChangesAsync();

    await cache.RemoveByPrefixAsync(ProfileCachePrefix);

    logger.LogInformation("Profile updated: {ProfileId} for UserId: {UserId}", profile.Id, userId);

    return Result<ProfileResponse>.Ok(MapToResponse(profile));
}

    public async Task<Result<ProfileResponse>> SetAvatarAsync(
        int userId,
        IFormFile avatarFile,
        int uploadedByUserId)
    {
        var profile = await unitOfWork.Profiles.GetByUserIdAsync(userId);
        if (profile is null)
        {
            logger.LogWarning("SetAvatar failed - profile not found: {UserId}", userId);
            return Result<ProfileResponse>.Fail("Profile not found", ErrorType.NotFound);
        }

        try
        {
            // Удаляем старый аватар если есть
            if (!string.IsNullOrEmpty(profile.AvatarUrl))
            {
                var oldFile = await unitOfWork.Files.GetByOwnerAsync(
                    FileOwnerType.Profile,
                    userId);

                if (oldFile is not null)
                {
                    try
                    {
                        await fileStorage.DeleteAsync(oldFile.Id);
                        logger.LogInformation("Old avatar deleted: {UserId}", userId);
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "Failed to delete old avatar: {UserId}", userId);
                    }
                }
            }

            // Загружаем новый аватар
            var fileRecord = await fileStorage.UploadAsync(
                avatarFile,
                FileOwnerType.Profile,
                userId,
                uploadedByUserId);

            profile.AvatarUrl = fileRecord.Url;
            profile.UpdatedAt = DateTime.UtcNow;

            await unitOfWork.Profiles.UpdateAsync(profile);
            await unitOfWork.SaveChangesAsync();

            await cache.RemoveByPrefixAsync(ProfileCachePrefix);

            logger.LogInformation(
                "Avatar set: {UserId} - {Url}",
                userId, fileRecord.Url);

            return Result<ProfileResponse>.Ok(MapToResponse(profile));
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "SetAvatar validation failed: {UserId}", userId);
            return Result<ProfileResponse>.Fail(ex.Message, ErrorType.BadRequest);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SetAvatar error: {UserId}", userId);
            return Result<ProfileResponse>.Fail(
                "Could not set avatar",
                ErrorType.Unknown);
        }
    }

    public async Task<Result<bool>> DeleteAsync(int userId)
    {
        var profile = await unitOfWork.Profiles.GetByUserIdAsync(userId);
        if (profile is null)
        {
            logger.LogWarning("Delete profile failed - profile not found: {UserId}", userId);
            return Result<bool>.Fail("Profile not found", ErrorType.NotFound);
        }

        // Удаляем аватар если есть
        if (!string.IsNullOrEmpty(profile.AvatarUrl))
        {
            var file = await unitOfWork.Files.GetByOwnerAsync(
                FileOwnerType.Profile,
                userId);

            if (file is not null)
            {
                try
                {
                    await fileStorage.DeleteAsync(file.Id);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to delete avatar: {UserId}", userId);
                }
            }
        }

        await unitOfWork.Profiles.DeleteAsync(profile.Id);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(ProfileCachePrefix);

        logger.LogInformation("Profile deleted: {UserId}", userId);

        return Result<bool>.Ok(true);
    }

    private static ProfileResponse MapToResponse(Profile p) => new()
    {
        Id = p.Id,
        UserId = p.UserId,
        FullName = p.User?.FullName,
        Email = p.User?.Email,
        AvatarUrl = p.AvatarUrl,
        DateOfBirth = p.DateOfBirth,
        Address = p.Address,
        TelegramUsername = p.TelegramUsername,
        LinkedInUrl = p.LinkedInUrl,
        GithubUrl = p.GithubUrl,
        AboutMe = p.AboutMe,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };
}