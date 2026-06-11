using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Profile.Request;
using CrmStella.Application.DTOs.Profile.Response;
using Microsoft.AspNetCore.Http;

namespace CrmStella.Application.Interfaces.Services;

public interface IProfileService
{
    Task<Result<ProfileResponse>> GetByUserIdAsync(int userId);
    Task<Result<ProfileResponse>> CreateAsync(int userId, CreateProfileRequest request);
    Task<Result<ProfileResponse>> UpdateAsync(int userId, UpdateProfileRequest request);
    Task<Result<ProfileResponse>> SetAvatarAsync(int userId, IFormFile avatarFile, int uploadedByUserId);
    Task<Result<bool>> UpdateAvatarUrlAsync(int userId, string avatarUrl);
    Task<Result<bool>> DeleteAsync(int userId);
}