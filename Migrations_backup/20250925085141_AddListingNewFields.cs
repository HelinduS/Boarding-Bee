using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoardingBee_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddListingNewFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AmenitiesCsv",
                table: "Listings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AvailabilityStatus",
                table: "Listings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ContactEmail",
                table: "Listings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPhone",
                table: "Listings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "Listings",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Facilities",
                table: "Listings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImagesCsv",
                table: "Listings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUpdated",
                table: "Listings",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "OwnerId",
                table: "Listings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Listings",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AmenitiesCsv",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "AvailabilityStatus",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "ContactEmail",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "ContactPhone",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "Facilities",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "ImagesCsv",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "LastUpdated",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Listings");
        }
    }
}
