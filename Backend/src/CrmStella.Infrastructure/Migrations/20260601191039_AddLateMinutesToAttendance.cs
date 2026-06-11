using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CrmStella.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLateMinutesToAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LateMinutes",
                table: "Attendances",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LateMinutes",
                table: "Attendances");
        }
    }
}
