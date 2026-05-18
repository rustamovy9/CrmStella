using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Payment.Request;
using EduCrm.Application.DTOs.Payment.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class PaymentService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IFileStorageService fileStorage,
    ILogger<PaymentService> logger) : IPaymentService
{
    private const string PaymentCachePrefix = "payments:";
    private const string PaymentListCacheKey = "payments:list";

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

        // Verify student exists
        var student = await unitOfWork.Students.GetByIdAsync(studentId);
        if (student is null)
        {
            logger.LogWarning("GetStudentBalance failed - student not found: {StudentId}", studentId);
            return Result<StudentBalanceResponse>.Fail("Student not found");
        }

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
        // Validate student
        var student = await unitOfWork.Students.GetByIdAsync(request.StudentId);
        if (student is null)
        {
            logger.LogWarning("CreatePayment failed - student not found: {StudentId}", request.StudentId);
            return Result<PaymentResponse>.Fail("Student not found");
        }

        // Validate group
        var group = await unitOfWork.Groups.GetByIdAsync(request.GroupId);
        if (group is null)
        {
            logger.LogWarning("CreatePayment failed - group not found: {GroupId}", request.GroupId);
            return Result<PaymentResponse>.Fail("Group not found");
        }

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

        // Upload receipt if provided
        if (request.Receipt is not null && request.Receipt.Length > 0)
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
            catch (ArgumentException ex)
            {
                logger.LogWarning(ex, "Failed to upload receipt for payment: {PaymentId}", payment.Id);
            }

        // Update student balance in DB
        student.Balance = await unitOfWork.Payments.GetStudentBalanceAsync(student.Id);
        await unitOfWork.Students.UpdateAsync(student);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(PaymentCachePrefix);

        logger.LogInformation(
            "Payment created: {PaymentId} Student: {StudentId} Amount: {Amount}",
            payment.Id, payment.StudentId, payment.Amount);

        // Re-fetch to get navigation properties for mapping
        var created = await unitOfWork.Payments.GetByIdAsync(payment.Id);
        return Result<PaymentResponse>.Ok(MapToResponse(created!));
    }

    public async Task<Result<PaymentResponse>> UpdateAsync(int id, UpdatePaymentRequest request)
    {
        var payment = await unitOfWork.Payments.GetByIdAsync(id);
        if (payment is null)
        {
            logger.LogWarning("UpdatePayment failed - not found: {PaymentId}", id);
            return Result<PaymentResponse>.Fail("Payment not found");
        }

        if (payment.IsConfirmed)
        {
            logger.LogWarning("UpdatePayment failed - payment already confirmed: {PaymentId}", id);
            return Result<PaymentResponse>.Fail(
                "Cannot update a confirmed payment", ErrorType.BadRequest);
        }

        if (request.Amount is not null) payment.Amount = request.Amount.Value;
        if (request.Type is not null) payment.Type = request.Type.Value;
        if (request.Method is not null) payment.Method = request.Method.Value;
        if (request.DueDate is not null) payment.DueDate = request.DueDate;
        if (request.Note is not null) payment.Note = request.Note.Trim();

        await unitOfWork.Payments.UpdateAsync(payment);
        await unitOfWork.SaveChangesAsync();

        // Recalculate balance if amount changed
        if (request.Amount is not null)
        {
            var student = await unitOfWork.Students.GetByIdAsync(payment.StudentId);
            if (student is not null)
            {
                student.Balance = await unitOfWork.Payments.GetStudentBalanceAsync(student.Id);
                await unitOfWork.Students.UpdateAsync(student);
                await unitOfWork.SaveChangesAsync();
            }
        }

        await cache.RemoveByPrefixAsync(PaymentCachePrefix);

        logger.LogInformation("Payment updated: {PaymentId}", id);

        return Result<PaymentResponse>.Ok(MapToResponse(payment));
    }


    public async Task<Result<bool>> ConfirmAsync(int id, ConfirmPaymentRequest request)
    {
        var payment = await unitOfWork.Payments.GetByIdAsync(id);
        if (payment is null)
        {
            logger.LogWarning("ConfirmPayment failed - not found: {PaymentId}", id);
            return Result<bool>.Fail("Payment not found");
        }

        payment.IsConfirmed = request.IsConfirmed;

        await unitOfWork.Payments.UpdateAsync(payment);
        await unitOfWork.SaveChangesAsync();

        await cache.RemoveByPrefixAsync(PaymentCachePrefix);

        logger.LogInformation(
            "Payment confirmation changed: {PaymentId} IsConfirmed: {IsConfirmed}",
            id, request.IsConfirmed);

        return Result<bool>.Ok(true);
    }


    public async Task<Result<PaymentResponse>> SetReceiptAsync(
        int paymentId,
        IFormFile receiptFile,
        int uploadedByUserId)
    {
        var payment = await unitOfWork.Payments.GetByIdAsync(paymentId);
        if (payment is null)
        {
            logger.LogWarning("SetReceipt failed - payment not found: {PaymentId}", paymentId);
            return Result<PaymentResponse>.Fail("Payment not found");
        }

        try
        {
            // Delete old receipt if exists
            if (!string.IsNullOrEmpty(payment.ReceiptUrl))
            {
                var oldFile = await unitOfWork.Files.GetByOwnerAsync(
                    FileOwnerType.PaymentReceipt,
                    paymentId);

                if (oldFile is not null)
                    try
                    {
                        await fileStorage.DeleteAsync(oldFile.Id);
                        logger.LogInformation("Old receipt deleted: {PaymentId}", paymentId);
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "Failed to delete old receipt: {PaymentId}", paymentId);
                        // Not critical — continue
                    }
            }

            // Upload new receipt
            var newFile = await fileStorage.UploadAsync(
                receiptFile,
                FileOwnerType.PaymentReceipt,
                paymentId,
                uploadedByUserId);

            payment.ReceiptUrl = newFile.Url;

            await unitOfWork.Payments.UpdateAsync(payment);
            await unitOfWork.SaveChangesAsync();

            await cache.RemoveByPrefixAsync(PaymentCachePrefix);

            logger.LogInformation(
                "Payment receipt set: {PaymentId} - {Url}", paymentId, newFile.Url);

            return Result<PaymentResponse>.Ok(MapToResponse(payment));
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "SetReceipt validation failed: {PaymentId}", paymentId);
            return Result<PaymentResponse>.Fail(ex.Message, ErrorType.BadRequest);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SetReceipt error: {PaymentId}", paymentId);
            return Result<PaymentResponse>.Fail("Could not set payment receipt", ErrorType.Unknown);
        }
    }


    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var payment = await unitOfWork.Payments.GetByIdAsync(id);
        if (payment is null)
        {
            logger.LogWarning("DeletePayment failed - not found: {PaymentId}", id);
            return Result<bool>.Fail("Payment not found");
        }

        if (payment.IsConfirmed)
        {
            logger.LogWarning("DeletePayment blocked - payment confirmed: {PaymentId}", id);
            return Result<bool>.Fail(
                "Cannot delete a confirmed payment", ErrorType.BadRequest);
        }

        var studentId = payment.StudentId;

        await unitOfWork.Payments.DeleteAsync(payment);
        await unitOfWork.SaveChangesAsync();

        // Recalculate balance after deletion
        var student = await unitOfWork.Students.GetByIdAsync(studentId);
        if (student is not null)
        {
            student.Balance = await unitOfWork.Payments.GetStudentBalanceAsync(studentId);
            await unitOfWork.Students.UpdateAsync(student);
            await unitOfWork.SaveChangesAsync();
        }

        await cache.RemoveByPrefixAsync(PaymentCachePrefix);

        logger.LogInformation("Payment deleted: {PaymentId}", id);

        return Result<bool>.Ok(true);
    }

    private static PaymentResponse MapToResponse(Payment p)
    {
        return new PaymentResponse
        {
            Id = p.Id,
            StudentId = p.StudentId,
            StudentFullName = p.Student?.User?.FullName ?? string.Empty,
            GroupId = p.GroupId,
            GroupName = p.Group?.Name ?? string.Empty,
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
    }

    private static PaymentListItemResponse MapToListItem(Payment p)
    {
        return new PaymentListItemResponse
        {
            Id = p.Id,
            StudentId = p.StudentId,
            StudentFullName = p.Student?.User?.FullName ?? string.Empty,
            GroupId = p.GroupId,
            GroupName = p.Group?.Name ?? string.Empty,
            Amount = p.Amount,

            Type = p.Type.ToString(),
            Method = p.Method.ToString(),

            Date = p.Date,
            IsConfirmed = p.IsConfirmed,
            CreatedAt = p.CreatedAt
        };
    }
}