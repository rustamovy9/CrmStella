using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Auth.Request;
using CrmStella.Application.DTOs.Auth.Response;

namespace CrmStella.Application.Interfaces.Services;

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
    Task<Result<bool>> AssignRoleAsync(int adminUserId, AssignRoleRequest request, CancellationToken ct = default);
}