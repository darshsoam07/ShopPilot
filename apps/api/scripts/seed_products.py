from decimal import Decimal

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.product import Product

LEGACY_NOVA_PHOTO = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900"
INHERITED_NOVA_PHOTOS = {
    LEGACY_NOVA_PHOTO, "/demo/nova.jpg",
    *(f"/demo/nova-detail-{i}.jpg" for i in range(1, 5)),
}

SAMPLE_PRODUCTS = [
    {
        "name": "AeroBook Pro 14",
        "slug": "aerobook-pro-14",
        "description": "A lightweight development laptop with 16 GB RAM and a 512 GB SSD.",
        "category": "Workstation",
        "family": "aerobook-pro-14",
        "brand": "AeroBook",
        "specifications": {"Configuration": "14-inch · 16 GB", "RAM": "16 GB", "Storage": "512 GB SSD"},
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
        "image_url": LEGACY_NOVA_PHOTO,
    },
    {
        "name": "Pulse Smartwatch 2",
        "slug": "pulse-smartwatch-2",
        "description": "Fitness-focused smartwatch with heart-rate and sleep tracking features.",
        "category": "Wearables",
        "family": "pulse-smartwatch",
        "brand": "Pulse",
        "specifications": {"Configuration": "Standard", "Finish": "Graphite", "Display": "Touch", "Tracking": "Heart rate and sleep"},
        "sku": "WAT-PULSE-002",
        "price": Decimal("7999.00"),
        "stock_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85",
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
    option.update(image_url={
        "ALB": "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=85",
        "PRO": "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=85",
        "CARE2": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=85",
        "CARE3": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85",
    }[suffix], gallery_images=[])
    SAMPLE_PRODUCTS.append(option)


# Additional studio catalogue: each item is a sellable SKU with its own media.
def _studio_image(photo_id: str) -> str:
    return f"https://images.unsplash.com/{photo_id}?auto=format&fit=crop&w=1200&q=85"


EXTRA_PRODUCTS = [
    {
        "name": "Arc Mechanical Keyboard · Carbon", "slug": "arc-keyboard-carbon",
        "description": "A compact mechanical keyboard with tactile switches and a USB-C connection.",
        "category": "Accessories", "sku": "ACC-ARC-001", "family": "arc-keyboard", "brand": "Arc",
        "price": Decimal("6999.00"), "stock_quantity": 16,
        "image_url": _studio_image("photo-1587829741301-dc798b83add3"), "gallery_images": [],
        "specifications": {"Layout": "75%", "Finish": "Carbon", "Switch": "Tactile", "Connection": "USB-C"},
    },
    {
        "name": "Arc Mechanical Keyboard · Alabaster", "slug": "arc-keyboard-alabaster",
        "description": "The Arc hot-swappable keyboard in an Alabaster finish.",
        "category": "Accessories", "sku": "ACC-ARC-ALB", "family": "arc-keyboard", "brand": "Arc",
        "price": Decimal("7299.00"), "stock_quantity": 11,
        "image_url": _studio_image("photo-1541140532154-b024d705b90a"), "gallery_images": [],
        "specifications": {"Layout": "75%", "Finish": "Alabaster", "Switch": "Tactile", "Connection": "USB-C"},
    },
    {
        "name": "Arc Mechanical Keyboard · Tenkeyless", "slug": "arc-keyboard-tkl",
        "description": "A tenkeyless Arc configuration for a smaller desk footprint.",
        "category": "Accessories", "sku": "ACC-ARC-TKL", "family": "arc-keyboard", "brand": "Arc",
        "price": Decimal("6499.00"), "stock_quantity": 9,
        "image_url": _studio_image("photo-1595225476474-87563907a212"), "gallery_images": [],
        "specifications": {"Layout": "TKL", "Finish": "Carbon", "Switch": "Linear", "Connection": "USB-C"},
    },
    {
        "name": "Orbit Wireless Mouse · Graphite", "slug": "orbit-mouse-graphite",
        "description": "A wireless desktop mouse with a contoured shell and adjustable pointer sensitivity.",
        "category": "Accessories", "sku": "ACC-ORBIT-001", "family": "orbit-mouse", "brand": "Orbit",
        "price": Decimal("2499.00"), "stock_quantity": 30,
        "image_url": _studio_image("photo-1527814050087-3793815479db"), "gallery_images": [],
        "specifications": {"Configuration": "Standard", "Finish": "Graphite", "Connection": "2.4 GHz wireless"},
    },
    {
        "name": "Orbit Ergonomic Mouse · Stone", "slug": "orbit-mouse-stone",
        "description": "An ergonomic Orbit mouse with a sculpted vertical grip.",
        "category": "Accessories", "sku": "ACC-ORBIT-ERG", "family": "orbit-mouse", "brand": "Orbit",
        "price": Decimal("3299.00"), "stock_quantity": 14,
        "image_url": _studio_image("photo-1615663245857-ac93bb7c39e7"), "gallery_images": [],
        "specifications": {"Configuration": "Ergonomic", "Finish": "Stone", "Connection": "2.4 GHz wireless"},
    },
    {
        "name": "Halo Desk Lamp · Black", "slug": "halo-desk-lamp-black",
        "description": "A directional desk lamp with a weighted base and adjustable shade.",
        "category": "Lighting", "sku": "LGT-HALO-001", "family": "halo-lamp", "brand": "Halo",
        "price": Decimal("3999.00"), "stock_quantity": 13,
        "image_url": _studio_image("photo-1507473885765-e6ed057f782c"), "gallery_images": [],
        "specifications": {"Configuration": "Adjustable", "Finish": "Matte black", "Light source": "LED"},
    },
    {
        "name": "Halo Desk Lamp · Warm metal", "slug": "halo-desk-lamp-warm-metal",
        "description": "The Halo adjustable desk lamp with a warm metal studio finish.",
        "category": "Lighting", "sku": "LGT-HALO-WARM", "family": "halo-lamp", "brand": "Halo",
        "price": Decimal("4499.00"), "stock_quantity": 7,
        "image_url": _studio_image("photo-1513506003901-1e6a229e2d15"), "gallery_images": [],
        "specifications": {"Configuration": "Adjustable", "Finish": "Warm metal", "Light source": "LED"},
    },
    {
        "name": "AeroBook Pro 14 · 32 GB", "slug": "aerobook-pro-14-32gb",
        "description": "A 14-inch development laptop with 32 GB memory and a 1 TB SSD.",
        "category": "Workstation", "sku": "LAP-AERO-016", "family": "aerobook-pro-14", "brand": "AeroBook",
        "price": Decimal("69999.00"), "stock_quantity": 6,
        "image_url": _studio_image("photo-1517336714731-489689fd1ca8"), "gallery_images": [],
        "specifications": {"Configuration": "14-inch · 32 GB", "RAM": "32 GB", "Storage": "1 TB SSD"},
    },
    {
        "name": "Pulse Smartwatch 3 · Silver", "slug": "pulse-smartwatch-3-silver",
        "description": "A silver smartwatch with a touch display and activity tracking.",
        "category": "Wearables", "sku": "WAT-PULSE-003", "family": "pulse-smartwatch", "brand": "Pulse",
        "price": Decimal("8999.00"), "stock_quantity": 10,
        "image_url": _studio_image("photo-1546868871-7041f2a55e12"), "gallery_images": [],
        "specifications": {"Configuration": "Standard", "Finish": "Silver", "Display": "Touch", "Tracking": "Heart rate and sleep"},
    },
]

SAMPLE_PRODUCTS.extend(EXTRA_PRODUCTS)



def main() -> None:
    with SessionLocal() as db:
        inserted = 0
        for item in SAMPLE_PRODUCTS:
            exists = db.scalar(select(Product).where(Product.sku == item["sku"]))
            if exists and exists.sku == "AUD-NOVA-ALB":
                if exists.family in (None, "", "nova") and (exists.specifications or {}).get("Finish") in (None, "", "Alabaster"):
                    if not exists.image_url or exists.image_url in INHERITED_NOVA_PHOTOS or (exists.image_url or "").startswith("https://placehold.co/"):
                        exists.image_url = item["image_url"]
                    gallery = [url for url in (exists.gallery_images or []) if url not in INHERITED_NOVA_PHOTOS]
                    if gallery != exists.gallery_images:
                        exists.gallery_images = gallery
                continue
            if exists and item.get("family") and item["sku"] != "AUD-NOVA-001" and exists.image_url in INHERITED_NOVA_PHOTOS:
                exists.image_url = item["image_url"]
                exists.gallery_images = item["gallery_images"]
            if exists and item.get("family") and not exists.family:
                exists.family = item["family"]
                exists.specifications = {**item["specifications"], **exists.specifications}
            if exists and ((exists.image_url or "").startswith("https://placehold.co/") or (
                item["sku"] == "WAT-PULSE-002" and (exists.image_url or "").endswith("baf30e?w=900")
            )):
                exists.image_url = item["image_url"]
            if not exists:
                db.add(Product(**item))
                inserted += 1
        db.commit()
    print(f"Seed complete. Inserted {inserted} product(s).")


if __name__ == "__main__":
    main()

