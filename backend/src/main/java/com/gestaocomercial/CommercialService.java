package com.gestaocomercial;

import com.gestaocomercial.Models.NewProductRequest;
import com.gestaocomercial.Models.Product;
import com.gestaocomercial.Models.Sale;
import com.gestaocomercial.Models.SaleItem;
import com.gestaocomercial.Models.SaleLineRequest;
import com.gestaocomercial.Models.SaleRequest;
import com.gestaocomercial.Models.StockMovement;
import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommercialService {
    private static final String PRODUCT_COLUMNS = "id, name, category, price, stock, min_stock, sku";
    private final JdbcTemplate jdbc;

    public CommercialService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Bean
    ApplicationRunner seedProducts(JdbcTemplate jdbc) {
        return args -> {
            if (jdbc.queryForObject("SELECT COUNT(*) FROM products", Integer.class) != 0) return;
            seed(jdbc, "Arroz 5 kg", "Mercearia", "MER-001", "25.90", 15, 5);
            seed(jdbc, "Feijão 1 kg", "Mercearia", "MER-002", "8.50", 20, 5);
            seed(jdbc, "Açúcar 1 kg", "Mercearia", "MER-003", "4.90", 12, 5);
            seed(jdbc, "Café 500 g", "Bebidas", "BEB-004", "18.90", 8, 10);
            seed(jdbc, "Leite 1 L", "Laticínios", "LAT-005", "5.50", 30, 5);
        };
    }

    private static void seed(JdbcTemplate jdbc, String name, String category, String sku,
                             String price, int stock, int minStock) {
        jdbc.update("INSERT INTO products (name, name_key, category, sku, price, stock, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)",
                name, name.toLowerCase(Locale.ROOT), category, sku, new BigDecimal(price), stock, minStock);
    }

    public List<Product> products() {
        return jdbc.query("SELECT " + PRODUCT_COLUMNS + " FROM products ORDER BY id", (rs, row) -> new Product(
                rs.getLong("id"), rs.getString("name"), rs.getString("category"), rs.getBigDecimal("price"),
                rs.getInt("stock"), rs.getInt("min_stock"), rs.getString("sku")));
    }

    @Transactional
    public Product addProduct(NewProductRequest request) {
        String name = request.name().trim();
        String category = request.category().trim();
        String sku = "NOV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        GeneratedKeyHolder keys = new GeneratedKeyHolder();
        try {
            jdbc.update(connection -> {
                PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO products (name, name_key, category, sku, price, stock, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        Statement.RETURN_GENERATED_KEYS);
                statement.setString(1, name);
                statement.setString(2, name.toLowerCase(Locale.ROOT));
                statement.setString(3, category);
                statement.setString(4, sku);
                statement.setBigDecimal(5, request.price());
                statement.setInt(6, request.stock());
                statement.setInt(7, 5);
                return statement;
            }, keys);
        } catch (DuplicateKeyException exception) {
            throw new ConflictException("Já existe um produto com esse nome.");
        }
        long id = keys.getKey().longValue();
        return new Product(id, name, category, request.price(), request.stock(), 5, sku);
    }

    @Transactional
    public Sale confirmSale(SaleRequest request) {
        Set<Long> uniqueIds = new HashSet<>();
        for (SaleLineRequest line : request.items()) {
            if (!uniqueIds.add(line.productId())) throw new ConflictException("O carrinho contém produtos duplicados. Revise a venda.");
        }

        Map<Long, Product> lockedProducts = new HashMap<>();
        request.items().stream().sorted(Comparator.comparing(SaleLineRequest::productId)).forEach(line -> {
            List<Product> matches = jdbc.query("SELECT " + PRODUCT_COLUMNS + " FROM products WHERE id = ? FOR UPDATE",
                    (rs, row) -> new Product(rs.getLong("id"), rs.getString("name"), rs.getString("category"),
                            rs.getBigDecimal("price"), rs.getInt("stock"), rs.getInt("min_stock"), rs.getString("sku")),
                    line.productId());
            if (matches.isEmpty()) throw new NotFoundException("Produto não encontrado.");
            Product product = matches.getFirst();
            if (line.quantity() > product.stock()) throw new ConflictException("Estoque insuficiente. Verifique a quantidade selecionada.");
            lockedProducts.put(product.id(), product);
        });

        List<SaleItem> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (SaleLineRequest line : request.items()) {
            Product product = lockedProducts.get(line.productId());
            BigDecimal subtotal = product.price().multiply(BigDecimal.valueOf(line.quantity()));
            items.add(new SaleItem(product.id(), product.name(), line.quantity(), product.price(), subtotal));
            total = total.add(subtotal);
        }

        String id = "VEN-" + UUID.randomUUID();
        String date = Instant.now().toString();
        jdbc.update("INSERT INTO sales (id, date, total) VALUES (?, ?, ?)", id, date, total);
        for (SaleItem item : items) {
            jdbc.update("INSERT INTO sale_items (sale_id, product_id, name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
                    id, item.productId(), item.name(), item.quantity(), item.unitPrice(), item.subtotal());
            jdbc.update("UPDATE products SET stock = stock - ? WHERE id = ?", item.quantity(), item.productId());
            jdbc.update("INSERT INTO stock_movements (product_id, quantity, type, date, sale_id) VALUES (?, ?, 'saida', ?, ?)",
                    item.productId(), item.quantity(), date, id);
        }
        return new Sale(id, date, items, total);
    }

    public Sale latestSale() {
        List<String> ids = jdbc.queryForList("SELECT id FROM sales ORDER BY date DESC, id DESC LIMIT 1", String.class);
        if (ids.isEmpty()) throw new NotFoundException("Nenhuma venda encontrada.");
        return sale(ids.getFirst());
    }

    public Sale sale(String id) {
        List<Sale> sales = jdbc.query("SELECT id, date, total FROM sales WHERE id = ?",
                (rs, row) -> new Sale(rs.getString("id"), rs.getString("date"), List.of(), rs.getBigDecimal("total")), id);
        if (sales.isEmpty()) throw new NotFoundException("Venda não encontrada.");
        Sale header = sales.getFirst();
        List<SaleItem> items = jdbc.query("SELECT product_id, name, quantity, unit_price, subtotal FROM sale_items WHERE sale_id = ? ORDER BY product_id",
                (rs, row) -> new SaleItem(rs.getLong("product_id"), rs.getString("name"), rs.getInt("quantity"),
                        rs.getBigDecimal("unit_price"), rs.getBigDecimal("subtotal")), id);
        return new Sale(header.id(), header.date(), items, header.total());
    }

    public List<StockMovement> movements() {
        return jdbc.query("SELECT product_id, quantity, type, date, sale_id FROM stock_movements ORDER BY id DESC",
                (rs, row) -> new StockMovement(rs.getLong("product_id"), rs.getInt("quantity"),
                        rs.getString("type"), rs.getString("date"), rs.getString("sale_id")));
    }

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) { super(message); }
    }

    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) { super(message); }
    }
}
