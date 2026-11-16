from decimal import Decimal

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.product import Product

SAMPLE_PRODUCTS = [
    {
        "name": "AeroBook Pro 14",
        "slug": "aerobook-pro-14",
        "description": "A lightweight development laptop with 16 GB RAM and a 512 GB SSD.",
        "category": "Workstation",
        "specifications": {"RAM": "16 GB", "Storage": "512 GB SSD"},
        "sku": "LAP-AERO-014",
        "price": Decimal("58999.00"),
        "stock_quantity": 12,
        "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900",
    },
    {
        "name": "Nova Wireless Headphones",
        "slug": "nova-wireless-headphones",
        "description": "Over-ear wireless headphones with active noise cancellation.",
        "category": "Audio",
        "sku": "AUD-NOVA-001",
        "price": Decimal("4999.00"),
        "stock_quantity": 35,
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900",
    },
    {
        "name": "Pulse Smartwatch 2",
        "slug": "pulse-smartwatch-2",
        "description": "Fitness-focused smartwatch with heart-rate and sleep tracking features.",
        "category": "Wearables",
        "sku": "WAT-PULSE-002",
        "price": Decimal("7999.00"),
        "stock_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30e?w=900",
    },
]


# Each configuration is a separate sellable SKU with its own stock and invoice name.
base = SAMPLE_PRODUCTS[1]
base.update(image_url="/demo/nova.jpg", gallery_images=[f"/demo/nova-detail-{i}.jpg" for i in range(1, 5)], family="nova", brand="Nova", specifications={"Finish": "Obsidian", "Configuration": "Standard",
            "Protection": "None", "Fit": "Over-ear", "Connection": "Wireless", "Noise control": "Active"})
for suffix, finish, bundle, plan, extra in [
    ("ALB", "Alabaster", "Standard", "None", 0),
    ("PRO", "Obsidian", "Pro bundle", "None", 500),
    ("CARE2", "Obsidian", "Standard", "2 years", 250),
    ("CARE3", "Obsidian", "Standard", "3 years", 400),
]:
    option = {**base, "name": f"Nova Wireless Headphones · {finish}, {bundle}" + (f", {plan} care" if extra and plan != "None" else ""),
              "sku": f"AUD-NOVA-{suffix}", "slug": f"nova-wireless-{suffix.lower()}", "price": base["price"] + extra,
              "specifications": {**base["specifications"], "Finish": finish, "Configuration": bundle, "Protection": plan}}
    SAMPLE_PRODUCTS.append(option)


def main() -> None:
    with SessionLocal() as db:
        inserted = 0
        for item in SAMPLE_PRODUCTS:
            exists = db.scalar(select(Product).where(Product.sku == item["sku"]))
            if exists and item.get("family") and not exists.gallery_images and exists.image_url in {item["image_url"], "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900"}:
                exists.image_url = item["image_url"]
                exists.gallery_images = item["gallery_images"]
            if exists and item.get("family") and not exists.family:
                exists.family = item["family"]
                exists.specifications = {**item["specifications"], **exists.specifications}
            if exists and (exists.image_url or "").startswith("https://placehold.co/"):
                exists.image_url = item["image_url"]
            if not exists:
                db.add(Product(**item))
                inserted += 1
        db.commit()
    print(f"Seed complete. Inserted {inserted} product(s).")


if __name__ == "__main__":
    main()

