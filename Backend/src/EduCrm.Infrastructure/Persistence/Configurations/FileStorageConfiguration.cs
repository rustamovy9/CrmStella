using EduCrm.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduCrm.Infrastructure.Persistence.Configurations;

public class FileStorageConfiguration : IEntityTypeConfiguration<FileStorage>
{
    public void Configure(EntityTypeBuilder<FileStorage> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.OriginalFileName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.StoredFileName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.FilePath)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.Url)
            .HasMaxLength(500);

        builder.Property(x => x.MimeType)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.Extension)
            .HasMaxLength(20);

        builder.Property(x => x.FileSize)
            .IsRequired();

        builder.Property(x => x.UploadedAt)
            .IsRequired();

        builder.Property(x => x.OwnerType)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.HasIndex(x => new { x.OwnerType, x.OwnerId });

        builder.HasOne(x => x.UploadedByUser)
            .WithMany()
            .HasForeignKey(x => x.UploadedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}