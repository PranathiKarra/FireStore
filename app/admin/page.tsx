"use client";

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";

type OrderItem = {
  productId: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
};
type OrderStatus =
  | "new"
  | "confirmed"
  | "packed"
  | "delivered"
  | "cancelled";

type PaymentStatus = "pending" | "received";
type Order = {
  id: string;
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: "Cash" | "UPI";
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt?: Timestamp;
};

export default function AdminDashboard() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");


  useEffect(() => {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const orderList: Order[] = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            orderId: data.orderId ?? doc.id,
            customerName: data.customerName ?? "",
            phone: data.phone ?? "",
            address: data.address ?? "",
            paymentMethod: data.paymentMethod ?? "Cash",
            paymentStatus: data.paymentStatus ?? "pending",
            status: data.status ?? "new",
            items: data.items ?? [],
            total: data.total ?? 0,
            createdAt: data.createdAt,
          };
        });

        setOrders(orderList);
        setLoading(false);
      },
      (error) => {
        console.error("Orders listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);
async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
) {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      status,
    });
  } catch (error) {
    console.error("Failed to update order status:", error);
    alert("Unable to update order status.");
  }
}

async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus
) {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      paymentStatus,
    });
  } catch (error) {
    console.error("Failed to update payment status:", error);
    alert("Unable to update payment status.");
  }
}
  async function handleLogout() {
    await signOut(auth);
    router.push("/admin/login");
  }

 function formatDate(timestamp?: Timestamp) {
  if (!timestamp) {
    return "Just now";
  }

  return timestamp.toDate().toLocaleString();
}

