"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import FireworksIntro from "./FireworksIntro";

type CartItem = Product & {
  quantity: number;
};

type Props = {
  products: Product[];
};

export default function Storefront({ products }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [notification, setNotification] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI">("Cash");

  const activeProducts = products.filter((product) => product.active);

  const categories = [
    "All",
    ...Array.from(
      new Set(activeProducts.map((product) => product.category))
    ).filter(Boolean),
  ];

  const filteredProducts = useMemo(() => {
    return activeProducts.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [activeProducts, search, selectedCategory]);

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  function addToCart(product: Product) {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    setNotification(`${product.name} added to cart`);

    setTimeout(() => {
      setNotification("");
    }, 2000);
  }

  function increaseQuantity(productId: string) {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== productId) {
          return item;
        }

        if (item.quantity >= item.stock) {
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      })
    );
  }

  function decreaseQuantity(productId: string) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId: string) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  }

  async function placeOrder() {
    if (
      !customerName.trim() ||
      !phone.trim() ||
      !address.trim()
    ) {
      alert("Please fill in all customer details.");
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          phone,
          address,
          paymentMethod,
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to place order.");
      }

      alert(
        `Order placed successfully!\n\nOrder ID: ${data.orderId}\nTotal: ₹${data.total}`
      );

      setCart([]);
      setShowCheckout(false);
      setShowCart(false);

      setCustomerName("");
      setPhone("");
      setAddress("");
      setPaymentMethod("Cash");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to place order."
      );
    }
  }

  return (
    <>
    <FireworksIntro />

    <main className="min-h-screen bg-[#f8f4eb] text-[#172033] pb-2">

      {/* ================= HEADER ================= */}

      <header className="sticky top-0 z-40 border-b border-[#e7dfcf] bg-[#f8f4eb]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✦</span>

              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                FireStore✨🎆
              </h1>
            </div>

            <p className="mt-0.5 hidden text-xs text-[#7b7467] sm:block">
              Quality crackers for every celebration
            </p>
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="flex items-center gap-2 rounded-full bg-[#172033] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#252f45] active:scale-95 sm:px-5"
          >
            <span>🛒</span>
            <span>Cart</span>

            {cartCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#d5b56b] px-1.5 text-xs font-bold text-[#172033]">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ================= HERO ================= */}

      <section className="px-5 pt-6 sm:px-8 sm:pt-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#172033] shadow-xl">

          <div className="relative overflow-hidden px-7 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">

            {/* Decorative elements */}
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-[#d5b56b]/20" />
            <div className="absolute -right-5 -top-5 h-28 w-28 rounded-full border border-[#d5b56b]/20" />

            <div className="absolute bottom-[-60px] right-[25%] h-36 w-36 rounded-full border border-[#d5b56b]/10" />

            <div className="relative max-w-2xl">

              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#d5b56b]">
                Celebrate beautifully
              </p>

              <h2 className="text-4xl font-bold leading-tight tracking-tight text-[#fffaf0] sm:text-5xl lg:text-6xl">
                Light up your
                <span className="block text-[#d5b56b]">
                  celebrations ✨
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 text-[#d9d7d1] sm:text-lg">
                Explore our collection of crackers and festive favourites
                made for memorable celebrations with family and friends.
              </p>

              <button
                onClick={() => {
                  document
                    .getElementById("products")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-8 rounded-full bg-[#d5b56b] px-7 py-3.5 text-sm font-bold text-[#172033] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#e0c27f] active:scale-95"
              >
                Shop the collection
              </button>
            </div>

            <div className="absolute bottom-6 right-8 hidden text-7xl opacity-90 sm:block lg:right-16 lg:text-8xl">
              🎆
            </div>

            <div className="absolute right-28 top-8 hidden text-3xl sm:block">
              ✦
            </div>

            <div className="absolute bottom-14 right-52 hidden text-xl sm:block">
              ✧
            </div>
          </div>
        </div>
      </section>

      {/* ================= PRODUCTS ================= */}

      <section
        id="products"
        className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16"
      >

        {/* Section heading */}

        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#a08343]">
            Our collection
          </p>

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#172033] sm:text-4xl">
                Find your favourites
              </h2>

              <p className="mt-2 text-sm text-[#7b7467] sm:text-base">
                Browse our collection of {activeProducts.length} products.
              </p>
            </div>

            <p className="text-sm font-medium text-[#8b8375]">
              {filteredProducts.length} products
            </p>
          </div>
          
        </div>

        {/* ================= SEARCH ================= */}

        <div className="relative mb-5">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-lg text-[#928a7d]">
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#ded6c7] bg-white py-4 pl-12 pr-12 text-sm text-[#172033] shadow-sm outline-none transition placeholder:text-[#9c9589] focus:border-[#b69a5c] focus:ring-4 focus:ring-[#d5b56b]/10"
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full px-2 text-xl text-[#928a7d] transition hover:text-[#172033]"
            >
              ×
            </button>
          )}
        </div>

        {/* ================= CATEGORIES ================= */}

        <div className="mb-9 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                selectedCategory === category
                  ? "border-[#172033] bg-[#172033] text-white shadow-sm"
                  : "border-[#ded6c7] bg-white text-[#5d584f] hover:border-[#b9ad98] hover:bg-[#fcfaf5]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* ================= PRODUCT GRID ================= */}

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">

            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-[#e6dfd2] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >

                {/* Product image placeholder */}

                
<div className="relative flex h-40 items-center justify-center overflow-hidden bg-[#f2ede2] sm:h-48">
  {product.imageUrl ? (
    <img
      src={product.imageUrl}
      alt={product.name}
      loading="lazy"
      className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105"
    />
  ) : (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(213,181,107,0.15),_transparent_60%)]" />
      <span className="relative text-6xl transition duration-300 group-hover:scale-110 sm:text-7xl">
        🎆
      </span>
    </>
  )}

  {product.stock <= 0 && (
    <div className="absolute inset-0 flex items-center justify-center bg-[#172033]/70">
      <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#172033]">
        Out of stock
      </span>
    </div>
  )}
</div>

                {/* Product information */}

                <div className="p-4 sm:p-5">

                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a08343] sm:text-xs">
                    {product.category}
                  </p>

                  <h3 className="min-h-[44px] text-sm font-bold leading-5 text-[#172033] sm:text-base">
                    {product.name}
                  </h3>

                  <p className="mt-1.5 min-h-[20px] text-xs text-[#898174] sm:text-sm">
                    {product.unit}
                  </p>

                  <div className="mt-4 flex items-end justify-between gap-2">

                    <div>
                      <p className="text-lg font-bold text-[#172033] sm:text-xl">
                        ₹{product.price}
                      </p>
                    </div>

                    {product.stock > 0 && (
                      <span className="text-[10px] font-medium text-[#8b8375] sm:text-xs">
                        {product.stock} available
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="mt-4 w-full rounded-xl bg-[#172033] px-3 py-3 text-xs font-bold text-white transition hover:bg-[#273249] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#d9d5cd] sm:text-sm"
                  >
                    {product.stock > 0
                      ? "Add to Cart"
                      : "Out of Stock"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-[#e6dfd2] bg-white px-6 py-20 text-center shadow-sm">
            <div className="text-5xl">⌕</div>

            <p className="mt-5 text-xl font-bold text-[#172033]">
              No products found
            </p>

            <p className="mt-2 text-sm text-[#817a6e]">
              Try a different search or category.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
              className="mt-6 rounded-full bg-[#172033] px-6 py-3 text-sm font-semibold text-white"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* ================= CART DRAWER ================= */}

      {showCart && (
        <div className="fixed inset-0 z-50">

          {/* Backdrop */}

          <div
            className="absolute inset-0 bg-[#111827]/50 backdrop-blur-[2px]"
            onClick={() => setShowCart(false)}
          />

          {/* Drawer */}

          <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#fffdf8] shadow-2xl">

            {/* Cart header */}

            <div className="border-b border-[#e7dfcf] px-6 py-5">
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a08343]">
                    Your selection
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-[#172033]">
                    Your Cart
                  </h2>

                  <p className="mt-1 text-sm text-[#827b70]">
                    {cartCount} item{cartCount !== 1 ? "s" : ""}
                  </p>
                </div>

                <button
                  onClick={() => setShowCart(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ded6c7] text-xl text-[#6f685d] transition hover:bg-[#f2ede2] hover:text-[#172033]"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Cart items */}

            <div className="flex-1 overflow-y-auto px-6 py-5">

              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">

                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f2ede2] text-4xl">
                    🛒
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-[#172033]">
                    Your cart is empty
                  </h3>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-[#817a6e]">
                    Looks like you haven't added anything yet.
                    Let's find something for your celebration.
                  </p>

                  <button
                    onClick={() => setShowCart(false)}
                    className="mt-6 rounded-full bg-[#172033] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#273249]"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="space-y-4">

                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[#e6dfd2] bg-white p-4"
                    >
                      <div className="flex justify-between gap-4">

                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#a08343]">
                            {item.category}
                          </p>

                          <h3 className="mt-1 font-bold text-[#172033]">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-sm text-[#817a6e]">
                            ₹{item.price} × {item.quantity}
                          </p>
                        </div>

                        <p className="font-bold text-[#172033]">
                          ₹{item.price * item.quantity}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between">

                        <div className="flex items-center overflow-hidden rounded-xl border border-[#ded6c7]">
                          <button
                            onClick={() =>
                              decreaseQuantity(item.id)
                            }
                            className="px-3 py-1.5 text-lg transition hover:bg-[#f2ede2]"
                          >
                            −
                          </button>

                          <span className="min-w-9 text-center text-sm font-bold">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              increaseQuantity(item.id)
                            }
                            disabled={item.quantity >= item.stock}
                            className="px-3 py-1.5 text-lg transition hover:bg-[#f2ede2] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(item.id)
                          }
                          className="text-xs font-semibold text-[#9a5c55] transition hover:text-[#7e403a]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart footer */}

            {cart.length > 0 && (
              <div className="border-t border-[#e7dfcf] bg-white px-6 py-5">

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#817a6e]">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-[#172033]">
                    ₹{cartTotal}
                  </span>
                </div>

                <button
                  onClick={() => setShowCheckout(true)}
                  className="mt-4 w-full rounded-xl bg-[#172033] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#273249] active:scale-[0.99]"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= CHECKOUT ================= */}

      {showCheckout && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#f8f4eb]">

          <div className="mx-auto min-h-screen max-w-3xl px-5 py-6 sm:px-8 sm:py-10">

            {/* Checkout header */}

            <div className="mb-8 flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a08343]">
                  Almost there
                </p>

                <h2 className="mt-1 text-3xl font-bold text-[#172033]">
                  Checkout
                </h2>
              </div>

              <button
                onClick={() => setShowCheckout(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ded6c7] bg-white text-xl text-[#6f685d] hover:bg-[#f2ede2]"
              >
                ×
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

              {/* Customer details */}

              <div className="space-y-6">

                <section className="rounded-2xl border border-[#e6dfd2] bg-white p-5 shadow-sm sm:p-6">

                  <h3 className="text-lg font-bold text-[#172033]">
                    Your details
                  </h3>

                  <p className="mt-1 text-sm text-[#817a6e]">
                    We'll use these details to contact you about your order.
                  </p>

                  <div className="mt-5 space-y-4">

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#4d493f]">
                        Name
                      </label>

                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) =>
                          setCustomerName(e.target.value)
                        }
                        placeholder="Your name"
                        className="w-full rounded-xl border border-[#ded6c7] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#b69a5c] focus:ring-4 focus:ring-[#d5b56b]/10"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#4d493f]">
                        Phone number
                      </label>

                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) =>
                          setPhone(e.target.value)
                        }
                        placeholder="Your phone number"
                        className="w-full rounded-xl border border-[#ded6c7] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#b69a5c] focus:ring-4 focus:ring-[#d5b56b]/10"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#4d493f]">
                        Delivery address
                      </label>

                      <textarea
                        value={address}
                        onChange={(e) =>
                          setAddress(e.target.value)
                        }
                        placeholder="Enter your complete delivery address"
                        rows={4}
                        className="w-full resize-none rounded-xl border border-[#ded6c7] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#b69a5c] focus:ring-4 focus:ring-[#d5b56b]/10"
                      />
                    </div>
                  </div>
                </section>

                {/* Payment */}

                <section className="rounded-2xl border border-[#e6dfd2] bg-white p-5 shadow-sm sm:p-6">

                  <h3 className="text-lg font-bold text-[#172033]">
                    Payment method
                  </h3>

                  <p className="mt-1 text-sm text-[#817a6e]">
                    Choose how you'd like to pay.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">

                    <button
                      onClick={() => setPaymentMethod("Cash")}
                      className={`rounded-xl border p-4 text-left transition ${
                        paymentMethod === "Cash"
                          ? "border-[#172033] bg-[#f5f1e8]"
                          : "border-[#ded6c7] hover:bg-[#fcfaf5]"
                      }`}
                    >
                      <p className="text-lg">💵</p>

                      <p className="mt-2 font-bold text-[#172033]">
                        Cash
                      </p>

                      <p className="mt-1 text-xs text-[#817a6e]">
                        Pay when your order is delivered.
                      </p>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("UPI")}
                      className={`rounded-xl border p-4 text-left transition ${
                        paymentMethod === "UPI"
                          ? "border-[#172033] bg-[#f5f1e8]"
                          : "border-[#ded6c7] hover:bg-[#fcfaf5]"
                      }`}
                    >
                      <p className="text-lg">📱</p>

                      <p className="mt-2 font-bold text-[#172033]">
                        UPI
                      </p>

                      <p className="mt-1 text-xs text-[#817a6e]">
                        Pay using your preferred UPI app.
                      </p>
                    </button>
                  </div>
                </section>
              </div>

              {/* Order summary */}

              <section className="h-fit rounded-2xl border border-[#e6dfd2] bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">

                <h3 className="text-lg font-bold text-[#172033]">
                  Order summary
                </h3>

                <div className="mt-5 space-y-4">

                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#172033]">
                          {item.name}
                        </p>

                        <p className="mt-0.5 text-xs text-[#817a6e]">
                          {item.quantity} × ₹{item.price}
                        </p>
                      </div>

                      <p className="whitespace-nowrap text-sm font-bold">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="my-5 border-t border-[#e7dfcf]" />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#817a6e]">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-[#172033]">
                    ₹{cartTotal}
                  </span>
                </div>

                <button
                  onClick={placeOrder}
                  className="mt-6 w-full rounded-xl bg-[#172033] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#273249] active:scale-[0.99]"
                >
                  Place Order
                </button>

                <p className="mt-3 text-center text-[11px] leading-5 text-[#938c80]">
                  Your order will be confirmed by our team after submission.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ================= NOTIFICATION ================= */}

      {notification && (
        <div className="fixed bottom-6 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-[#e6dfd2] bg-white px-5 py-3.5 text-center text-sm font-semibold text-[#172033] shadow-2xl">
          <span className="mr-2 text-[#a08343]">✓</span>
          {notification}
        </div>
      )}
{/* Sticky product disclaimer footer */}
<div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e6dfd2] bg-[#fffdf8]/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm">
  <p className="mx-auto max-w-7xl text-center text-[11px] leading-5 text-[#7b7467] sm:text-xs">
    <span className="font-bold text-[#172033]">Please Note: </span>
    Product images are for illustrative purposes only. Actual products,
    packaging, colours, and designs may vary depending on stock availability.
  </p>
</div>
    </main>
     </>
  );
}