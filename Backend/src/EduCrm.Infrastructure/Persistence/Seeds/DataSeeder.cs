using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Persistence.Seeds;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await SeedRolesAsync(context);
        await SeedAdminAsync(context);
    }

    private static async Task SeedRolesAsync(AppDbContext context)
    {
        if (await context.Roles.AnyAsync()) return;

        var roles = new List<Role>
        {
            new() { Id = 1, Name = "Admin", Description = "Full access" },
            new() { Id = 2, Name = "Mentor", Description = "Mentor access" },
            new() { Id = 3, Name = "Student", Description = "Student access" }
        };

        await context.Roles.AddRangeAsync(roles);
        await context.SaveChangesAsync();
    }

    private static async Task SeedAdminAsync(AppDbContext context)
    {
        if (await context.Users.AnyAsync(x => x.RoleId == 1)) return;

        var admin = new User
        {
            FirstName = "Super",
            LastName = "Admin",
            Email = "admin@educrm.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            RoleId = 1,
            IsActive = true,
            IsPasswordSet = true
        };

        await context.Users.AddAsync(admin);
        await context.SaveChangesAsync();
    }
}