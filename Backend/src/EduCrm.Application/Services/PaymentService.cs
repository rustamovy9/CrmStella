using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Payment.Request;
using EduCrm.Application.DTOs.Payment.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Constants;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class PaymentService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IFileStorageService fileStorage,
    ILogger<PaymentService> logger,
    IAuditLogService auditLogService) : IPaymentService
{
    private const string PaymentCachePrefix = "payments:";
    private const string PaymentListCacheKey = "payments:list";
    private const string StudentCachePrefix = "students:";

    public async Task<Result<List<PaymentListItemResponse>>> GetAllAsync()
    {
        var cached = await cache.GetAsync<List<PaymentListItemResponse>>(PaymentListCacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Payment list served from cache");
            return Result<List<PaymentListItemResponse>>.Ok(cached);
        }

        var payments = await unitOfWork.Payments.GetAllAsync();
        var result = payments.Select(MapToListItem).ToList();

        await cache.SetAsync(PaymentListCacheKey, result, TimeSpan.FromMinutes(15));

        return Result<List<PaymentListItemResponse>>.Ok(result);
    }

    public async Task<Result<List<PaymentListItemResponse>>> GetByStudentIdAsync(int studentId)
    {
        var cacheKey = $"{PaymentCachePrefix}student:{studentId}";

        var cached = await cache.GetAsync<List<PaymentListItemResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<PaymentListItemResponse>>.Ok(cached);

        var payments = await unitOfWork.Payments.GetByStudentIdAsync(studentId);
        var result = payments.Select(MapToListItem).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(15));

        return Result<List<PaymentListItemResponse>>.Ok(result);
    }

    public async Task<Result<List<PaymentListItemResponse>>> GetByGroupIdAsync(int groupId)
    {
        var cacheKey = $"{PaymentCachePrefix}group:{groupId}";

        var cached = await cache.GetAsync<List<PaymentListItemResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<PaymentListItemResponse>>.Ok(cached);

        var payments = await unitOfWork.Payments.GetByGroupIdAsync(groupId);
        var result = payments.Select(MapToListItem).ToList();

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(15));

        return Result<List<PaymentListItemResponse>>.Ok(result);
    }

    public async Task<Result<PaymentResponse>> GetByIdAsync(int id)
    {
        var cacheKey = $"{PaymentCachePrefix}{id}";

        var cached = await cache.GetAsync<PaymentResponse>(cacheKey);
        if (cached is not null)
            return Result<PaymentResponse>.Ok(cached);

        var payment = await unitOfWork.Payments.GetByIdAsync(id);
        if (payment is null)
        {
            logger.LogWarning("Payment not found: {PaymentId}", id);
            return Result<PaymentResponse>.Fail("Payment not found");
        }

        var response = MapToResponse(payment);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(15));

        return Result<PaymentResponse>.Ok(response);
    }

    public async Task<Result<StudentBalanceResponse>> GetStudentBalanceAsync(int studentId)
    {
        var cacheKey = $"{PaymentCachePrefix}balance:{studentId}";

        var cached = await cache.GetAsync<StudentBalanceResponse>(cacheKey);
        if (cached is not null)
            return Result<StudentBalanceResponse>.Ok(cached);

        var student = await unitOfWork.Students.GetByIdAsync(studentId);
        if (student is null)
            return Result<StudentBalanceResponse>.Fail("Student not found");

        var balance = await unitOfWork.Payments.GetStudentBalanceAsync(studentId);

        var response = new StudentBalanceResponse
        {
            StudentId = studentId,
            StudentFullName = student.User.FullName,
            Balance = balance
        };

        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(5));

        return Result<StudentBalanceResponse>.Ok(response);
    }

    public async Task<Result<PaymentResponse>> CreateAsync(
        CreatePaymentRequest request,
        int createdByUserId)
    {
        var student = await unitOfWork.Students.GetByIdAsync(request.StudentId);
        if (student is null)
            return Result<PaymentResponse>.Fail("Student not found");

        var group = await unitOfWork.Groups.GetByIdAsync(request.GroupId);
        if (group is null)
            return Result<PaymentResponse>.Fail("Group not found");

        var payment = new Payment
        {
            StudentId = request.StudentId,
            GroupId = request.GroupId,
            Amount = request.Amount,
            Type = request.Type,
            Method = request.Method,
            DueDate = request.DueDate,
            Note = request.Note?.Trim(),
            IsConfirmed = false,
            Date = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = createdByUserId
        };

        await unitOfWork.Payments.CreateAsync(payment);
        await unitOfWork.SaveChangesAsync();

        // загружаем квитанцию если есть
        if (request.Receipt is not null && request.Receipt.Length > 0)
        {
            try
            {
                var fileRecord = await fileStorage.UploadAsync(
                    request.Receipt,
                    FileOwnerType.PaymentReceipt,
                    payment.Id,
                    createdByUserId);

                payment.ReceiptUrl = fileRecord.Url;
                await unitOfWork.Payments.UpdateAsync(payment);
                await unitOfWork.SaveChangesAsync();

                logger.LogInformation("Payment receipt uploaded: {PaymentId}", payment.Id);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to upload receipt: {PaymentId}", payment.Id);
            }
        }

        // пересчитываем баланс напрямую через UpdateStudentAsync
        await RecalculateStudentBalanceAsync(request.StudentId);

        await auditLogService.LogAsync(
            createdByUserId,
            AuditActions.CreatePayment,
            nameof(Payment),
            payment.Id,
            newValues: new { request.Amount, request.Type, request.Method, request.GroupId }
        );

        await cache.RemoveByPrefixAsync(PaymentCachePrefix);
        await cache.RemoveByPrefixAsync(StudentCachePrefix);

        logger.LogInformation(
            "Payment created: {PaymentId} Student: {StudentId} Amount: {Amount}",
            payment.Id, payment.StudentId, payment.Amount);

        var created = await unitOfWork.Payments.GetByIdAsync(payment.Id);
        return Result<PaymentResponse>.Ok(MapToResponse(created!));
    }

    public async Task<Result<PaymentResponse>> UpdateAsync(int id, UpdatePaymentRequest request)
    {
        var payment = await unitOfWork.Payments.GetByIdAsync(id);
        if (payment is null)
            return Result<PaymentResponse>.Fail("Payment not found");

        if (payment.IsConfirmed)
            return Result<PaymentResponse>.Fail("Cannot update confirmed payment", ErrorType.BadRequest);

        var oldValues = new
        {
            payment.Amount,
            payment.Type,
            payment.Method,
            payment.DueDate,
            payment.Note
        };

        var amountChanged = request.Amount is not null && request.Amount != payment.Amount;
        var studentId = payment.StudentId;

        if (request.Amount is not null) payment.Amount = request.Amount.Value;
        if (request.Type is not null)   payment.Type   = request.Type.Value;
        if (request.Method is not null) payment.Method = request.Method.Value;
        if (request.DueDate is not null) payment.DueDate = request.DueDate;
        if (request.Note is not null)   payment.Note   = request.Note.Trim();

        await unitOfWork.Payments.UpdateAsync(payment);
        await unitOfWork.SaveChangesAsync();

        // пересчитываем баланс если изменилась сумма
        if (amountChanged)
            await RecalculateStudentBalanceAsync(studentId);

        await auditLogService.LogAsync(
            null,
            AuditActions.UpdatePayment,
            nameof(Payment),
            payment.Id,
            oldValues,
            request
        );

        await cache.RemoveByPrefixAsync(PaymentCachePrefix);
        await cache.RemoveByPrefixAsync(StudentCachePrefix);

        logger.LogInformation("Payment updated: {PaymentId}", id);

        var updated = await unitOfWork.Payments.GetByIdAsync(id);
        return Result<PaymentResponse>.Ok(MapToResponse(updated!));
    }

    public async Task<Result<bool>> ConfirmAsync(int id, ConfirmPaymentRequest request)
    {
        var payment = await unitOfWork.Payments.GetByIdAsync(id);
        if (payment is null)
            return Result<bool>.Fail("Payment not found");

        var oldValues = new { payment.IsConfirmed };

        payment.IsConfirmed = request.IsConfirmed;

        await unitOfWork.Payments.UpdateAsync(payment);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(
            null,
            AuditActions.ConfirmPayment,
            nameof(Payment),
            id,
            oldValues,
            new { request.IsConfirmed }
        );

        await cache.RemoveByPrefixAsync(PaymentCachePrefix);

        logger.LogInformation(
            "Payment confirmed: {PaymentId} IsConfirmed: {IsConfirmed}",
            id, request.IsConfirmed);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var payment = await unitOfWork.Payments.GetByIdAsync(id);
        if (payment is null)
            return Result<bool>.Fail("Payment not found");

        if (payment.IsConfirmed)
            return Result<bool>.Fail("Cannot delete confirmed payment", ErrorType.BadRequest);

        var studentId = payment.StudentId;

        await unitOfWork.Payments.DeleteAsync(payment);
        await unitOfWork.SaveChangesAsync();

        // пересчитываем баланс после удаления
        await RecalculateStudentBalanceAsync(studentId);

        await auditLogService.LogAsync(
            null,
            AuditActions.DeletePayment,
            nameof(Payment),
            id,
            oldValues: new { payment.Amount, payment.Type, payment.StudentId }
        );

        await cache.RemoveByPrefixAsync(PaymentCachePrefix);
        await cache.RemoveByPrefixAsync(StudentCachePrefix);

        logger.LogInformation("Payment deleted: {PaymentId}", id);

        return Result<bool>.Ok(true);
    }

    public async Task<Result<PaymentResponse>> SetReceiptAsync(
        int paymentId,
        IFormFile receiptFile,
        int uploadedByUserId)
    {
        var payment = await unitOfWork.Payments.GetByIdAsync(paymentId);
        if (payment is null)
            return Result<PaymentResponse>.Fail("Payment not found");

        var file = await fileStorage.UploadAsync(
            receiptFile,
            FileOwnerType.PaymentReceipt,
            paymentId,
            uploadedByUserId);

        payment.ReceiptUrl = file.Url;

        await unitOfWork.Payments.UpdateAsync(payment);
        await unitOfWork.SaveChangesAsync();

        await auditLogService.LogAsync(
            uploadedByUserId,
            AuditActions.UploadPaymentReceipt,
            nameof(Payment),
            paymentId,
            newValues: new { file.Url }
        );

        await cache.RemoveByPrefixAsync(PaymentCachePrefix);

        logger.LogInformation("Receipt set: {PaymentId}", paymentId);

        var updated = await unitOfWork.Payments.GetByIdAsync(paymentId);
        return Result<PaymentResponse>.Ok(MapToResponse(updated!));
    }

    // ─── PRIVATE ──────────────────────────────────────────────────────────

    private async Task RecalculateStudentBalanceAsync(int studentId)
    {
        // пересчитываем сумму всех платежей студента
        var newBalance = await unitOfWork.Payments.GetStudentBalanceAsync(studentId);

        // получаем студента для обновления
        var student = await unitOfWork.Students.GetByIdAsync(studentId);
        if (student is null) return;

        // используем твой существующий UpdateAsync
        student.Balance = newBalance;
        await unitOfWork.Students.UpdateAsync(student);
        await unitOfWork.SaveChangesAsync();

        logger.LogInformation(
            "Student balance recalculated: StudentId {StudentId} Balance {Balance}",
            studentId, newBalance);
    }

    private static PaymentResponse MapToResponse(Payment p) => new()
    {
        Id = p.Id,
        StudentId = p.StudentId,
        StudentFullName = p.Student?.User?.FullName ?? "",
        GroupId = p.GroupId,
        GroupName = p.Group?.Name ?? "",
        Amount = p.Amount,
        Type = p.Type.ToString(),
        Method = p.Method.ToString(),
        Date = p.Date,
        DueDate = p.DueDate,
        IsConfirmed = p.IsConfirmed,
        Note = p.Note,
        ReceiptUrl = p.ReceiptUrl,
        CreatedByUserId = p.CreatedByUserId,
        CreatedByFullName = p.CreatedByUser?.FullName,
        CreatedAt = p.CreatedAt
    };

    private static PaymentListItemResponse MapToListItem(Payment p) => new()
    {
        Id = p.Id,
        StudentId = p.StudentId,
        StudentFullName = p.Student?.User?.FullName ?? "",
        GroupId = p.GroupId,
        GroupName = p.Group?.Name ?? "",
        Amount = p.Amount,
        Type = p.Type.ToString(),
        Method = p.Method.ToString(),
        Date = p.Date,
        IsConfirmed = p.IsConfirmed,
        CreatedAt = p.CreatedAt
    };
}