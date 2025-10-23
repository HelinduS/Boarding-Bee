using System;

using BoardingBee_backend.Models;
namespace BoardingBee_backend.Models
{
    public class Appointment
    {
        public int Id { get; set; }
        public int ListingId { get; set; }
    public string? ListingTitle { get; set; }
    public string? UserEmail { get; set; }
        public DateTime Date { get; set; }
    public string? Status { get; set; } // pending, confirmed, rejected

        // Relationship to User (the user who booked the appointment)
        public int UserId { get; set; }
    public User? User { get; set; }
    }
}
