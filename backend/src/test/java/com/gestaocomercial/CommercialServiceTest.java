package com.gestaocomercial;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gestaocomercial.Models.NewProductRequest;
import com.gestaocomercial.Models.SaleLineRequest;
import com.gestaocomercial.Models.SaleRequest;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:commercial-test;DB_CLOSE_DELAY=-1")
class CommercialServiceTest {
    @Autowired CommercialService service;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void reset() {
        jdbc.update("DELETE FROM stock_movements");
        jdbc.update("DELETE FROM sale_items");
        jdbc.update("DELETE FROM sales");
        jdbc.update("DELETE FROM products WHERE id > 5");
        jdbc.update("UPDATE products SET stock = CASE id WHEN 1 THEN 15 WHEN 2 THEN 20 WHEN 3 THEN 12 WHEN 4 THEN 8 ELSE 30 END");
    }

    @Test
    void confirmsSaleWithServerPriceAndDeductsStock() {
        var sale = service.confirmSale(new SaleRequest(List.of(
                new SaleLineRequest(1L, 2), new SaleLineRequest(2L, 3))));

        assertThat(sale.total()).isEqualByComparingTo("77.30");
        assertThat(service.products().getFirst().stock()).isEqualTo(13);
        assertThat(service.sale(sale.id()).items()).hasSize(2);
        assertThat(service.movements()).hasSize(2);
    }

    @Test
    void insufficientStockDoesNotCreateSaleOrMovement() {
        assertThatThrownBy(() -> service.confirmSale(new SaleRequest(List.of(
                new SaleLineRequest(1L, 16))))).isInstanceOf(CommercialService.ConflictException.class);
        assertThat(service.products().getFirst().stock()).isEqualTo(15);
        assertThat(service.movements()).isEmpty();
        assertThatThrownBy(service::latestSale).isInstanceOf(CommercialService.NotFoundException.class);
    }

    @Test
    void rejectsDuplicateProductName() {
        assertThatThrownBy(() -> service.addProduct(new NewProductRequest(
                " arroz 5 KG ", "Mercearia", new BigDecimal("10.00"), 1)))
                .isInstanceOf(CommercialService.ConflictException.class);
    }
}
