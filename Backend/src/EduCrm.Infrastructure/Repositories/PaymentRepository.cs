using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
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
            .AsNoTracking()
            .Where(x => x.StudentId == studentId && x.IsConfirmed)
            .SumAsync(p =>
                p.Type == PaymentType.Income ? p.Amount :
                p.Type == PaymentType.Bonus    ? p.Amount :
                p.Type == PaymentType.Debt     ? -p.Amount :
                p.Type == PaymentType.CourseFee     ? -p.Amount :
                p.Type == PaymentType.Refund   ? -p.Amount :
                p.Type == PaymentType.Discount ? -p.Amount :
                p.Amount);
    }
    
    public async Task<List<Payment>> GetAllConfirmedAsync()
    {
        return await db.Payments
            .AsNoTracking()
            .Where(p => p.IsConfirmed)
            .ToListAsync();
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