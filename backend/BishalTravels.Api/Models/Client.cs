using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BishalTravels.Api.Models;

[Table("clients")]
public class Client
{
    [Key]
    [MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string CompanyName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Gstin { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Pan { get; set; }

    [Required]
    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Phone { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ContractRefNo { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? ContractStartDate { get; set; }

    [MaxLength(30)]
    public string? ContractEndDate { get; set; }

    public int PaymentTermsDays { get; set; } = 30;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<DutySlip> DutySlips { get; set; } = new List<DutySlip>();

    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
