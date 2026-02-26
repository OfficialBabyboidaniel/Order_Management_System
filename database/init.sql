CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    game_name VARCHAR(255) NOT NULL,
    current_price VARCHAR(50) NOT NULL,
    steam_name VARCHAR(100) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    thread_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_id ON orders(order_id);
CREATE INDEX idx_user_id ON orders(user_id);
CREATE INDEX idx_created_at ON orders(created_at DESC);
