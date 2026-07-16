"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";

export default function POSPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState<any[]>([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [discount, setDiscount] = useState("");
    const [cash, setCash] = useState("");
    const [online, setOnline] = useState("");
    const [confirmClear, setConfirmClear] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: "", price: "", category_id: "", image: "", is_popular: false, });
    const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
    const [loading, setLoading] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [savingProduct, setSavingProduct] = useState(false);
    const [savingCustomer, setSavingCustomer] = useState(false);


    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);

        const { data: p } = await supabase.from("products").select("*");
        const { data: c } = await supabase.from("categories").select("*");
        const { data: u } = await supabase.from("customers").select("*");

        setProducts(p || []);
        setCategories(c || []);
        setCustomers(u || []);
        setLoading(false);
    }

    // FILTER
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchCategory = selectedCategory
                ? p.category_id === selectedCategory
                : true;

            const matchSearch = p.name
                .toLowerCase()
                .includes(search.toLowerCase());

            return matchCategory && matchSearch;
        });
    }, [products, selectedCategory, search]);

    // CART
    function addToCart(p: any) {
        setCart((prev) => {
            const exist = prev.find((i) => i.id === p.id);
            if (exist) {
                return prev.map((i) =>
                    i.id === p.id ? { ...i, qty: i.qty + 1 } : i
                );
            }
            return [...prev, { ...p, qty: 1, extra_price: 0 }];
        });
    }

    function updateQty(id: number, type: string) {
        setCart((prev) =>
            prev
                .map((i) =>
                    i.id === id
                        ? {
                            ...i,
                            qty: type === "inc" ? i.qty + 1 : i.qty - 1,
                        }
                        : i
                )
                .filter((i) => i.qty > 0)
        );
    }

    function removeItem(id: number) {
        setCart((prev) => prev.filter((i) => i.id !== id));
    }

    const subtotal = cart.reduce(
        (sum, i) => sum + i.price * i.qty + (i.extra_price || 0),
        0
    );

    const finalTotal = subtotal - Number(discount || 0);

    function resetAll() {
        setCart([]);
        setDiscount("");
        setCash("");
        setOnline("");
        setSelectedCustomer(null);
        setCustomerSearch("");
        setConfirmClear(false);
    }

    // SAVE
    async function handleSave(sendWA = false) {
        if (cart.length === 0) return toast.error("Cart empty");

        if (!selectedCustomer) {
            return toast.error("Select customer");
        }

        const userId = localStorage.getItem("user_id");

        const totalPay = Number(cash || 0) + Number(online || 0);
        if (totalPay !== finalTotal)
            return toast.error("Payment mismatch");

        // ✅ generate bill number
        const billNumber = `BILL-${Date.now()}`;

        // ✅ get logged user (if using supabase auth)
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const { data: order, error } = await supabase
            .from("orders")
            .insert([
                {
                    bill_number: billNumber,
                    total: subtotal,
                    discount: Number(discount || 0),
                    final_total: finalTotal,
                    payment_cash: Number(cash || 0),
                    payment_online: Number(online || 0),
                    customer_id: selectedCustomer?.id || null,
                    created_by: userId ? Number(userId) : null,
                },
            ])
            .select()
            .single();

        if (error || !order) {
            return toast.error("Order failed");
        }

        const items = cart.map((i) => ({
            order_id: order.id,
            product_id: i.id || null, // ✅ IMPORTANT
            name: i.name,
            price: i.price,
            qty: i.qty,
            extra_price: i.extra_price || 0,
        }));

        await supabase.from("order_items").insert(items);

        toast.success("Saved");

        // ✅ WhatsApp send
        // ✅ WhatsApp send (FULL BILL FORMAT)
        if (sendWA && selectedCustomer?.phone) {

            // 🕒 format DB time (IMPORTANT)
            const billDate = new Date(order.created_at).toLocaleString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
            });

            // 🧾 items list
            const itemsText = cart
                .map((i) => {
                    const total = i.price * i.qty + (i.extra_price || 0);
                    return `${i.name} ${i.qty} x ${i.price} = ${total}`;
                })
                .join("\n");

            // ➕ extra total
            const extraTotal = cart.reduce(
                (sum, i) => sum + (i.extra_price || 0),
                0
            );

            const customerName = order.customers?.name || "Customer";

            // 💬 final message
            const message = `
                Hi ${customerName} 🙂

                *Bismillah Juice & Snacks*

                *BILL*

                Bill ID: ${order.bill_number}
                Date: ${billDate}

                *Items:*
                ${itemsText}

                Subtotal: ₹${order.total}
                Discount: ₹${order.discount}
                Extra Charges: ₹${extraTotal}

                *Total: ₹${order.final_total}*

                Thank you 🙂
            `;

            const text = encodeURIComponent(message);

            window.open(`https://wa.me/91${selectedCustomer.phone}?text=${text}`);
        }

        resetAll();
    }

    async function uploadImage(file: File) {
        try {
            const allowed = ["image/jpeg", "image/png", "image/webp"];
            if (!allowed.includes(file.type)) {
                toast.error("Only JPG, PNG, WEBP allowed");
                return null;
            }

            const compressed = await imageCompression(file, {
                maxSizeMB: 0.6,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
            });

            const fileName = `${Date.now()}-${compressed.name}`;

            const { error } = await supabase.storage
                .from("products")
                .upload(fileName, compressed);

            if (error) throw error;

            const { data } = supabase.storage
                .from("products")
                .getPublicUrl(fileName);

            return data.publicUrl;
        } catch (err) {
            toast.error("Image upload failed");
            return null;
        }
    }

    // ADD PRODUCT
    async function createProduct() {
        if (savingProduct) return;

        if (!newProduct.name || !newProduct.price || !newProduct.category_id) {
            return toast.error("Fill all fields");
        }

        setSavingProduct(true);

        let imageUrl: string | null = "";

        if (imageFile) {
            imageUrl = await uploadImage(imageFile);
            if (!imageUrl) {
                setSavingProduct(false);
                return;
            }
        }

        const { data, error } = await supabase
            .from("products")
            .insert([
                {
                    ...newProduct,
                    price: Number(newProduct.price),
                    image: imageUrl,
                },
            ])
            .select()
            .single();

        if (error || !data) {
            setSavingProduct(false);
            return toast.error("Failed to add product");
        }

        // ✅ update product list
        setProducts((prev) => [data, ...prev]);

        // ✅ IMPORTANT: add to cart immediately
        addToCart(data);

        // reset
        setShowAddProduct(false);
        setNewProduct({
            name: "",
            price: "",
            category_id: "",
            image: "",
            is_popular: false,
        });
        setImageFile(null);

        toast.success("Product Added");

        setSavingProduct(false);
    }

    // ADD CUSTOMER
    async function createCustomer() {
        if (savingCustomer) return;

        if (!newCustomer.name || !newCustomer.phone) {
            return toast.error("Fill details");
        }

        setSavingCustomer(true);

        const { data, error } = await supabase
            .from("customers")
            .insert([newCustomer])
            .select()
            .single();

        if (error || !data) {
            setSavingCustomer(false);
            return toast.error("Failed");
        }

        // update list
        setCustomers((prev) => [data, ...prev]);

        // ✅ IMPORTANT: auto select customer
        setSelectedCustomer(data);
        setCustomerSearch(`${data.name} - ${data.phone}`);

        setShowAddCustomer(false);
        setNewCustomer({ name: "", phone: "" });

        toast.success("Customer added");

        setSavingCustomer(false);
    }

    const filteredCustomers = customers.filter((c) =>
        (c.name + c.phone)
            .toLowerCase()
            .includes(customerSearch.toLowerCase())
    );

    return (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* LEFT / CENTER */}
            <div className="lg:col-span-2 flex flex-col">

                {/* TOP CONTROLS */}
                <div>
                    <input
                        placeholder="Search product..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />

                    {/* CATEGORY */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                            All
                        </button>

                        {categories.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedCategory(c.id)}
                                className={`px-3 py-1 rounded-lg border text-sm transition
    ${selectedCategory === c.id
                                        ? "bg-primary text-white border-primary"
                                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                                    }
  `}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => setShowAddProduct(true)}
                            className="bg-primary text-white px-4 py-2 rounded-lg"
                        >
                            + Add Item
                        </button>
                    </div>
                </div>

                {/* PRODUCTS SCROLL AREA */}
                <div className="h-[80vh] overflow-hidden">
                    <div className="h-full overflow-y-auto pr-1">

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-max">

                            {loading ? (
                                [...Array(8)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white border border-gray-200 rounded-xl p-3 animate-pulse"
                                    >
                                        <div className="aspect-[3/4] bg-gray-200 rounded mb-2" />
                                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                                    </div>
                                ))
                            ) : filteredProducts.map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md cursor-pointer h-fit"
                                >
                                    <div className="aspect-[3/4] overflow-hidden rounded mb-2">
                                        <img
                                            src={p.image || "/placeholder.png"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <p className="text-sm font-semibold text-gray-900">
                                        {p.name}
                                    </p>
                                    <p className="text-primary text-sm">₹{p.price}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT BILLING */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col">

                {/* CUSTOMER */}
                <div className="mb-3">
                    <input
                        placeholder="Search customer..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary"
                    />

                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg mt-2">
                        {filteredCustomers.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => {
                                    setSelectedCustomer(c);
                                    setCustomerSearch(c.name + " - " + c.phone);
                                }}
                                className="p-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                                {c.name} - {c.phone}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowAddCustomer(true)}
                        className="text-primary text-sm mt-1"
                    >
                        + Add Customer
                    </button>
                </div>

                {/* BILLING SCROLL AREA */}
                <div className="h-[75vh] overflow-hidden flex flex-col">

                    {/* ITEMS SCROLL */}
                    <div className="flex-1 overflow-y-auto pr-1">
                        {cart.map((i) => (
                            <div
                                key={i.id}
                                className="flex justify-between items-center border-b border-gray-200 py-2"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {i.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        ₹{i.price} x {i.qty}
                                    </p>
                                </div>
                                <input
                                    type="number"
                                    placeholder="Extra ₹"
                                    value={i.extra_price || ""}
                                    onChange={(e) =>
                                        setCart((prev) =>
                                            prev.map((item) =>
                                                item.id === i.id
                                                    ? { ...item, extra_price: Number(e.target.value) }
                                                    : item
                                            )
                                        )
                                    }
                                    className="w-16 border border-gray-300 rounded text-xs text-gray-700 px-1"
                                />
                                <div className="flex gap-1">
                                    <button onClick={() => updateQty(i.id, "dec")} className="px-2 border border-gray-300 rounded text-gray-700">-</button>
                                    <button onClick={() => updateQty(i.id, "inc")} className="px-2 border border-gray-300 rounded text-gray-700">+</button>
                                    <button onClick={() => removeItem(i.id)} className="px-2 text-red-500">x</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* FIXED BOTTOM */}
                    <div className="pt-3 border-t border-gray-200">

                        <p className="text-gray-700 text-sm">Subtotal: ₹{subtotal}</p>

                        <input
                            placeholder="Discount"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            className="w-full p-2 border border-gray-300 text-gray-900 rounded-lg mt-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />

                        <p className="text-lg font-semibold text-gray-900 mt-2">
                            Total: ₹{finalTotal}
                        </p>

                        <input
                            placeholder="Cash"
                            value={cash}
                            onChange={(e) => setCash(e.target.value)}
                            className="w-full p-2 border border-gray-300 text-gray-900 rounded-lg mt-2"
                        />

                        <input
                            placeholder="Online"
                            value={online}
                            onChange={(e) => setOnline(e.target.value)}
                            className="w-full p-2 border border-gray-300 text-gray-900 rounded-lg mt-2"
                        />

                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => setConfirmClear(true)}
                                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-100"
                            >
                                Clear
                            </button>

                            <button
                                onClick={() => handleSave(false)}
                                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90"
                            >
                                Save
                            </button>

                            <button
                                onClick={() => handleSave(true)}
                                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-100"
                            >
                                Save & Send
                            </button>
                        </div>

                    </div>
                </div>
            </div>
            {showAddCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">

                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowAddCustomer(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white w-[95%] max-w-md p-6 rounded-xl shadow-xl border border-gray-200">

                        <h2 className="text-lg font-semibold mb-4 text-gray-800">
                            Add Customer
                        </h2>

                        <input
                            placeholder="Name"
                            value={newCustomer.name}
                            onChange={(e) =>
                                setNewCustomer({ ...newCustomer, name: e.target.value })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />

                        <input
                            placeholder="Phone"
                            value={newCustomer.phone}
                            onChange={(e) =>
                                setNewCustomer({ ...newCustomer, phone: e.target.value })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowAddCustomer(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={createCustomer}
                                disabled={savingCustomer}
                                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                            >
                                {savingCustomer ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAddProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">

                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowAddProduct(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white w-[95%] max-w-md p-6 rounded-xl shadow-xl border border-gray-200">

                        <h2 className="text-lg font-semibold mb-4 text-gray-800">
                            Add Product
                        </h2>

                        {/* Name */}
                        <input
                            placeholder="Product Name"
                            value={newProduct.name}
                            onChange={(e) =>
                                setNewProduct({ ...newProduct, name: e.target.value })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />

                        {/* Price */}
                        <input
                            type="number"
                            placeholder="Price"
                            value={newProduct.price}
                            onChange={(e) =>
                                setNewProduct({ ...newProduct, price: e.target.value })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />

                        {/* Category */}
                        <select
                            value={newProduct.category_id}
                            onChange={(e) =>
                                setNewProduct({ ...newProduct, category_id: e.target.value })
                            }
                            className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        >
                            <option value="">Select Category</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        {/* Image */}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setImageFile(e.target.files?.[0] || null)
                            }
                            className="w-full mb-3 text-sm text-gray-600"
                        />

                        {/* Preview */}
                        {(imageFile || newProduct.image) && (
                            <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-1">Preview</p>
                                <img
                                    src={
                                        imageFile
                                            ? URL.createObjectURL(imageFile)
                                            : newProduct.image
                                    }
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                />
                            </div>
                        )}

                        {/* Popular */}
                        <label className="flex items-center gap-2 mb-3 text-gray-700">
                            <input
                                type="checkbox"
                                checked={newProduct.is_popular}
                                onChange={(e) =>
                                    setNewProduct({
                                        ...newProduct,
                                        is_popular: e.target.checked,
                                    })
                                }
                            />
                            Mark as Popular
                        </label>

                        {/* Buttons */}
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowAddProduct(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={createProduct}
                                disabled={savingProduct}
                                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                            >
                                {savingProduct ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmClear && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setConfirmClear(false)}
                    />

                    <div className="relative bg-white w-[90%] max-w-sm p-5 rounded-xl shadow-xl border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            Clear Bill?
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            This will remove all items.
                        </p>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setConfirmClear(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={() => {
                                    resetAll();
                                    setConfirmClear(false);
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}