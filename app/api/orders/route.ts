import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
};

type OrderRequest = {
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: "Cash" | "UPI";
  items: OrderItem[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderRequest;

    const {
      customerName,
      phone,
      address,
      paymentMethod,
      items,
    } = body;

    // Basic validation
    if (
      !customerName?.trim() ||
      !phone?.trim() ||
      !address?.trim() ||
      !["Cash", "UPI"].includes(paymentMethod) ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "Please provide all required order details." },
        { status: 400 }
      );
    }

    // Validate item quantities before starting the transaction.
    // Aggregate duplicate product IDs so stock cannot be oversold
    // when the same product appears more than once in the cart.
    const requestedQuantities = new Map<
      string,
      { quantity: number; name: string }
    >();

    for (const item of items) {
      if (
        !item ||
        typeof item.id !== "string" ||
        !item.id.trim() ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return NextResponse.json(
          { error: "Invalid order item." },
          { status: 400 }
        );
      }

      const existing = requestedQuantities.get(item.id);

      const quantity = (existing?.quantity ?? 0) + item.quantity;

      if (!Number.isSafeInteger(quantity)) {
        return NextResponse.json(
          { error: "Invalid order quantity." },
          { status: 400 }
        );
      }

      requestedQuantities.set(item.id, {
        quantity,
        name: item.name,
      });
    }

    const orderRef = adminDb.collection("orders").doc();

    const result = await adminDb.runTransaction(async (transaction) => {
      let total = 0;

      const verifiedItems: {
        productId: string;
        name: string;
        unit: string;
        price: number;
        quantity: number;
      }[] = [];

      const productsToUpdate: {
        productRef: FirebaseFirestore.DocumentReference;
        newStock: number;
      }[] = [];

      // PHASE 1: Read and validate ALL products. Do not write here.
      for (const [productId, requested] of requestedQuantities) {
        const productRef = adminDb
          .collection("products")
          .doc(productId);

        const productSnapshot = await transaction.get(productRef);

        if (!productSnapshot.exists) {
          throw new Error(`Product not found: ${requested.name}`);
        }

        const product = productSnapshot.data();

        if (!product?.active) {
          throw new Error(
            `${product?.name ?? requested.name} is unavailable.`
          );
        }

        const currentStock = Number(product.stock ?? 0);

        if (
          !Number.isSafeInteger(currentStock) ||
          currentStock < 0
        ) {
          throw new Error(
            `Invalid stock information for ${product.name}.`
          );
        }

        if (currentStock < requested.quantity) {
          throw new Error(
            `Not enough stock for ${product.name}. Only ${currentStock} available.`
          );
        }

        const price = Number(product.price);

        if (!Number.isFinite(price) || price < 0) {
          throw new Error(`Invalid price for ${product.name}.`);
        }

        productsToUpdate.push({
          productRef,
          newStock: currentStock - requested.quantity,
        });

        verifiedItems.push({
          productId: productSnapshot.id,
          name: product.name,
          unit: product.unit ?? "",
          price,
          quantity: requested.quantity,
        });

        total += price * requested.quantity;
      }

      // PHASE 2: All reads are complete. Now perform writes.
      for (const product of productsToUpdate) {
        transaction.update(product.productRef, {
          stock: product.newStock,
        });
      }

      transaction.set(orderRef, {
        orderId: orderRef.id,
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        paymentMethod,
        paymentStatus: "pending",
        status: "new",
        items: verifiedItems,
        total,
        createdAt: FieldValue.serverTimestamp(),
      });

      return { total };
    });

    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
      total: result.total,
    });
  } catch (error) {
    console.error("Order creation error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to place order.";

    const isClientError =
      message === "Invalid order item." ||
      message === "Invalid order quantity." ||
      message.startsWith("Product not found:") ||
      message.includes("is unavailable.") ||
      message.startsWith("Not enough stock") ||
      message.startsWith("Invalid stock information") ||
      message.startsWith("Invalid price");

    return NextResponse.json(
      { error: message },
      { status: isClientError ? 400 : 500 }
    );
  }
}