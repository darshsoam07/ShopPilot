import re
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, select

from app.models.product import Product
from app.schemas.assistant import AgentToolAction, AssistantQueryResponse
from app.services import cart_service, product_service


def response(tool, reply, products=(), *, status="executed", payload=None, prompts=()):
    return AssistantQueryResponse(
        reply=reply, recommended_products=list(products), follow_up_prompts=list(prompts),
        action=AgentToolAction(tool_name=tool, status=status, summary=reply, payload=payload or {}),
    )


def run(db, user, request):
    message = request.message.strip().lower()
    context = request.context
    active = None
    if context and context.active_product_id:
        active = product_service.get_active_product(db, context.active_product_id)

    # Mutate only on an explicit imperative with an unambiguous target.
    add = re.fullmatch(r"(?:please )?add (.+?) to (?:my |the )?cart[.!]?", message)
    if add or message in {"add to cart", "buy this"}:
        target = active
        if add and add[1] not in {"it", "this", "this item", "this product"}:
            matches = db.scalars(select(Product).where(
                Product.is_active.is_(True), func.lower(Product.name) == add[1]
            ).limit(2)).all()
            target = matches[0] if len(matches) == 1 else None
        if target is None:
            return response("add_to_cart", "Open the product or give its full name.", status="skipped")
        if user is None:
            return response("add_to_cart", "Sign in to add this item.", [target], status="requires_auth")
        try:
            cart = cart_service.add_item(db, user.id, target.id, 1)
        except HTTPException as error:
            return response("add_to_cart", error.detail, [target], status="failed")
        return response("add_to_cart", f"Added one {target.name} to your cart.", [target],
                        payload={"product_id": target.id, "quantity": 1, "cart_id": cart.id,
                                 "item_count": sum(item.quantity for item in cart.items)})

    if active and re.search(r"\b(this|it|compare|stock|details|specs|alternatives)\b", message):
        alternatives = db.scalars(select(Product).where(
            Product.id != active.id, Product.is_active.is_(True), Product.stock_quantity > 0
        ).order_by(func.abs(Product.price - active.price), Product.id).limit(2)).all()
        reply = f"{active.name} costs ₹{active.price:,.2f}. {active.stock_quantity} in stock. {active.description}"
        for other in alternatives:
            reply += f" {other.name} costs ₹{other.price:,.2f}."
        return response("product_qa", reply, [active, *alternatives], prompts=["Add this to my cart"])

    compare = re.fullmatch(r"compare (.+?) (?:with|and|vs\.?) (.+?)[?]?", message)
    if compare:
        names = [compare[1], compare[2]]
        matches = db.scalars(select(Product).where(
            Product.is_active.is_(True), func.lower(Product.name).in_(names)
        ).order_by(Product.price, Product.id)).all()
        if len(matches) != 2 or len({p.name.lower() for p in matches}) != 2:
            return response("compare_products", "Give two distinct catalogue product names.", status="skipped")
        reply = " ".join(f"{p.name}: ₹{p.price:,.2f}, {p.stock_quantity} in stock. {p.description}" for p in matches)
        return response("compare_products", reply, matches)

    budget = context.max_budget if context else None
    match = re.search(r"\b(?:under|below|within|budget(?: of)?|less than|max)\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)", message)
    if "$" in message:
        return response("catalog_search", "Catalogue prices are in INR. What is your budget in rupees?", status="skipped")
    if match:
        amount = match[1].replace(",", "")
        if not amount or amount.startswith("."):
            return response("catalog_search", "Enter a budget in rupees.", status="skipped")
        budget = Decimal(amount)
        message = message[:match.start()] + message[match.end():]
    stop = set("find show me top best the for some products items currently what are in stock right now please recommend a an".split())
    query = " ".join(word for word in re.findall(r"\w+", message) if word not in stop)
    products, _ = product_service.list_products(db, query=query, category=context.active_category if context else None,
                                                max_price=budget, in_stock=True, sort="price_asc", limit=4)
    reply = "Here are the matching items, lowest price first." if products else "No in-stock products matched your search."
    return response("catalog_search", reply, products)
