using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class StudentRepository(AppDbContext context) : IStudentRepository
{
    public async Task<List<Student>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await context.Students
            .Include(s => s.User)
            .ThenInclude(u => u.Profile)
            .OrderByDescending(s => s.Id)
            .ToListAsync(cancellationToken);
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

    public async Task DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var student = await context.Students
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (student is null)
            return;

        context.Students.Remove(student);
    }
}