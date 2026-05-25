using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Student.Request;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class StudentRepository(AppDbContext context) : IStudentRepository
{
    public async Task<PagedResult<Student>> GetAllAsync(
        StudentQueryRequest query,
        CancellationToken cancellationToken = default)
    {
        var q = context.Students
            .Include(s => s.User)
            .ThenInclude(u => u.Profile)
            .Include(s => s.GroupStudents)
            .AsQueryable();

        if (query.IsActive.HasValue)
            q = q.Where(s => s.IsActive == query.IsActive.Value);

        if (query.GroupId.HasValue)
            q = q.Where(s => s.GroupStudents
                .Any(gs => gs.GroupId == query.GroupId.Value));

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.ToLower();
            q = q.Where(s =>
                s.User.FirstName.ToLower().Contains(search) ||
                s.User.LastName.ToLower().Contains(search) ||
                s.User.Email.ToLower().Contains(search));
        }

        var totalCount = await q.CountAsync(cancellationToken);

        var items = await q
            .OrderByDescending(s => s.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Student>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<Student?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await context.Students
            .Include(s => s.User)
            .ThenInclude(u => u.Profile)
            .Include(s => s.GroupStudents)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<Student?> GetByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        return await context.Students
            .Include(s => s.User)
            .ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);
    }

    public async Task<bool> ExistsByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        return await context.Students
            .AnyAsync(s => s.UserId == userId, cancellationToken);
    }

    public async Task CreateAsync(
        Student student,
        CancellationToken cancellationToken = default)
    {
        await context.Students.AddAsync(student, cancellationToken);
    }

    public Task UpdateAsync(
        Student student,
        CancellationToken cancellationToken = default)
    {
        context.Students.Update(student);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(int id)
    {
        var student = await context.Students.FindAsync(id);

        if (student is not null)
            context.Students.Remove(student);
    }
}