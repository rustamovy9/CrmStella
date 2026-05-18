using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Infrastructure.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EduCrm.Infrastructure.Repositories;

public class PaymentRepository(AppDbContext db) : IPaymentRepository
{
    public async Task<List<Payment>> GetAllAsync()
    {
        return await db.Payments
            .Include(p => p.Student).ThenInclude(s => s.User)
            .Include(p => p.Group)
            .Include(p => p.CreatedByUser)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Payment>> GetByStudentIdAsync(int studentId)
    {
        return await db.Payments
            .Include(p => p.Student).ThenInclude(s => s.User)
            .Include(p => p.Group)
            .Include(p => p.CreatedByUser)
            .Where(p => p.StudentId == studentId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Payment>> GetByGroupIdAsync(int groupId)
    {
        return await db.Payments
            .Include(p => p.Student).ThenInclude(s => s.User)
            .Include(p => p.Group)
            .Include(p => p.CreatedByUser)
            .Where(p => p.GroupId == groupId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Payment?> GetByIdAsync(int id)
    {
        return await db.Payments
            .Include(p => p.Student).ThenInclude(s => s.User)
            .Include(p => p.Group)
            .Include(p => p.CreatedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<decimal> GetStudentBalanceAsync(int studentId)
    {
        return await db.Payments
            .Where(p => p.StudentId == studentId)
            .SumAsync(p => p.Amount);
    }

    public async Task CreateAsync(Payment payment)
    {
        await db.Payments.AddAsync(payment);
    }

    public Task UpdateAsync(Payment payment)
    {
        db.Payments.Update(payment);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Payment payment)
    {
        db.Payments.Remove(payment);
        return Task.CompletedTask;
    }
}