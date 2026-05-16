using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Auth.Request;
using EduCrm.Application.DTOs.Auth.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IAuthService
{
    Task<Result<AuthResponse>> LoginAsync(LoginRequest request);
    Task<Result<RegisterResponse>> RegisterAsync(int adminUserId, RegisterRequest request);
    Task<Result<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request);
    Task<Result<bool>> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<Result<bool>> VerifyCodeAsync(VerifyCodeRequest request);
    Task<Result<bool>> ResetPasswordAsync(ResetPasswordRequest request);
    Task<Result<bool>> ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<Result<bool>> LogoutAsync(int userId);
}