const filteredOrders = orders.filter((order) => {
  const search = searchTerm.trim().toLowerCase();

  const matchesSearch =
    !search ||
    order.orderId.toLowerCase().includes(search) ||
    order.customerName.toLowerCase().includes(search) ||
    order.phone.includes(search);

  const matchesStatus =
    statusFilter === "all" || order.status === statusFilter;

  const matchesPayment =
    paymentFilter === "all" ||
    order.paymentStatus === paymentFilter;

  const matchesMethod =
    methodFilter === "all" ||
    order.paymentMethod.toLowerCase() === methodFilter;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesPayment &&
    matchesMethod
  );
});
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>

            <p className="text-sm text-gray-500">
              Manage your store
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Dashboard */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Orders
          </h2>

          <p className="mt-2 text-gray-600">
            Live orders from your store.
          </p>
        </div>

        ```tsx
{/* Stats */}
<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

  {/* Total Orders */}
  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">Total Orders</p>
    <p className="mt-2 text-3xl font-bold text-gray-900">
      {orders.length}
    </p>
  </div>

  {/* New Orders */}
  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">New Orders</p>
    <p className="mt-2 text-3xl font-bold text-gray-900">
      {orders.filter((order) => order.status === "new").length}
    </p>
  </div>

  {/* Pending Payments - Count */}
  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">Pending Payments</p>
    <p className="mt-2 text-3xl font-bold text-gray-900">
      {orders.filter((order) => order.paymentStatus === "pending").length}
    </p>
  </div>

{/* Orders Confirmed */}
  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">Orders Confirmed</p>
    <p className="mt-2 text-3xl font-bold text-gray-900">
      {orders.filter((order) => order.status === "confirmed").length}
    </p>
  </div>

  {/* Orders Packed */}
  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">Orders Packed</p>
    <p className="mt-2 text-3xl font-bold text-gray-900">
      {orders.filter((order) => order.status === "packed").length}
    </p>
  </div>

  {/* Orders Delivered */}
  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">Orders Delivered</p>
    <p className="mt-2 text-3xl font-bold text-gray-900">
      {orders.filter((order) => order.status === "delivered").length}
    </p>
  </div>

  {/* Payments Received - Amount */}
  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">Payments Received</p>
    <p className="mt-2 text-3xl font-bold text-green-700">
      ₹{orders
        .filter((order) => order.paymentStatus === "received")
        .reduce((sum, order) => sum + order.total, 0)
        .toLocaleString("en-IN")}
    </p>
  </div>

  {/* Payments Pending - Amount */}
  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">Pending Amount</p>
    <p className="mt-2 text-3xl font-bold text-amber-700">
      ₹{orders
        .filter((order) => order.paymentStatus === "pending")
        .reduce((sum, order) => sum + order.total, 0)
        .toLocaleString("en-IN")}
    </p>
  </div>

</div>
{/* Order Filters */}
<div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h3 className="text-lg font-semibold text-gray-900">
        Find Orders
      </h3>
      <p className="text-sm text-gray-500">
        Showing {filteredOrders.length} of {orders.length} orders
      </p>
    </div>

    <button
      type="button"
      onClick={() => {
        setSearchTerm("");
        setStatusFilter("all");
        setPaymentFilter("all");
        setMethodFilter("all");
      }}
      className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      Clear Filters
    </button>
  </div>

  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search ID, customer, phone..."
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-black"
    />

    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
    >
      <option value="all">All Order Statuses</option>
      <option value="new">New</option>
      <option value="confirmed">Confirmed</option>
      <option value="packed">Packed</option>
      <option value="delivered">Delivered</option>
      <option value="cancelled">Cancelled</option>
    </select>

    <select
      value={paymentFilter}
      onChange={(e) => setPaymentFilter(e.target.value)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
    >
      <option value="all">All Payment Statuses</option>
      <option value="pending">Payment Pending</option>
      <option value="received">Payment Received</option>
    </select>

    <select
      value={methodFilter}
      onChange={(e) => setMethodFilter(e.target.value)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
    >
      <option value="all">All Payment Methods</option>
      <option value="cash">Cash</option>
      <option value="upi">UPI</option>
    </select>
  </div>
</div>
        {/* Orders */}
        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <p className="text-gray-500">
              Loading orders...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <p className="text-lg font-semibold text-gray-900">
  {orders.length === 0
    ? "No orders yet"
    : "No matching orders"}
</p>

<p className="mt-2 text-sm text-gray-500">
  {orders.length === 0
    ? "New customer orders will appear here automatically."
    : "Try changing your search or clearing the filters."}
</p>
          </div>
        ) : (
          <div className="space-y-5">
           {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border bg-white p-6 shadow-sm"
              >
                {/* Order Header */}
                <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order ID
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-gray-900">
                      {order.orderId}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
  {/* Order Status */}
  <div>
    <label className="mb-1 block text-xs font-medium text-gray-500">
      Order Status
    </label>

    <select
      value={order.status}
      onChange={(e) =>
        updateOrderStatus(
          order.id,
          e.target.value as OrderStatus
        )
      }
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-black"
    >
      <option value="new">New</option>
      <option value="confirmed">Confirmed</option>
      <option value="packed">Packed</option>
      <option value="delivered">Delivered</option>
      <option value="cancelled">Cancelled</option>
    </select>
  </div>

  {/* Payment Status */}
  <div>
    <label className="mb-1 block text-xs font-medium text-gray-500">
      Payment
    </label>

    <select
      value={order.paymentStatus}
      onChange={(e) =>
        updatePaymentStatus(
          order.id,
          e.target.value as PaymentStatus
        )
      }
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-black"
    >
      <option value="pending">Pending</option>
      <option value="received">Received</option>
    </select>
  </div>
</div>
                </div>

                {/* Customer */}
                <div className="grid gap-6 py-5 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-semibold text-gray-900">
                      Customer
                    </h4>

                    <p className="text-sm text-gray-700">
                      {order.customerName}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {order.phone}
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      {order.address}
                    </p>
                  </div>

                  {/* Payment */}
                  <div>
                    <h4 className="mb-2 font-semibold text-gray-900">
                      Payment
                    </h4>

                    <p className="text-sm text-gray-700">
                      Method: {order.paymentMethod}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Status: {order.paymentStatus}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-5">
                  <h4 className="mb-4 font-semibold text-gray-900">
                    Items
                  </h4>

                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex justify-between gap-4 text-sm"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.name}
                          </p>

                          <p className="text-gray-500">
                            {item.quantity} × ₹{item.price}
                          </p>
                        </div>

                        <p className="font-medium text-gray-900">
                          ₹{item.price * item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t pt-4">
                    <span className="text-lg font-semibold text-gray-900">
                      Total
                    </span>

                    <span className="text-2xl font-bold text-gray-900">
                      ₹{order.total}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}