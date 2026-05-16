using EduCrm.Application.Common;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Application.Services;
using EduCrm.Infrastructure.Persistence.Data;
using EduCrm.Infrastructure.Repositories;
using EduCrm.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EduCrm.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // DbContext
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IVerificationCodeRepository, VerificationCodeRepository>();

        // Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IUserService, UserService>();

        // Settings
        services.Configure<EmailSettings>(
            configuration.GetSection("EmailSettings"));

        return services;
    }
}