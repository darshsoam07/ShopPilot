from decimal import Decimal

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.product import Product

SAMPLE_PRODUCTS = [
    {
        "name": "AeroBook Pro 14",
        "slug": "aerobook-pro-14",
        "description": "A lightweight development laptop with 16 GB RAM and a 512 GB SSD.",
        "sku": "LAP-AERO-014",
        "price": Decimal("58999.00"),
        "stock_quantity": 12,
        "image_url": "https://placehold.co/640x480?text=AeroBook+Pro+14",
    },
    {
        "name": "Nova Wireless Headphones",
        "slug": "nova-wireless-headphones",
        "description": "Over-ear wireless headphones with active noise cancellation.",
        "sku": "AUD-NOVA-001",
        "price": Decimal("4999.00"),
        "stock_quantity": 35,
        "image_url": "https://placehold.co/640x480?text=Nova+Headphones",
    },
    {
        "name": "Pulse Smartwatch 2",
        "slug": "pulse-smartwatch-2",
        "description": "Fitness-focused smartwatch with heart-rate and sleep tracking features.",
        "sku": "WAT-PULSE-002",
        "price": Decimal("7999.00"),
        "stock_quantity": 20,
        "image_url": "https://placehold.co/640x480?text=Pulse+Smartwatch",
    },
]


def main() -> None:
    with SessionLocal() as db:
        inserted = 0
        for item in SAMPLE_PRODUCTS:
            exists = db.scalar(select(Product).where(Product.sku == item["sku"]))
            if not exists:
                db.add(Product(**item))
                inserted += 1
        db.commit()
    print(f"Seed complete. Inserted {inserted} product(s).")


if __name__ == "__main__":
    main()
