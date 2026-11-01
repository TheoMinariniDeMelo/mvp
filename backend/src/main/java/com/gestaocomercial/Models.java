package com.gestaocomercial;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public final class Models {
    private Models() { }

    public record Product(long id, String name, String category, BigDecimal price,
                          int stock, int minStock, String sku) { }

    public record NewProductRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Size(max = 80) String category,
            @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal price,
            @NotNull @PositiveOrZero Integer stock) { }

    public record SaleLineRequest(@NotNull @Positive Long productId,
                                  @NotNull @Positive Integer quantity) { }

    public record SaleRequest(@NotEmpty List<@Valid SaleLineRequest> items) { }

    public record SaleItem(long productId, String name, int quantity,
                           BigDecimal unitPrice, BigDecimal subtotal) { }

    public record Sale(String id, String date, List<SaleItem> items, BigDecimal total) { }

    public record StockMovement(long productId, int quantity, String type,
                                String date, String saleId) { }
}
