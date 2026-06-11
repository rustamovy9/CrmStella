using CrmStella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrmStella.Infrastructure.Persistence.Configurations;

public class GroupStudentConfiguration : IEntityTypeConfiguration<GroupStudent>
{
    public void Configure(EntityTypeBuilder<GroupStudent> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.Property(x => x.RemoveReason)
            .HasMaxLength(500);

        builder.HasIndex(x => new { x.GroupId, x.StudentId })
            .IsUnique()
            .HasFilter("\"IsActive\" = true");

        builder.HasOne(x => x.Group)
            .WithMany(x => x.GroupStudents)
            .HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Student)
            .WithMany(x => x.GroupStudents)
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.TransferredFrom)
            .WithOne()
            .HasForeignKey<GroupStudent>(x => x.TransferredFromGroupStudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.TransferredTo)
            .WithOne()
            .HasForeignKey<GroupStudent>(x => x.TransferredToGroupStudentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}