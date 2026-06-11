using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Domain.Entities;
using CrmStella.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmStella.Infrastructure.Repositories;

public class RoleRepository(AppDbContext context) : IRoleRepository
{
    public async Task<Role?> GetByNameAsync(string name, CancellationToken ct = default)
    {
        return await context.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Name == name, ct);
    }
}