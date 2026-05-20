using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Profile.Request;
using EduCrm.Application.DTOs.Profile.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Constants;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class ProfileService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IFileStorageService fileStorage,
    ILogger<ProfileService> logger,
    IAuditLogService auditLogService) : IProfileService
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
            return Result<ProfileResponse>.Fail("Profile not found");

        var response = MapToResponse(profile);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));

        return Result<ProfileResponse>.Ok(response);
    }

    public async Task<Result<ProfileResponse>> CreateAsync(int userId, CreateProfileRequest request)
    {
        var user = await unitOfWork.Users.GetByIdAsync(userId);
        if (user is null)
            return Result<ProfileResponse>.Fail("User not found");

        var existing = await unitOfWork.Profiles.GetByUserIdAsync(userId);
        if (existing is not null)
            return Result<ProfileResponse>.Fail("Profile already exists", ErrorType.Conflict);

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

        await auditLogService.LogAsync(
            userId,
            AuditActions.CreateProfile,
            nameof(Profile),
            profile.Id,
            newValues: request
        );

        await cache.RemoveByPrefixAsync(ProfileCachePrefix);

        return Result<ProfileResponse>.Ok(MapToResponse(profile));
    }

    public async Task<Result<ProfileResponse>> UpdateAsync(int userId, UpdateProfileRequest request)
    {
        var profile = await unitOfWork.Profiles.GetByUserIdAsync(userId);
        if (profile is null)
            return Result<ProfileResponse>.Fail("Profile not found");

        var oldValues = new
        {
            profile.AboutMe,
            profile.DateOfBirth,
            profile.Address,
            profile.TelegramUsername,
            profile.LinkedInUrl,
            profile.GithubUrl
        };

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

        await auditLogService.LogAsync(
            userId,
            AuditActions.UpdateProfile,
            nameof(Profile),
            profile.Id,
            oldValues,
            request
        );

        await cache.RemoveByPrefixAsync(ProfileCachePrefix);

        return Result<ProfileResponse>.Ok(MapToResponse(profile));
    }

    public async Task<Result<ProfileResponse>> SetAvatarAsync(
        int userId,
        IFormFile avatarFile,
        int uploadedByUserId)
    {
        var profile = await unitOfWork.Profiles.GetByUserIdAsync(userId);
        if (profile is null)
            return Result<ProfileResponse>.Fail("Profile not found");

        var oldAvatar = profile.AvatarUrl;

        var fileRecord = await fileStorage.UploadAsync(
            avatarFile,
            FileOwnerType.Profile,
            userId,
            uploadedByUserId);

        profile.AvatarUrl = fileRecord.Url;
        profile.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.Profiles.UpdateAsync(profile);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(
            uploadedByUserId,
            AuditActions.UploadAvatar,
            nameof(Profile),
            profile.Id,
            newValues: new { oldAvatar, fileRecord.Url }
        );

        await cache.RemoveByPrefixAsync(ProfileCachePrefix);

        return Result<ProfileResponse>.Ok(MapToResponse(profile));
    }

    public async Task<Result<bool>> DeleteAsync(int userId)
    {
        var profile = await unitOfWork.Profiles.GetByUserIdAsync(userId);
        if (profile is null)
            return Result<bool>.Fail("Profile not found");

        await unitOfWork.Profiles.DeleteAsync(profile.Id);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(
            userId,
            AuditActions.DeleteProfile,
            nameof(Profile),
            profile.Id,
            oldValues: profile
        );

        await cache.RemoveByPrefixAsync(ProfileCachePrefix);

        return Result<bool>.Ok(true);
    }

    private static ProfileResponse MapToResponse(Profile p)
    {
        return new ProfileResponse
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
}