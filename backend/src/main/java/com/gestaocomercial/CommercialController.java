package com.gestaocomercial;

import com.gestaocomercial.Models.NewProductRequest;
import com.gestaocomercial.Models.Product;
import com.gestaocomercial.Models.Sale;
import com.gestaocomercial.Models.SaleRequest;
import com.gestaocomercial.Models.StockMovement;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CommercialController {
    private final CommercialService service;

    public CommercialController(CommercialService service) {
        this.service = service;
    }

    @GetMapping("/products")
    public List<Product> products() {
        return service.products();
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public Product addProduct(@Valid @RequestBody NewProductRequest request) {
        return service.addProduct(request);
    }

    @GetMapping("/sales/latest")
    public Sale latestSale() {
        return service.latestSale();
    }

    @GetMapping("/sales/{id}")
    public Sale sale(@PathVariable String id) {
        return service.sale(id);
    }

    @PostMapping("/sales")
    @ResponseStatus(HttpStatus.CREATED)
    public Sale confirmSale(@Valid @RequestBody SaleRequest request) {
        return service.confirmSale(request);
    }

    @GetMapping("/stock/movements")
    public List<StockMovement> movements() {
        return service.movements();
    }
}
