using Xunit;
using BishalTravels.Api.Services;

namespace BishalTravels.Tests;

public class CalculationServiceTests
{
    private readonly CalculationService _service = new();

    [Fact]
    public void CalculateTripMetrics_ComputesKmAndOvertimeCorrectly()
    {
        // 10,000 km to 10,250 km = 250 km
        // 08:00 to 20:00 = 12 hours (2 hours overtime given 10 standard hours)
        var (totalKm, totalHours, extraHours) = _service.CalculateTripMetrics(
            10000m, 10250m, "08:00", "20:00", 10.0m);

        Assert.Equal(250m, totalKm);
        Assert.Equal(12.0m, totalHours);
        Assert.Equal(2.0m, extraHours);
    }

    [Fact]
    public void CalculateTripMetrics_HandlesOvernightTripCorrectly()
    {
        // 22:00 to 06:00 next day = 8 hours
        var (totalKm, totalHours, extraHours) = _service.CalculateTripMetrics(
            5000m, 5180m, "22:00", "06:00", 10.0m);

        Assert.Equal(180m, totalKm);
        Assert.Equal(8.0m, totalHours);
        Assert.Equal(0.0m, extraHours);
    }

    [Fact]
    public void CalculateTripMetrics_CeilsFractionalHoursAndOvertimeToNextWholeHour()
    {
        // Case 1: 14.83 hours duty (08:00 to 22:50 = 14h 50m) -> 15 total hours, 3 overtime hours beyond 12 standard hours
        var (_, hours1, ot1) = _service.CalculateTripMetrics(0, 100, "08:00", "22:50", 12.0m);
        Assert.Equal(15.0m, hours1);
        Assert.Equal(3.0m, ot1);

        // Case 2: 14.01 hours duty (08:00 to 22:01 = 14h 1m) -> 15 total hours, 3 overtime hours beyond 12 standard hours
        var (_, hours2, ot2) = _service.CalculateTripMetrics(0, 100, "08:00", "22:01", 12.0m);
        Assert.Equal(15.0m, hours2);
        Assert.Equal(3.0m, ot2);

        // Case 3: 2.83 overtime hours (08:00 to 20:50 = 12h 50m with 10 standard hours) -> 13 total hours, 3 overtime hours
        var (_, hours3, ot3) = _service.CalculateTripMetrics(0, 100, "08:00", "20:50", 10.0m);
        Assert.Equal(13.0m, hours3);
        Assert.Equal(3.0m, ot3);

        // Case 4: 2.01 overtime hours (08:00 to 20:01 = 12h 1m with 10 standard hours) -> 13 total hours, 3 overtime hours
        var (_, hours4, ot4) = _service.CalculateTripMetrics(0, 100, "08:00", "20:01", 10.0m);
        Assert.Equal(13.0m, hours4);
        Assert.Equal(3.0m, ot4);

        // Case 5: Exact 14.00 hours duty (08:00 to 22:00 = exactly 14h 0m with 12 standard hours) -> exactly 14 total hours, 2 overtime hours
        var (_, hours5, ot5) = _service.CalculateTripMetrics(0, 100, "08:00", "22:00", 12.0m);
        Assert.Equal(14.0m, hours5);
        Assert.Equal(2.0m, ot5);
    }

    [Fact]
    public void CalculateInvoiceFinancials_ComputesIntrastateGstAndTdsCorrectly()
    {
        // Subtotal: 50,000, GST: 5% (Intrastate -> 2.5% CGST + 2.5% SGST), TDS: 2%, Advance: 10,000
        var (subtotal, cgst, sgst, igst, tdsAmount, grandTotal, netPayable, words) = 
            _service.CalculateInvoiceFinancials(
                itemsSubtotal: 50000m,
                taxType: "GST_5",
                taxRate: 5.0m,
                isInterstate: false,
                discount: 0m,
                advanceReceived: 10000m,
                tdsRate: 2.0m);

        Assert.Equal(50000m, subtotal);
        Assert.Equal(1250m, cgst);
        Assert.Equal(1250m, sgst);
        Assert.Equal(0m, igst);
        Assert.Equal(1000m, tdsAmount);
        Assert.Equal(52500m, grandTotal);
        // Net payable = 52,500 - 10,000 (adv) - 1,000 (tds) = 41,500
        Assert.Equal(41500m, netPayable);
        Assert.Contains("Rupees Forty One Thousand Five Hundred Only", words);
    }

    [Fact]
    public void CalculateInvoiceFinancials_ComputesInterstateIgstCorrectly()
    {
        // Subtotal: 100,000, GST: 12% (Interstate -> 12% IGST, 0 CGST, 0 SGST)
        var (subtotal, cgst, sgst, igst, tdsAmount, grandTotal, netPayable, words) = 
            _service.CalculateInvoiceFinancials(
                itemsSubtotal: 100000m,
                taxType: "GST_12",
                taxRate: 12.0m,
                isInterstate: true,
                discount: 5000m,
                advanceReceived: 0m,
                tdsRate: 0m);

        // After discount: 95,000
        Assert.Equal(95000m, subtotal);
        Assert.Equal(0m, cgst);
        Assert.Equal(0m, sgst);
        Assert.Equal(11400m, igst);
        Assert.Equal(106400m, grandTotal);
        Assert.Equal(106400m, netPayable);
        Assert.Contains("Rupees One Lakh Six Thousand Four Hundred Only", words);
    }

    [Fact]
    public void ConvertToIndianCurrencyWords_ConvertsIndianRupeesCorrectly()
    {
        var words = _service.ConvertToIndianCurrencyWords(44982.50m);
        Assert.Equal("Rupees Forty Four Thousand Nine Hundred Eighty Two and Fifty Paise Only", words);
    }
}
