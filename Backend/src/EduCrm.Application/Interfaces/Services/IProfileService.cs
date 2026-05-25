using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Profile.Request;
using EduCrm.Application.DTOs.Profile.Response;
using Microsoft.AspNetCore.Http;

namespace EduCrm.Application.Interfaces.Services;

public interface IProfileService
{
    Task<Result<ProfileResponse>> GetByUserIdAsync(int userId);
    Task<Result<ProfileResponse>> CreateAsync(int userId, CreateProfileRequest request);
    Task<Result<ProfileResponse>> UpdateAsync(int userId, UpdateProfileRequest request);
    Task<Result<ProfileResponse>> SetAvatarAsync(int userId, IFormFile avatarFile, int uploadedByUserId);
    Task<Result<bool>> UpdateAvatarUrlAsync(int userId, string avatarUrl);
    Task<Result<bool>> DeleteAsync(int userId);
}